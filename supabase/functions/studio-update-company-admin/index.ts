import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const VALID_ROLES = ['admin', 'superadmin']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, name, email, role, position, password } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const { data: existing, error: existingError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()
    if (existingError || !existing) throw new Error('Admin not found')

    if (typeof password === 'string' && password) {
      if (password.length < 8) throw new Error('password must be at least 8 characters')
      const { error: pwError } = await supabase.auth.admin.updateUserById(id, { password })
      if (pwError) throw pwError
    }

    const updatePayload: Record<string, unknown> = {}
    if (typeof name === 'string') updatePayload.name = name.trim()
    if (typeof position === 'string') updatePayload.position = position.trim() || null
    if (typeof role === 'string') {
      if (!VALID_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`)
      updatePayload.role = role
    }
    if (typeof email === 'string' && email.trim()) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(id, { email: email.trim() })
      if (emailError) throw emailError
      updatePayload.email = email.trim()
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('admin_users')
        .update(updatePayload)
        .eq('id', id)
        .eq('company_id', companyId)
      if (updateError) throw updateError
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, position, created_at')
      .eq('id', id)
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
