import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const { id, companyId, title, visible_to_roles, admin_signable, requires_signature, content, config } = await req.json()

    if (!id) throw new Error('id is required')
    if (!companyId) throw new Error('companyId is required')

    const updatePayload = {}

    if (title !== undefined) {
      if (!title.trim()) throw new Error('title cannot be empty')
      updatePayload.title = title.trim()
    }
    if (visible_to_roles !== undefined) {
      if (!Array.isArray(visible_to_roles) || visible_to_roles.length === 0) {
        throw new Error('visible_to_roles must be a non-empty array')
      }
      updatePayload.visible_to_roles = visible_to_roles
    }
    if (admin_signable !== undefined) updatePayload.admin_signable = !!admin_signable
    if (requires_signature !== undefined) updatePayload.requires_signature = !!requires_signature
    if (content !== undefined) {
      if (!Array.isArray(content)) throw new Error('content must be an array')
      updatePayload.content = content
    }
    if (config !== undefined) {
      if (typeof config !== 'object' || config === null || Array.isArray(config)) throw new Error('config must be an object')
      updatePayload.config = config
    }

    const { data, error } = await supabase
      .from('company_forms')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id, form_key, title, form_order, form_type, content, config, visible_to_roles, admin_signable, requires_signature')
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
