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
    const { caregiverId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: caregiver, error: cgErr } = await supabase
      .from('caregivers')
      .select('name, role, position_title, pay_rate, hire_date, company_id')
      .eq('id', caregiverId)
      .single()

    if (!caregiver || cgErr) throw new Error(`Caregiver lookup failed: ${cgErr?.message ?? 'not found'}`)

    const { data: companyData } = await supabase
      .from('company_data')
      .select('company_name, primary_color, logo_path, accounting_notification_emails')
      .eq('company_id', caregiver.company_id)
      .maybeSingle()

    const companyName = companyData?.company_name || 'your employer'
    const primaryColor = companyData?.primary_color || '#577C09'

    const notificationEmails = companyData?.accounting_notification_emails?.length
      ? companyData.accounting_notification_emails
      : []

    if (notificationEmails.length === 0) throw new Error('No accounting notification email configured for this company')

    const portalDomain = 'rsonboard.com'
    const senderEmail = 'onboarding@rsonboard.com'

    const logoUrl = `https://${portalDomain}/logo.png`

    const adminLink = `https://${portalDomain}/admin/employees/${caregiverId}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: `Ready, Set, Onboard! <${senderEmail}>`,
        to: notificationEmails,
        subject: `💰 ${caregiver.name} is ready for payroll`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="width: 100px; margin-bottom: 32px;" />

            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
              Ready for payroll activation ✅
            </h1>
            <p style="color: #555; margin-bottom: 24px;">
              <strong>${caregiver.name}</strong> (${caregiver.position_title}) has had their onboarding documentation reviewed and confirmed complete. They are ready for payroll activation.
            </p>

            <div style="background: #F4F7EC; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              ${caregiver.hire_date ? `<p style="margin: 0 0 4px 0; color: #3D5906; font-size: 13px; font-weight: 600;">HIRE DATE</p>
              <p style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 700;">${new Date(caregiver.hire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
              ${caregiver.pay_rate ? `<p style="margin: 0 0 4px 0; color: #3D5906; font-size: 13px; font-weight: 600;">PAY RATE</p>
              <p style="margin: 0; color: #111; font-size: 16px; font-weight: 700;">$${caregiver.pay_rate}/hr</p>` : ''}
            </div>

            <a href="${adminLink}"
              style="background-color: ${primaryColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 32px;">
              View ${caregiver.name}'s Profile →
            </a>

            <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />
            <p style="color: #888; font-size: 13px;">Ready, Set, Onboard! · ${companyName} Onboarding System</p>
          </div>
        `
      })
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Resend error: ${error}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-ready-for-payroll-notification failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
