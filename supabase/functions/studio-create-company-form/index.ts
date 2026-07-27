import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const VALID_FORM_TYPES = ['signature_only', 'hepb_status', 'job_description', 'direct_deposit', 'reference_check', 'wotc']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, form_key, title, form_type, visible_to_roles, admin_signable, requires_signature } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!form_key || !form_key.trim()) throw new Error('form_key is required')
    if (!title || !title.trim()) throw new Error('title is required')
    if (!VALID_FORM_TYPES.includes(form_type)) throw new Error(`Invalid form_type "${form_type}"`)
    if (!Array.isArray(visible_to_roles) || visible_to_roles.length === 0) {
      throw new Error('visible_to_roles must be a non-empty array')
    }

    const defaultConfig = form_type === 'hepb_status'
      ? { intro: [], options: [], field_mapping: [] }
      : form_type === 'signature_only'
        ? { field_mapping: [] }
        : {}

    const { data: existing, error: maxError } = await supabase
      .from('company_forms')
      .select('form_order')
      .eq('company_id', companyId)
      .order('form_order', { ascending: false })
      .limit(1)

    if (maxError) throw maxError
    const nextOrder = (existing?.[0]?.form_order || 0) + 10

    const { data, error } = await supabase
      .from('company_forms')
      .insert({
        company_id: companyId,
        form_key: form_key.trim(),
        title: title.trim(),
        form_type,
        form_order: nextOrder,
        content: [],
        config: defaultConfig,
        visible_to_roles,
        admin_signable: !!admin_signable,
        requires_signature: requires_signature !== false,
      })
      .select('id, form_key, title, form_order, form_type, visible_to_roles, admin_signable, requires_signature')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error(`A form with key "${form_key.trim()}" already exists for this company`)
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
