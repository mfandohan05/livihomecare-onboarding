import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, confirmed } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const { data: role, error: roleError } = await supabase
      .from('role_labels')
      .select('id, role_key, display_label')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (roleError || !role) throw new Error('Role not found')

    const { count, error: countError } = await supabase
      .from('caregivers')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('role', role.role_key)

    if (countError) throw countError

    if (!confirmed) {
      return new Response(
        JSON.stringify({
          requiresConfirmation: true,
          role_key: role.role_key,
          display_label: role.display_label,
          caregiver_count: count || 0,
        }),
        { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: deleteError } = await supabase
      .from('role_labels')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (deleteError) throw deleteError

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
