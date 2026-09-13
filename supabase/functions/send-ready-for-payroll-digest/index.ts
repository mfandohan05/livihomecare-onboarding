import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: caregivers, error: cgErr } = await supabase
      .from('caregivers')
      .select('id, name, position_title, ready_for_payroll_at, company_id')
      .eq('ready_for_payroll', true)
      .gte('ready_for_payroll_at', sevenDaysAgo)
      .order('ready_for_payroll_at', { ascending: true })

    if (cgErr) throw new Error(`Caregiver lookup failed: ${cgErr.message}`)

    if (!caregivers || caregivers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const byCompany = new Map()
    for (const cg of caregivers) {
      const list = byCompany.get(cg.company_id) || []
      list.push(cg)
      byCompany.set(cg.company_id, list)
    }

    const portalDomain = 'rsonboard.com'
    const senderEmail = 'onboarding@rsonboard.com'
    const logoUrl = `https://${portalDomain}/logo.png`

    let sent = 0

    for (const [companyId, companyCaregivers] of byCompany) {
      const { data: companyData } = await supabase
        .from('company_data')
        .select('company_name, primary_color, accounting_notification_emails')
        .eq('company_id', companyId)
        .maybeSingle()

      const notificationEmails = companyData?.accounting_notification_emails?.length
        ? companyData.accounting_notification_emails
        : []

      if (notificationEmails.length === 0) continue

      const companyName = companyData?.company_name || 'your employer'
      const primaryColor = companyData?.primary_color || '#577C09'

      const rows = companyCaregivers.map((cg) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
            <a href="https://${portalDomain}/admin/employees/${cg.id}" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">${cg.name}</a>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #555;">${cg.position_title || ''}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; color: #555;">${new Date(cg.ready_for_payroll_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        </tr>
      `).join('')

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify({
          from: `Ready, Set, Onboard! <${senderEmail}>`,
          to: notificationEmails,
          subject: `📋 Weekly Ready for Payroll digest — ${companyCaregivers.length} new hire${companyCaregivers.length === 1 ? '' : 's'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <img src="${logoUrl}" alt="${companyName}" style="width: 100px; margin-bottom: 32px;" />

              <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
                Weekly Ready for Payroll Digest
              </h1>
              <p style="color: #555; margin-bottom: 24px;">
                The following new hires at ${companyName} were marked ready for payroll in the past 7 days:
              </p>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Name</th>
                    <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Position</th>
                    <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Marked Ready</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>

              <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />
              <p style="color: #888; font-size: 13px;">Ready, Set, Onboard! · ${companyName} Onboarding System</p>
            </div>
          `
        })
      })

      if (!res.ok) {
        const error = await res.text()
        console.error(`Resend error for company ${companyId}:`, error)
        continue
      }

      sent++
    }

    return new Response(
      JSON.stringify({ success: true, sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-ready-for-payroll-digest failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
