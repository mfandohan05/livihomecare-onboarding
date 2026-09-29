import { serviceClient } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 72

// Creates the Supabase Auth user for a caregiver and links it to their row.
// The email always comes from the caregivers row — never from the request. The
// emailed onboarding link (token) is the proof of ownership, so the address is
// marked confirmed. Expected, user-fixable failures return 200 with `error` so
// the client can show them inline.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, password } = await req.json()
    if (!token || typeof token !== 'string') return json({ error: 'Invalid or expired link' }, 404)

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return json({ success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return json({ success: false, error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` })
    }

    const supabase = serviceClient()

    const { data: caregiver, error: lookupError } = await supabase
      .from('caregivers')
      .select('id, email, status, link_expires_at, user_id')
      .eq('token', token)
      .maybeSingle()

    if (lookupError || !caregiver) return json({ error: 'Invalid or expired link' }, 404)

    if (caregiver.user_id) {
      return json({ success: false, alreadyExists: true, error: 'An account already exists. Please sign in.' })
    }

    const isExpired = caregiver.status === 'pending' &&
      caregiver.link_expires_at &&
      new Date() > new Date(caregiver.link_expires_at)
    if (isExpired) return json({ error: 'Invalid or expired link' }, 404)

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: caregiver.email,
      password,
      email_confirm: true,
    })

    if (createError || !created?.user) {
      if (createError?.code === 'weak_password') {
        return json({ success: false, error: createError.message })
      }
      // An auth user already exists for this email (another caregiver record, an
      // admin, ...). Never link to it — that would hand this link's holder an
      // account they didn't prove they own.
      if (createError?.code === 'email_exists' || createError?.code === 'user_already_exists') {
        return json({
          success: false,
          error: 'An account with this email already exists. Please sign in, or contact your administrator.',
        })
      }
      throw createError ?? new Error('Failed to create user')
    }

    // Link only if still unlinked, so two simultaneous sign-ups can't both win.
    const { data: linked, error: linkError } = await supabase
      .from('caregivers')
      .update({ user_id: created.user.id })
      .eq('id', caregiver.id)
      .is('user_id', null)
      .select('id')

    if (linkError || !linked?.length) {
      await supabase.auth.admin.deleteUser(created.user.id)
      if (linkError) throw linkError
      return json({ success: false, alreadyExists: true, error: 'An account already exists. Please sign in.' })
    }

    return json({ success: true })
  } catch (err) {
    console.error('caregiver-create-account failed:', err)
    return json({ error: 'Could not create account' }, 500)
  }
})
