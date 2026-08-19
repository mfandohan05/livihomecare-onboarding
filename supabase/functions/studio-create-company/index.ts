import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const COLUMNS = 'company_id, created_at, company_name, legal_name, dba_name, primary_color, secondary_bg_color, logo_path, address_line1, city, state, zip, phone, support_email, admin_notification_emails'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)
    const body = await req.json()

    if (!body.company_name || !body.company_name.trim()) {
      throw new Error('company_name is required')
    }

    const insertPayload = {
      company_name: body.company_name.trim(),
      legal_name: body.legal_name || null,
      dba_name: body.dba_name || null,
      primary_color: body.primary_color || null,
      secondary_bg_color: body.secondary_bg_color || null,
      address_line1: body.address_line1 || null,
      city: body.city || null,
      state: body.state || null,
      zip: body.zip || null,
      phone: body.phone || null,
      support_email: body.support_email || null,
      admin_notification_emails: Array.isArray(body.admin_notification_emails) ? body.admin_notification_emails : [],
    }

    const { data, error } = await supabase
      .from('company_data')
      .insert(insertPayload)
      .select(COLUMNS)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ ...data, has_ein: false }),
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
