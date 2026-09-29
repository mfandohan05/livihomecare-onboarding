import { getCallerUser, serviceClient } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Returns the caregiver record belonging to the signed-in user. Takes no
// parameters on purpose: the record is derived only from the verified JWT, so a
// caller can never ask for someone else's. `caregiver: null` means the user is
// signed in but has no onboarding record (e.g. an admin).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = serviceClient()
    const user = await getCallerUser(req, supabase)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: caregiver, error } = await supabase
      .from('caregivers')
      .select('*, company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return json({ caregiver: caregiver ?? null })
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
})
