import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, sectionId, direction } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!sectionId) throw new Error('sectionId is required')
    if (direction !== 'up' && direction !== 'down') throw new Error('direction must be "up" or "down"')

    const { data: sections, error: sectionsError } = await supabase
      .from('orientation_sections')
      .select('id, section_order')
      .eq('company_id', companyId)
      .order('section_order', { ascending: true })

    if (sectionsError) throw sectionsError

    const index = (sections || []).findIndex((s) => s.id === sectionId)
    if (index === -1) throw new Error('Section not found')

    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= sections.length) {
      throw new Error(`Already at the ${direction === 'up' ? 'top' : 'bottom'}`)
    }

    const current = sections[index]
    const neighbor = sections[neighborIndex]

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('orientation_sections').update({ section_order: neighbor.section_order }).eq('id', current.id),
      supabase.from('orientation_sections').update({ section_order: current.section_order }).eq('id', neighbor.id),
    ])

    if (error1) throw error1
    if (error2) throw error2

    const { data: updated, error: refetchError } = await supabase
      .from('orientation_sections')
      .select('id, section_key, title, section_order, passing_score')
      .eq('company_id', companyId)
      .order('section_order', { ascending: true })

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
