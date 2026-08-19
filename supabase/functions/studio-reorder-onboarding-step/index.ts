import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, stepId, direction } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!stepId) throw new Error('stepId is required')
    if (direction !== 'up' && direction !== 'down') throw new Error('direction must be "up" or "down"')

    const { data: steps, error: stepsError } = await supabase
      .from('onboarding_steps')
      .select('id, step_order')
      .eq('company_id', companyId)
      .order('step_order', { ascending: true })

    if (stepsError) throw stepsError

    const index = (steps || []).findIndex((s) => s.id === stepId)
    if (index === -1) throw new Error('Step not found')

    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= steps.length) {
      throw new Error(`Already at the ${direction === 'up' ? 'top' : 'bottom'}`)
    }

    const current = steps[index]
    const neighbor = steps[neighborIndex]

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('onboarding_steps').update({ step_order: neighbor.step_order }).eq('id', current.id),
      supabase.from('onboarding_steps').update({ step_order: current.step_order }).eq('id', neighbor.id),
    ])

    if (error1) throw error1
    if (error2) throw error2

    const { data: updatedSteps, error: refetchError } = await supabase
      .from('onboarding_steps')
      .select('id, step_key, step_name, step_order, form_data_key, visible_to_roles')
      .eq('company_id', companyId)
      .order('step_order', { ascending: true })

    if (refetchError) throw refetchError

    return new Response(
      JSON.stringify(updatedSteps),
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
