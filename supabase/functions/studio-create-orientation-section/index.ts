import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, section_key, title, passing_score } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!section_key || !section_key.trim()) throw new Error('section_key is required')
    if (!title || !title.trim()) throw new Error('title is required')

    const score = passing_score === undefined || passing_score === null ? 0.8 : Number(passing_score)
    if (Number.isNaN(score) || score <= 0 || score > 1) throw new Error('passing_score must be a number between 0 and 1')

    const { data: existing, error: maxError } = await supabase
      .from('orientation_sections')
      .select('section_order')
      .eq('company_id', companyId)
      .order('section_order', { ascending: false })
      .limit(1)

    if (maxError) throw maxError
    const nextOrder = (existing?.[0]?.section_order || 0) + 10

    const { data, error } = await supabase
      .from('orientation_sections')
      .insert({
        company_id: companyId,
        section_key: section_key.trim(),
        title: title.trim(),
        section_order: nextOrder,
        passing_score: score,
      })
      .select('id, section_key, title, section_order, passing_score')
      .single()

    if (error) {
      if (error.code === '23505') throw new Error(`A section with key "${section_key.trim()}" already exists for this company`)
      throw error
    }

    return new Response(
      JSON.stringify({ ...data, slide_count: 0, question_count: 0 }),
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
