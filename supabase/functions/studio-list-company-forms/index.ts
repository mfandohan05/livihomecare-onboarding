import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId } = await req.json()
    if (!companyId) throw new Error('companyId is required')

    const { data, error } = await supabase
      .from('company_forms')
      .select('id, form_key, title, form_order, form_type, visible_to_roles, admin_signable, requires_signature')
      .eq('company_id', companyId)
      .order('form_order', { ascending: true })

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
