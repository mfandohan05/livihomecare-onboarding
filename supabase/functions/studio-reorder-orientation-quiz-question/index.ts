import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { sectionId, companyId, questionId, direction } = await req.json()

    if (!sectionId) throw new Error('sectionId is required')
    if (!companyId) throw new Error('companyId is required')
    if (!questionId) throw new Error('questionId is required')
    if (direction !== 'up' && direction !== 'down') throw new Error('direction must be "up" or "down"')

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found for this company')

    const { data: questions, error: questionsError } = await supabase
      .from('orientation_quiz_questions')
      .select('id, question_order')
      .eq('section_id', sectionId)
      .order('question_order', { ascending: true })

    if (questionsError) throw questionsError

    const index = (questions || []).findIndex((q) => q.id === questionId)
    if (index === -1) throw new Error('Question not found')

    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= questions.length) {
      throw new Error(`Already at the ${direction === 'up' ? 'top' : 'bottom'}`)
    }

    const current = questions[index]
    const neighbor = questions[neighborIndex]

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('orientation_quiz_questions').update({ question_order: neighbor.question_order }).eq('id', current.id),
      supabase.from('orientation_quiz_questions').update({ question_order: current.question_order }).eq('id', neighbor.id),
    ])

    if (error1) throw error1
    if (error2) throw error2

    const { data: updated, error: refetchError } = await supabase
      .from('orientation_quiz_questions')
      .select('id, question_order, question_text, options, correct_answer_index')
      .eq('section_id', sectionId)
      .order('question_order', { ascending: true })

    if (refetchError) throw refetchError

    return new Response(
      JSON.stringify(updated),
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
