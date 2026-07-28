import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { sectionId, companyId, title, content } = await req.json()

    if (!sectionId) throw new Error('sectionId is required')
    if (!companyId) throw new Error('companyId is required')
    if (!Array.isArray(content)) throw new Error('content must be an array of strings')

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found for this company')

    const { data: existing, error: maxError } = await supabase
      .from('orientation_slides')
      .select('slide_order')
      .eq('section_id', sectionId)
      .order('slide_order', { ascending: false })
      .limit(1)

    if (maxError) throw maxError
    const nextOrder = (existing?.[0]?.slide_order || 0) + 10

    const { data, error } = await supabase
      .from('orientation_slides')
      .insert({
        section_id: sectionId,
        title: title || null,
        content,
        slide_order: nextOrder,
      })
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
