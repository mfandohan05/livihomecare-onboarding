import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, formId, direction } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!formId) throw new Error('formId is required')
    if (direction !== 'up' && direction !== 'down') throw new Error('direction must be "up" or "down"')

    const { data: forms, error: formsError } = await supabase
      .from('company_forms')
      .select('id, form_order')
      .eq('company_id', companyId)
      .order('form_order', { ascending: true })

    if (formsError) throw formsError

    const index = (forms || []).findIndex((f) => f.id === formId)
    if (index === -1) throw new Error('Form not found')

    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= forms.length) {
      throw new Error(`Already at the ${direction === 'up' ? 'top' : 'bottom'}`)
    }

    const current = forms[index]
    const neighbor = forms[neighborIndex]

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('company_forms').update({ form_order: neighbor.form_order }).eq('id', current.id),
      supabase.from('company_forms').update({ form_order: current.form_order }).eq('id', neighbor.id),
    ])

    if (error1) throw error1
    if (error2) throw error2

    const { data: updatedForms, error: refetchError } = await supabase
      .from('company_forms')
      .select('id, form_key, title, form_order, form_type, visible_to_roles, admin_signable, requires_signature')
      .eq('company_id', companyId)
      .order('form_order', { ascending: true })

    if (refetchError) throw refetchError

    return new Response(
      JSON.stringify(updatedForms),
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
