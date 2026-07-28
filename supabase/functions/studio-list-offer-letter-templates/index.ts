import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId } = await req.json()
    if (!companyId) throw new Error('companyId is required')

    const { data, error } = await supabase
      .from('offer_letter_templates')
      .select('id, role_key, title, requires_address, uses_custom_pdf')
      .eq('company_id', companyId)
      .order('role_key', { ascending: true })

    if (error) throw error

    return new Response(
      JSON.stringify(data || []),
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
