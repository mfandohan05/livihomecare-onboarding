import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { serviceClient } from '../_shared/caregiverAccess.ts'
import {
  RecoveryLink,
  generateRecoveryLink,
  sendPasswordResetEmail,
  signsInWithGoogleOnly,
} from '../_shared/passwordResetEmail.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COOLDOWN_MS = 60 * 1000

type Target = { user: User; name: string | null; recovery: RecoveryLink | null }

async function findTarget(supabase: SupabaseClient, email: string): Promise<Target | null> {
  const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`)

  const { data: byInviteEmail } = await supabase
    .from('caregivers')
    .select('name, user_id')
    .ilike('email', pattern)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (byInviteEmail?.user_id) {
    const { data } = await supabase.auth.admin.getUserById(byInviteEmail.user_id)
    return data?.user ? { user: data.user, name: byInviteEmail.name, recovery: null } : null
  }

  const recovery = await generateRecoveryLink(supabase, email)
  if (!recovery) return null

  const { data: bySignInEmail } = await supabase
    .from('caregivers')
    .select('name')
    .eq('user_id', recovery.user.id)
    .limit(1)
    .maybeSingle()

  return bySignInEmail ? { user: recovery.user, name: bySignInEmail.name, recovery } : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!EMAIL_RE.test(email) || email.length > 320) {
      return json({ success: false, error: 'Please enter a valid email address.' })
    }

    const supabase = serviceClient()
    const target = await findTarget(supabase, email)
    if (!target?.user.email) return json({ success: true })

    const { data: adminTarget } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', target.user.id)
      .maybeSingle()
    if (adminTarget) return json({ success: true })

    const lastSentRaw = target.user.app_metadata?.password_reset_sent_at
    const lastSent = typeof lastSentRaw === 'string' ? new Date(lastSentRaw).getTime() : 0
    if (Date.now() - lastSent < COOLDOWN_MS) return json({ success: true })

    const recovery = target.recovery ?? await generateRecoveryLink(supabase, target.user.email)
    if (!recovery) {
      return json({ success: false, error: 'We could not send the reset email. Please try again.' })
    }

    const sent = await sendPasswordResetEmail({
      to: email,
      link: recovery.link,
      name: target.name,
      googleOnly: signsInWithGoogleOnly(target.user),
    })
    if (!sent) {
      return json({ success: false, error: 'We could not send the reset email. Please try again.' })
    }

    await supabase.auth.admin.updateUserById(target.user.id, {
      app_metadata: { password_reset_sent_at: new Date().toISOString() },
    })

    return json({ success: true })
  } catch (err) {
    console.error('request-password-reset failed:', err)
    return json({ success: false, error: 'We could not send the reset email. Please try again.' }, 500)
  }
})
