import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

// section_key isn't editable here, matching every other "_key" field across Studio — kept
// locked for consistency even though (unlike form_key/step_key/role_key) nothing in the
// caregiver-facing app currently reads section_key directly.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, title, passing_score } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const updatePayload = {}
    if (title !== undefined) {
      if (!title.trim()) throw new Error('title cannot be empty')
      updatePayload.title = title.trim()
    }
    if (passing_score !== undefined) {
      const score = Number(passing_score)
      if (Number.isNaN(score) || score <= 0 || score > 1) throw new Error('passing_score must be a number between 0 and 1')
      updatePayload.passing_score = score
    }

    const { data, error } = await supabase
      .from('orientation_sections')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id, section_key, title, section_order, passing_score')
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
