import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const VALID_ROLES = ['admin', 'superadmin']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { companyId, name, email, password, role, position } = await req.json()

    if (!companyId) throw new Error('companyId is required')
    if (!name || !name.trim()) throw new Error('name is required')
    if (!email || !email.trim()) throw new Error('email is required')
    if (!password || password.length < 8) throw new Error('password must be at least 8 characters')
    const finalRole = role || 'admin'
    if (!VALID_ROLES.includes(finalRole)) throw new Error(`Invalid role: ${finalRole}`)

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    })
    if (createError) throw createError

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        id: created.user.id,
        company_id: companyId,
        name: name.trim(),
        email: email.trim(),
        role: finalRole,
        position: position?.trim() || null,
      })
      .select('id, name, email, role, position, created_at')
      .single()

    if (error) {
      // Don't leave an orphaned auth user with no admin_users row behind.
      await supabase.auth.admin.deleteUser(created.user.id)
      if (error.code === '23505') throw new Error(`An admin with email "${email.trim()}" already exists`)
      throw error
    }

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
