import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, confirmed } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, name, email, role')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (adminError || !admin) throw new Error('Admin not found')

    if (!confirmed) {
      return new Response(
        JSON.stringify({
          requiresConfirmation: true,
          name: admin.name,
          email: admin.email,
        }),
        { headers: { ...studioCorsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (deleteError) throw deleteError

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)
    if (authDeleteError) throw authDeleteError

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
