import { requireCaregiverAccess } from '../_shared/caregiverAccess.ts'
import { escapeHtml, firstName } from '../_shared/caregiverVerification.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const PORTAL_DOMAIN = 'rsonboard.com'
const LINK_TTL_MS = 72 * 60 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId } = await req.json()
    const { supabase, userId: adminId } = await requireCaregiverAccess(req, caregiverId, ['admin'])

    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id, name, email, token, status, user_id, company_id')
      .eq('id', caregiverId)
      .single()

    if (!caregiver) return json({ error: 'Unauthorized' }, 401)

    if (!caregiver.user_id) {
      return json({ success: false, error: 'This employee has not created an account yet.' })
    }

    const { data: adminTarget } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', caregiver.user_id)
      .maybeSingle()
    if (adminTarget) {
      return json({ success: false, error: 'This account cannot be reset from here.' })
    }

    const { data: authData, error: authLookupError } = await supabase.auth.admin.getUserById(caregiver.user_id)
    const authUser = authData?.user
    if (authLookupError || !authUser) {
      return json({ success: false, error: 'Could not find this employee\'s sign-in account.' })
    }

    const usesGoogle = (authUser.identities ?? []).some((i) => i.provider === 'google')

    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', adminId)
      .maybeSingle()

    const audit = async (method: string) => {
      const { error } = await supabase.from('audit_logs').insert({
        admin_id: adminId,
        admin_email: admin?.email ?? null,
        action: 'reset_caregiver_password',
        caregiver_id: caregiver.id,
        caregiver_name: caregiver.name,
        company_id: caregiver.company_id,
        metadata: { method },
      })
      if (error) console.error('audit log failed:', error)
    }

    if (!usesGoogle) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(authUser.email!, {
        redirectTo: `https://${PORTAL_DOMAIN}/reset-password`,
      })
      if (resetError) {
        console.error('resetPasswordForEmail failed:', resetError)
        return json({ success: false, error: 'Could not send the password reset email. Please try again.' })
      }

      await audit('password_reset_email')
      return json({ success: true, method: 'password_reset_email' })
    }

    if (caregiver.status === 'cancelled') {
      return json({
        success: false,
        error: 'This employee\'s onboarding was cancelled. Regenerate their link before resetting their sign-in.',
      })
    }

    const token = caregiver.token || crypto.randomUUID()

    const { data: unlinked, error: unlinkError } = await supabase
      .from('caregivers')
      .update({
        user_id: null,
        token,
        link_expires_at: new Date(Date.now() + LINK_TTL_MS).toISOString(),
      })
      .eq('id', caregiver.id)
      .eq('user_id', caregiver.user_id)
      .select('id')

    if (unlinkError || !unlinked?.length) {
      console.error('unlink failed:', unlinkError)
      return json({ success: false, error: 'Could not reset this employee\'s sign-in. Please try again.' })
    }

    const { data: otherLinks } = await supabase
      .from('caregivers')
      .select('id')
      .eq('user_id', caregiver.user_id)
      .limit(1)

    const { error: deleteError } = otherLinks?.length
      ? { error: null }
      : await supabase.auth.admin.deleteUser(caregiver.user_id)
    if (deleteError) {
      console.error('deleteUser failed:', deleteError)
      await supabase.from('caregivers').update({ user_id: caregiver.user_id }).eq('id', caregiver.id)
      return json({ success: false, error: 'Could not reset this employee\'s sign-in. Please try again.' })
    }

    await supabase.from('caregiver_verification_codes').delete().eq('caregiver_id', caregiver.id)

    const { data: company } = await supabase
      .from('company_data')
      .select('company_name, support_email, primary_color')
      .eq('company_id', caregiver.company_id)
      .maybeSingle()

    const companyName = company?.company_name || 'your employer'
    const primaryColor = company?.primary_color || '#0A2E73'
    const link = `https://${PORTAL_DOMAIN}/onboard/${token}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: `${companyName} Onboarding System <noreply@${PORTAL_DOMAIN}>`,
        to: caregiver.email,
        subject: `Set up your sign-in again — ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">
              Hi ${escapeHtml(firstName(caregiver.name))},
            </h1>
            <p style="color: #555; margin-bottom: 24px;">
              ${escapeHtml(companyName)} reset your sign-in. Use the button below to verify your email and sign in with Google again.
            </p>
            <div style="margin-bottom: 32px;">
              <a href="${link}"
                style="background-color: ${primaryColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Set up sign-in
              </a>
            </div>
            <p style="color: #888; font-size: 13px; margin-bottom: 8px;">Or copy this link into your browser:</p>
            <p style="color: ${primaryColor}; font-size: 13px; word-break: break-all;">${link}</p>
          </div>
        `,
      }),
    })

    let emailSent = true
    if (!res.ok) {
      console.error('Resend error:', await res.text())
      emailSent = false
    }

    await audit('google_unlinked')
    return json({ success: true, method: 'google_unlinked', emailSent })
  } catch (err) {
    console.error('admin-reset-caregiver-password failed:', err)
    return json({ success: false, error: 'Could not reset this employee\'s sign-in. Please try again.' }, 500)
  }
})
