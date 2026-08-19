import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'
import { ONBOARDING_STEP_TYPES } from '../_shared/onboardingStepCatalog.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, taxFormVariant, visible_to_roles } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')
    if (!Array.isArray(visible_to_roles) || visible_to_roles.length === 0) {
      throw new Error('visible_to_roles must be a non-empty array')
    }

    const { data: existing, error: fetchError } = await supabase
      .from('onboarding_steps')
      .select('step_key')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (fetchError || !existing) throw new Error('Step not found')

    const updatePayload = { visible_to_roles }

    if (existing.step_key === 'tax_forms' && taxFormVariant) {
      const catalogEntry = ONBOARDING_STEP_TYPES.find((t) => t.stepType === 'tax_forms')
      const variant = catalogEntry?.variants?.find((v) => v.key === taxFormVariant)
      if (!variant) throw new Error(`Unknown tax form variant "${taxFormVariant}"`)
      updatePayload.step_name = variant.step_name
    }

    const { data, error } = await supabase
      .from('onboarding_steps')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id, step_key, step_name, step_order, form_data_key, visible_to_roles')
      .single()

    if (error) throw error

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
