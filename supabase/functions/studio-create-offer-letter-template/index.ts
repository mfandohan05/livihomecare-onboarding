import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, role_key, title, requires_address, uses_custom_pdf } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!role_key || !role_key.trim()) throw new Error('role_key is required')
    if (!title || !title.trim()) throw new Error('title is required')

    const { data, error } = await supabase
      .from('offer_letter_templates')
      .insert({
        company_id: companyId,
        role_key: role_key.trim(),
        title: title.trim(),
        requires_address: !!requires_address,
        uses_custom_pdf: !!uses_custom_pdf,
        content: [],
        acknowledgment_text: '',
      })
      .select('id, role_key, title, requires_address, uses_custom_pdf')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error(`An offer letter template for role "${role_key.trim()}" already exists for this company`)
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
