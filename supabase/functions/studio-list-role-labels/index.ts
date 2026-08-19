import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId } = await req.json()
    if (!companyId) throw new Error('companyId is required')

    const [{ data: roles, error: rolesError }, { data: caregivers, error: caregiversError }] = await Promise.all([
      supabase
        .from('role_labels')
        .select('id, role_key, display_label, required_tax_forms')
        .eq('company_id', companyId)
        .order('display_label', { ascending: true }),
      supabase
        .from('caregivers')
        .select('role')
        .eq('company_id', companyId),
    ])

    if (rolesError) throw rolesError
    if (caregiversError) throw caregiversError

    const counts = {}
    for (const { role } of caregivers || []) {
      counts[role] = (counts[role] || 0) + 1
    }

    const result = (roles || []).map((role) => ({
      ...role,
      caregiver_count: counts[role.role_key] || 0,
    }))

    return new Response(
      JSON.stringify(result),
      { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const status = err.message === 'Unauthorized' ? 401 : 500
    return new Response(
      JSON.stringify({ error: err.message }),
      { status, headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
