import { getCallerUser, isAdminOfCompany, serviceClient } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const NOT_FOUND = () => json({ error: 'Invalid or expired link' }, 404)

// The token is only a pointer to a caregiver record — it never grants access
// on its own once that caregiver has an account. Possible outcomes:
//   ok            the caller is the account-holding caregiver (or an admin of
//                 the caregiver's company, for preview) — full record returned
//   needs_signin  the caregiver has an account and the caller isn't them
//   needs_signup  the caregiver has no account yet — only name/email returned
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string') return NOT_FOUND()

    const supabase = serviceClient()

    const { data: caregiver, error } = await supabase
      .from('caregivers')
      .select('*, company_id')
      .eq('token', token)
      .maybeSingle()

    if (error || !caregiver) return NOT_FOUND()

    const user = await getCallerUser(req, supabase)

    if (user) {
      if (caregiver.user_id && caregiver.user_id === user.id) {
        return json({ state: 'ok', viewer: 'caregiver', caregiver })
      }
      if (await isAdminOfCompany(supabase, user.id, caregiver.company_id)) {
        return json({ state: 'ok', viewer: 'admin', caregiver })
      }
    }

    if (caregiver.user_id) return json({ state: 'needs_signin' })

    // No account yet: an unused link can still expire.
    const isExpired = caregiver.status === 'pending' &&
      caregiver.link_expires_at &&
      new Date() > new Date(caregiver.link_expires_at)

    if (isExpired) {
      await supabase.from('caregivers').update({ token: null }).eq('id', caregiver.id)
      return NOT_FOUND()
    }

    return json({ state: 'needs_signup', name: caregiver.name, email: caregiver.email })
  } catch {
    return NOT_FOUND()
  }
})
