import { requireOwnCaregiver } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Caregivers may only self-report these two transitions; every other status
// change (pending, cancelled, etc.) is admin-only and goes through the
// authenticated admin flow, not this function.
const ALLOWED_STATUSES = ['in_progress', 'completed']

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
    const { status } = await req.json()
    if (!ALLOWED_STATUSES.includes(status)) return json({ error: 'Invalid status' }, 400)

    const { supabase, caregiver } = await requireOwnCaregiver(req)

    const { error } = await supabase
      .from('caregivers')
      .update({ status })
      .eq('id', caregiver.id)

    if (error) throw error

    return json({ success: true })
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
})
