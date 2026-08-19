import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const VALID_TAX_FORMS = ['i9', 'w4', 'w9', 'nc4ez']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, display_label, required_tax_forms } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')
    if (!display_label || !display_label.trim()) throw new Error('display_label is required')

    const taxForms = Array.isArray(required_tax_forms) ? required_tax_forms : []
    const invalid = taxForms.filter((f) => !VALID_TAX_FORMS.includes(f))
    if (invalid.length > 0) throw new Error(`Invalid required_tax_forms: ${invalid.join(', ')}`)

    const { data, error } = await supabase
      .from('role_labels')
      .update({
        display_label: display_label.trim(),
        required_tax_forms: taxForms,
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id, role_key, display_label, required_tax_forms')
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
