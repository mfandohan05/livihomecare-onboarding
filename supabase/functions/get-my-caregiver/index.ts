import { getCallerUser, listOwnCaregivers, pickOwnCaregiver, serviceClient } from '../_shared/caregiverAccess.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = serviceClient()
    const user = await getCallerUser(req, supabase)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    let companyId: unknown = null
    try {
      const body = await req.json()
      companyId = body?.companyId ?? null
    } catch {
      companyId = null
    }

    const rows = await listOwnCaregivers(supabase, user.id)
    const caregiver = pickOwnCaregiver(rows, companyId)

    let companies: { companyId: string; companyName: string | null; status: unknown }[] = []
    if (rows.length > 1) {
      const { data: names } = await supabase
        .from('company_data')
        .select('company_id, company_name')
        .in('company_id', rows.map((r) => r.company_id))
      const nameById = new Map((names ?? []).map((n) => [n.company_id, n.company_name]))
      companies = rows.map((r) => ({
        companyId: r.company_id,
        companyName: nameById.get(r.company_id) ?? null,
        status: r.status,
      }))
    }

    return json({ caregiver: caregiver ?? null, companies })
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
})
