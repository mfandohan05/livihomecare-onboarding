import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId } = await req.json()
    if (!companyId) throw new Error('companyId is required')

    const [{ data: steps, error: stepsError }, { count: inProgressCount, error: countError }] = await Promise.all([
      supabase
        .from('onboarding_steps')
        .select('id, step_key, step_name, step_order, form_data_key, visible_to_roles')
        .eq('company_id', companyId)
        .order('step_order', { ascending: true }),
      supabase
        .from('caregivers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'in_progress'),
    ])

    if (stepsError) throw stepsError
    if (countError) throw countError

    return new Response(
      JSON.stringify({ steps: steps || [], in_progress_caregiver_count: inProgressCount || 0 }),
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
