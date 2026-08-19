import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { resolveStepType } from '../_shared/onboardingStepCatalog.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, stepType, taxFormVariant, visible_to_roles } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!Array.isArray(visible_to_roles) || visible_to_roles.length === 0) {
      throw new Error('visible_to_roles must be a non-empty array')
    }

    const { step_key, step_name, form_data_key } = resolveStepType(stepType, taxFormVariant)

    const { data: existing, error: maxError } = await supabase
      .from('onboarding_steps')
      .select('step_order')
      .eq('company_id', companyId)
      .order('step_order', { ascending: false })
      .limit(1)

    if (maxError) throw maxError
    const nextOrder = (existing?.[0]?.step_order || 0) + 10

    const { data, error } = await supabase
      .from('onboarding_steps')
      .insert({
        company_id: companyId,
        step_key,
        step_name,
        form_data_key,
        step_order: nextOrder,
        visible_to_roles,
      })
      .select('id, step_key, step_name, step_order, form_data_key, visible_to_roles')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('This step type has already been added for this company')
      throw error
    }

    return new Response(
      JSON.stringify(data),
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
