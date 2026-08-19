import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

// role_key is intentionally not editable here: it's the literal caregivers.role value
// this template applies to, and it's baked into the Storage template path
// (templates/{companyId}/offer_letter_{role_key}.pdf) that generate-offer-letter reads
// from. Renaming it after a template's been uploaded would orphan that file.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, title, requires_address, uses_custom_pdf, content, acknowledgment_text } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const updatePayload = {}
    if (title !== undefined) {
      if (!title.trim()) throw new Error('title cannot be empty')
      updatePayload.title = title.trim()
    }
    if (requires_address !== undefined) updatePayload.requires_address = !!requires_address
    if (uses_custom_pdf !== undefined) updatePayload.uses_custom_pdf = !!uses_custom_pdf
    if (content !== undefined) {
      if (!Array.isArray(content)) throw new Error('content must be an array')
      updatePayload.content = content
    }
    if (acknowledgment_text !== undefined) updatePayload.acknowledgment_text = acknowledgment_text

    const { data, error } = await supabase
      .from('offer_letter_templates')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id, role_key, title, content, requires_address, acknowledgment_text, uses_custom_pdf')
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
