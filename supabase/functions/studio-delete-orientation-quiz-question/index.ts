import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, sectionId, companyId } = await req.json()

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

    const { error } = await supabase
      .from('orientation_quiz_questions')
      .delete()
      .eq('id', id)
      .eq('section_id', sectionId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
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
