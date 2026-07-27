import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const EDITABLE_FIELDS = [
  'company_name', 'legal_name', 'dba_name',
  'primary_color', 'secondary_bg_color', 'logo_path',
  'address_line1', 'city', 'state', 'zip',
  'phone', 'support_email', 'admin_notification_emails',
]

const COLUMNS = 'company_id, created_at, company_name, legal_name, dba_name, primary_color, secondary_bg_color, logo_path, address_line1, city, state, zip, phone, support_email, admin_notification_emails, company_ein'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const body = await req.json()
    const { companyId, ein } = body
    if (!companyId) throw new Error('companyId is required')

    if (typeof ein === 'string' && ein.trim()) {
      const encryptionKey = Deno.env.get('COMPANY_ENCRYPTION_KEY')
      if (!encryptionKey) throw new Error('COMPANY_ENCRYPTION_KEY is not configured')

      const { error: einError } = await supabase.rpc('save_company_ein_encrypted', {
        p_company_id: companyId,
        p_ein: ein.trim(),
        p_encryption_key: encryptionKey,
      })
      if (einError) throw einError
    }

    const updatePayload = {}
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updatePayload[field] = body[field]
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('company_data')
        .update(updatePayload)
        .eq('company_id', companyId)
      if (updateError) throw updateError
    }

    const { data, error } = await supabase
      .from('company_data')
      .select(COLUMNS)
      .eq('company_id', companyId)
      .single()

    if (error) throw error

    const { company_ein, ...rest } = data
    return new Response(
      JSON.stringify({ ...rest, has_ein: !!company_ein }),
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
