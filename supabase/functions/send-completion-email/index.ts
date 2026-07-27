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
      .select('name, role, position_title, pay_rate, company_id')
      .eq('id', caregiverId)
      .single()

    if (!caregiver || cgErr) throw new Error(`Caregiver lookup failed: ${cgErr?.message ?? 'not found'}`)

    const { data: companyData } = await supabase
      .from('company_data')
      .select('company_name, primary_color, logo_path, admin_notification_emails')
      .eq('company_id', caregiver.company_id)
      .maybeSingle()

    const companyName = companyData?.company_name || 'your employer'
    const primaryColor = companyData?.primary_color || '#577C09'

    const fallbackEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')
    const notificationEmails = companyData?.admin_notification_emails?.length
      ? companyData.admin_notification_emails
      : (fallbackEmail ? [fallbackEmail] : [])

    if (notificationEmails.length === 0) throw new Error('No admin notification email configured for this company')

    const { data: timeLogs } = await supabase
      .from('caregiver_time_logs')
      .select('active_seconds')
      .eq('caregiver_id', caregiverId)
      .eq('company_id', caregiver.company_id)

    const totalActiveSeconds = (timeLogs || []).reduce((sum, log) => sum + (log.active_seconds || 0), 0)
    const activeHours = timeLogs && timeLogs.length > 0 ? (totalActiveSeconds / 3600).toFixed(2) : null
    const orientationPay = activeHours && caregiver.pay_rate
      ? (parseFloat(activeHours) * caregiver.pay_rate).toFixed(2)
      : null

    const portalDomain = 'app.livihomecare.com'
    const senderEmail = 'onboarding@livihomecare.com'

    const logoUrl = companyData?.logo_path
      ? `https://${portalDomain}/${companyData.logo_path}`
      : `https://${portalDomain}/logo.png`

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
        subject: `✅ ${caregiver.name} has completed onboarding`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="width: 100px; margin-bottom: 32px;" />
            
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
              Onboarding complete 🎉
            </h1>
            <p style="color: #555; margin-bottom: 24px;">
              <strong>${caregiver.name}</strong> (${caregiver.position_title}) has completed their onboarding. All documents and forms have been submitted.
            </p>

            ${activeHours ? `
            <div style="background: #F4F7EC; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px 0; color: #3D5906; font-size: 13px; font-weight: 600;">ORIENTATION PAY</p>
              <p style="margin: 0; color: #111; font-size: 20px; font-weight: 700;">$${orientationPay}</p>
              <p style="margin: 4px 0 0 0; color: #555; font-size: 13px;">${activeHours} active hours × $${caregiver.pay_rate}/hr</p>
            </div>
            ` : ''}

            <p style="color: #555; margin-bottom: 32px; font-size: 14px;">
              Next steps: Complete I-9 Section 2 verification, activate their eRSP account, and schedule their first shift.
            </p>

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
    console.error('send-completion-email failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})