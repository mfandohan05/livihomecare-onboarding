import { getCallerUser, serviceClient } from '../_shared/caregiverAccess.ts'
import {
  consumeProof,
  findValidProof,
  findVerifiableCaregiver,
} from '../_shared/caregiverVerification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SSO_PROVIDERS = ['google']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, proof } = await req.json()
    const supabase = serviceClient()

    const user = await getCallerUser(req, supabase)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const identities = user.identities ?? []
    const hasSsoIdentity = identities.some((i) => SSO_PROVIDERS.includes(i.provider))
    if (!hasSsoIdentity) {
      return json({ success: false, error: 'Sign in with Google to continue.' })
    }

    const caregiver = await findVerifiableCaregiver(supabase, token)
    if (!caregiver) return json({ error: 'Invalid or expired link' }, 404)

    const proofRowId = await findValidProof(supabase, caregiver.id, proof)
    if (!proofRowId) {
      return json({ success: false, verificationRequired: true, error: 'Please verify your identity again.' })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (admin) {
      return json({
        success: false,
        error: 'This account cannot be used for employee onboarding. Please use a different account.',
      })
    }

    const { data: existing } = await supabase
      .from('caregivers')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', caregiver.company_id)
      .neq('id', caregiver.id)
      .limit(1)
    if (existing?.length) {
      return json({
        success: false,
        error: 'This account is already linked to another employee at this company. Please use a different account.',
      })
    }

    const { data: linked, error: linkError } = await supabase
      .from('caregivers')
      .update({ user_id: user.id })
      .eq('id', caregiver.id)
      .is('user_id', null)
      .select('id')

    if (linkError) throw linkError
    if (!linked?.length) {
      return json({ success: false, alreadyExists: true, error: 'An account already exists. Please sign in.' })
    }

    await consumeProof(supabase, proofRowId)
    return json({ success: true })
  } catch (err) {
    console.error('caregiver-link-sso failed:', err)
    return json({ success: false, error: 'Could not link your account. Please try again.' }, 500)
  }
})
