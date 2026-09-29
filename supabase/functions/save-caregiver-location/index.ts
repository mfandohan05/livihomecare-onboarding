import { requireOwnCaregiver } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// The caregiver is derived from the verified JWT — the request never names one.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json()
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ error: 'Invalid coordinates' }, 400)
    }

    const { supabase, caregiver } = await requireOwnCaregiver(req)

    const { error } = await supabase
      .from('caregivers')
      .update({ lat, lng })
      .eq('id', caregiver.id)

    if (error) throw error

    return json({ success: true })
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
})
