import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId } = await req.json()
    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id, section_key, title, section_order, passing_score')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found')

    const [{ data: slides, error: slidesError }, { data: questions, error: questionsError }] = await Promise.all([
      supabase
        .from('orientation_slides')
        .select('id, slide_order, title, content')
        .eq('section_id', id)
        .order('slide_order', { ascending: true }),
      supabase
        .from('orientation_quiz_questions')
        .select('id, question_order, question_text, options, correct_answer_index')
        .eq('section_id', id)
        .order('question_order', { ascending: true }),
    ])

    if (slidesError) throw slidesError
    if (questionsError) throw questionsError

    return new Response(
      JSON.stringify({ section, slides: slides || [], questions: questions || [] }),
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
