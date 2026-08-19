import { requirePlatformAdmin, studioCorsHeaders } from '../_shared/platformAdmin.ts'

const COLUMNS = 'company_id, created_at, company_name, legal_name, dba_name, primary_color, secondary_bg_color, logo_path, address_line1, city, state, zip, phone, support_email, admin_notification_emails, company_ein'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: studioCorsHeaders })

  try {
    const { supabase } = await requirePlatformAdmin(req)

    const { data, error } = await supabase
      .from('company_data')
      .select(COLUMNS)
      .order('company_name', { ascending: true })

    if (error) throw error

    const companies = (data || []).map(({ company_ein, ...rest }) => ({
      ...rest,
      has_ein: !!company_ein,
    }))

    return new Response(
      JSON.stringify(companies),
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
