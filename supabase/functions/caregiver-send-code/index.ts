import { serviceClient } from '../_shared/caregiverAccess.ts'
import {
  CODE_TTL_MS,
  MAX_CODES_PER_HOUR,
  RESEND_COOLDOWN_MS,
  escapeHtml,
  findVerifiableCaregiver,
  firstName,
  generateCode,
  hashCode,
} from '../_shared/caregiverVerification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    const supabase = serviceClient()

    const caregiver = await findVerifiableCaregiver(supabase, token)
    if (!caregiver) return json({ error: 'Invalid or expired link' }, 404)

    const now = Date.now()
    const { data: recent } = await supabase
      .from('caregiver_verification_codes')
      .select('created_at')
      .eq('caregiver_id', caregiver.id)
      .gt('created_at', new Date(now - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (recent && recent.length > 0) {
      const sinceLast = now - new Date(recent[0].created_at).getTime()
      if (sinceLast < RESEND_COOLDOWN_MS) {
        return json({
          success: false,
          error: 'Please wait a moment before requesting another code.',
          retryAfter: Math.ceil((RESEND_COOLDOWN_MS - sinceLast) / 1000),
        })
      }
      if (recent.length >= MAX_CODES_PER_HOUR) {
        return json({
          success: false,
          error: 'Too many code requests. Please try again later or contact your employer.',
        })
      }
    }

    const { data: company } = await supabase
      .from('company_data')
      .select('company_name, support_email, phone')
      .eq('company_id', caregiver.company_id)
      .maybeSingle()

    const companyName = company?.company_name || 'your employer'
    const code = generateCode()
    const codeHash = await hashCode(caregiver.id, code)

    await supabase.from('caregiver_verification_codes').delete().eq('caregiver_id', caregiver.id)

    const { data: inserted, error: insertError } = await supabase
      .from('caregiver_verification_codes')
      .insert({
        caregiver_id: caregiver.id,
        code_hash: codeHash,
        expires_at: new Date(now + CODE_TTL_MS).toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !inserted) throw insertError ?? new Error('Failed to store code')

    const safeCompany = escapeHtml(companyName)
    const safeName = escapeHtml(firstName(caregiver.name))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: `${companyName} Onboarding System <noreply@rsonboard.com>`,
        to: caregiver.email,
        subject: `Your verification code: ${code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
              Hi ${safeName},
            </h1>
            <p style="color: #555; margin-bottom: 24px;">
              Use the code below to verify your identity and continue your onboarding with ${safeCompany}.
            </p>
            <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #0A2E73; background: #f3f5f9; border-radius: 8px; padding: 18px 0; text-align: center; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="color: #555; margin-bottom: 8px;">
              This code expires in 5 minutes and can only be used once.
            </p>
            <p style="color: #888; font-size: 13px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      console.error('Resend error:', await res.text())
      await supabase.from('caregiver_verification_codes').delete().eq('id', inserted.id)
      return json({ success: false, error: 'We could not send the code. Please try again.' })
    }

    return json({ success: true, expiresInSeconds: CODE_TTL_MS / 1000 })
  } catch (err) {
    console.error('caregiver-send-code failed:', err)
    return json({ success: false, error: 'We could not send the code. Please try again.' }, 500)
  }
})
