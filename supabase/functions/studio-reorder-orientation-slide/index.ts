import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { sectionId, companyId, slideId, direction } = await req.json()

    if (!sectionId) throw new Error('sectionId is required')
    if (!companyId) throw new Error('companyId is required')
    if (!slideId) throw new Error('slideId is required')
    if (direction !== 'up' && direction !== 'down') throw new Error('direction must be "up" or "down"')

    const { data: section, error: sectionError } = await supabase
      .from('orientation_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('company_id', companyId)
      .single()

    if (sectionError || !section) throw new Error('Section not found for this company')

    const { data: slides, error: slidesError } = await supabase
      .from('orientation_slides')
      .select('id, slide_order')
      .eq('section_id', sectionId)
      .order('slide_order', { ascending: true })

    if (slidesError) throw slidesError

    const index = (slides || []).findIndex((s) => s.id === slideId)
    if (index === -1) throw new Error('Slide not found')

    const neighborIndex = direction === 'up' ? index - 1 : index + 1
    if (neighborIndex < 0 || neighborIndex >= slides.length) {
      throw new Error(`Already at the ${direction === 'up' ? 'top' : 'bottom'}`)
    }

    const current = slides[index]
    const neighbor = slides[neighborIndex]

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from('orientation_slides').update({ slide_order: neighbor.slide_order }).eq('id', current.id),
      supabase.from('orientation_slides').update({ slide_order: current.slide_order }).eq('id', neighbor.id),
    ])

    if (error1) throw error1
    if (error2) throw error2

    const { data: updated, error: refetchError } = await supabase
      .from('orientation_slides')
      .select('id, slide_order, title, content')
      .eq('section_id', sectionId)
      .order('slide_order', { ascending: true })

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
