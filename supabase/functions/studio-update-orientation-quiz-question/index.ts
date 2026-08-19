import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, sectionId, companyId, question_text, options, correct_answer_index } = await req.json()

    if (!id) throw new Error('id is required')
    if (!sectionId) throw new Error('sectionId is required')
    if (!companyId) throw new Error('companyId is required')
    if (!question_text || !question_text.trim()) throw new Error('question_text is required')
    if (!Array.isArray(options) || options.length < 2) throw new Error('options must be an array of at least 2 choices')
    if (
      typeof correct_answer_index !== 'number' ||
      !Number.isInteger(correct_answer_index) ||
      correct_answer_index < 0 ||
      correct_answer_index >= options.length
    ) {
      throw new Error('correct_answer_index must be a valid index into options')
    }

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found for this company')

    const { data, error } = await supabase
      .from('orientation_quiz_questions')
      .update({
        question_text: question_text.trim(),
        options,
        correct_answer_index,
      })
      .eq('id', id)
      .eq('section_id', sectionId)
      .select('id, question_order, question_text, options, correct_answer_index')
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
