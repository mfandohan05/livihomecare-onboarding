import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

// orientation_slides and orientation_quiz_questions both FK to orientation_sections with
// ON DELETE CASCADE, so this delete removes them too. The frontend already knows the
// slide/question counts from studio-list-orientation-sections and shows them in the
// confirmation dialog before this is ever called — this function doesn't re-derive them.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const { error } = await supabase
      .from('orientation_sections')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

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
