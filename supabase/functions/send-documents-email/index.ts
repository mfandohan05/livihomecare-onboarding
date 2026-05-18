import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://app.livihomecare.com',
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

    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('name, role, position_title')
      .eq('id', caregiverId)
      .single()

    if (!caregiver) throw new Error('Caregiver not found')

    const adminLink = `https://app.livihomecare.com/admin/caregivers/${caregiverId}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'CareReady <noreply@livihomecare.com>',
        to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL'),
        subject: `📄 ${caregiver.name} has uploaded their documents`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <img src="https://app.livihomecare.com/logo.png" alt="Livi Home Care" style="width: 100px; margin-bottom: 32px;" />
            
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
              Documents uploaded
            </h1>
            <p style="color: #555; margin-bottom: 24px;">
              <strong>${caregiver.name}</strong> (${caregiver.position_title}) has uploaded their onboarding documents and is ready for review.
            </p>

            <div style="background: #F4F7EC; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px;">
              <p style="margin: 0; color: #3D5906; font-size: 14px;">
                Log in to the admin portal to review their documents.
              </p>
            </div>

            <a href="${adminLink}" 
              style="background-color: #577C09; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 32px;">
              View ${caregiver.name}'s Profile →
            </a>

            <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />
            <p style="color: #888; font-size: 13px;">CareReady · Livi Home Care Onboarding System</p>
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})