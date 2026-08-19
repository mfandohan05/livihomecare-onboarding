import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, sectionId, companyId, title, content } = await req.json()

    if (!id) throw new Error('id is required')
    if (!sectionId) throw new Error('sectionId is required')
    if (!companyId) throw new Error('companyId is required')

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found for this company')

    const updatePayload = {}
    if (title !== undefined) updatePayload.title = title || null
    if (content !== undefined) {
      if (!Array.isArray(content)) throw new Error('content must be an array of strings')
      updatePayload.content = content
    }

    const { data, error } = await supabase
      .from('orientation_slides')
      .update(updatePayload)
      .eq('id', id)
      .eq('section_id', sectionId)
      .select('id, slide_order, title, content')
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
