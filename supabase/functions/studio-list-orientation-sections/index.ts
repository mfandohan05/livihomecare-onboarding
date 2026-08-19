import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId } = await req.json()
    if (!companyId) throw new Error('companyId is required')

    const { data: sections, error: sectionsError } = await supabase
      .from('orientation_sections')
      .select('id, section_key, title, section_order, passing_score')
      .eq('company_id', companyId)
      .order('section_order', { ascending: true })

    if (sectionsError) throw sectionsError

    const sectionIds = (sections || []).map((s) => s.id)

    const [{ data: slides, error: slidesError }, { data: questions, error: questionsError }] = await Promise.all([
      sectionIds.length
        ? supabase.from('orientation_slides').select('section_id').in('section_id', sectionIds)
        : Promise.resolve({ data: [], error: null }),
      sectionIds.length
        ? supabase.from('orientation_quiz_questions').select('section_id').in('section_id', sectionIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (slidesError) throw slidesError
    if (questionsError) throw questionsError

    const slideCounts = {}
    for (const { section_id } of slides || []) slideCounts[section_id] = (slideCounts[section_id] || 0) + 1
    const questionCounts = {}
    for (const { section_id } of questions || []) questionCounts[section_id] = (questionCounts[section_id] || 0) + 1

    const result = (sections || []).map((s) => ({
      ...s,
      slide_count: slideCounts[s.id] || 0,
      question_count: questionCounts[s.id] || 0,
    }))

    return new Response(
      JSON.stringify(result),
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
