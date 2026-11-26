import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { escapeHtml, firstName } from './caregiverVerification.ts'

const PORTAL_DOMAIN = 'rsonboard.com'
const PORTAL_URL = `https://${PORTAL_DOMAIN}`
const BRAND_COLOR = '#0A2E73'

export type RecoveryLink = { user: User; link: string }

export function signsInWithGoogleOnly(user: User): boolean {
  const identities = user.identities ?? []
  return identities.some((i) => i.provider === 'google') && !identities.some((i) => i.provider === 'email')
}

export async function generateRecoveryLink(supabase: SupabaseClient, email: string): Promise<RecoveryLink | null> {
  const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email })

  if (error || !data?.user || !data?.properties?.hashed_token) {
    const missing = error?.status === 404 || /not found/i.test(error?.message ?? '')
    if (error && !missing) console.error('generateLink failed:', error)
    return null
  }

  const link = `${PORTAL_URL}/reset-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`
  return { user: data.user, link }
}

export async function sendPasswordResetEmail({
  to,
  link,
  name,
  googleOnly,
}: {
  to: string
  link: string
  name?: string | null
  googleOnly: boolean
}): Promise<boolean> {
  const greeting = name ? `Hi ${escapeHtml(firstName(name))},` : 'Hi there,'
  const intro = googleOnly
    ? 'We received a request to set a password for your RSOnboard account. You normally sign in with Google, and you can keep doing that. If you\'d also like to sign in with your email and a password, choose one using the button below.'
    : 'We received a request to reset the password for your RSOnboard account. Choose a new password using the button below.'
  const buttonLabel = googleOnly ? 'Set password' : 'Reset password'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    },
    body: JSON.stringify({
      from: `RSOnboard <noreply@${PORTAL_DOMAIN}>`,
      to,
      subject: googleOnly ? 'Set a password for your RSOnboard account' : 'Reset your RSOnboard password',
      html: `
        <div style="background: #f5f6f8; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 520px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="${PORTAL_URL}/logo.png" alt="Ready, Set, Onboard!" width="180" style="width: 180px; height: auto;" />
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
              <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px; color: #111;">
                ${greeting}
              </h1>
              <p style="color: #555; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
                ${intro}
              </p>
              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${link}"
                  style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                  ${buttonLabel}
                </a>
              </div>
              <p style="color: #888; font-size: 13px; margin: 0 0 6px;">Or copy this link into your browser:</p>
              <p style="color: ${BRAND_COLOR}; font-size: 13px; word-break: break-all; margin: 0 0 24px;">${link}</p>
              <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
                This link can only be used once and expires soon. If you didn't request this, you can safely ignore this email. Nothing about your account will change.
              </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0;">
              RSOnboard &middot; <a href="${PORTAL_URL}" style="color: #9ca3af;">${PORTAL_DOMAIN}</a>
            </p>
          </div>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    console.error('Resend error:', await res.text())
    return false
  }

  return true
}
