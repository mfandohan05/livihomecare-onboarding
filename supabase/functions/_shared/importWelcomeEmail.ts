import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { escapeHtml, firstName } from './caregiverVerification.ts'

const PORTAL_DOMAIN = 'rsonboard.com'
const SENDER_EMAIL = 'noreply@rsonboard.com'
const DEFAULT_COLOR = '#577C09'

const RESEND_BATCH_SIZE = 100
const RESEND_SPACING_MS = 600
const RESEND_RETRY_DELAY_MS = 1500
const RESEND_TIME_BUDGET_MS = 90_000

export type Branding = {
  companyName: string
  primaryColor: string
  supportEmail: string
  supportPhone: string
}

export type WelcomeTarget = { name: string; email: string; token: string }
export type WelcomeEmail = ReturnType<typeof buildWelcomeEmail>

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function loadBranding(supabase: SupabaseClient, companyId: string): Promise<Branding> {
  const { data } = await supabase
    .from('company_data')
    .select('company_name, primary_color, phone, support_email')
    .eq('company_id', companyId)
    .maybeSingle()

  const color = typeof data?.primary_color === 'string' && /^#[0-9a-f]{3,8}$/i.test(data.primary_color)
    ? data.primary_color
    : DEFAULT_COLOR

  return {
    companyName: data?.company_name || 'your employer',
    primaryColor: color,
    supportEmail: data?.support_email || '',
    supportPhone: data?.phone || '',
  }
}

export function buildWelcomeEmail(target: WelcomeTarget, branding: Branding) {
  const company = escapeHtml(branding.companyName)
  const color = branding.primaryColor
  const link = `https://${PORTAL_DOMAIN}/onboard/${target.token}`

  const headerCompany = branding.companyName.replace(/["<>\\\r\n]/g, '')

  const phone = branding.supportPhone ? ` or call ${escapeHtml(branding.supportPhone)}` : ''
  const contact = branding.supportEmail
    ? `Questions? Contact us at <a href="mailto:${escapeHtml(branding.supportEmail)}" style="color: ${color};">${escapeHtml(branding.supportEmail)}</a>${phone}.`
    : ''

  return {
    from: `"${headerCompany} Onboarding System" <${SENDER_EMAIL}>`,
    to: target.email,
    subject: `You've been added to RSOnboard by ${headerCompany}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <img src="https://${PORTAL_DOMAIN}/logo.png" alt="RSOnboard" style="width: 100px; margin-bottom: 32px;" />

        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #111;">
          Hi ${escapeHtml(firstName(target.name))},
        </h1>
        <p style="color: #555; margin-bottom: 24px;">
          <strong>${company}</strong> has added you to RSOnboard. Create your account to manage
          your information, documents and trainings in one place.
        </p>

        <ul style="color: #555; margin-bottom: 32px; padding-left: 20px;">
          <li>View and update your profile</li>
          <li>Upload and keep your documents current</li>
          <li>Complete your assigned trainings</li>
        </ul>

        <div style="margin-bottom: 32px;">
          <a href="${link}"
            style="background-color: ${color}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Create your account →
          </a>
        </div>

        <p style="color: #888; font-size: 13px; margin-bottom: 8px;">
          Or copy this link into your browser:
        </p>
        <p style="color: ${color}; font-size: 13px; word-break: break-all; margin-bottom: 32px;">
          ${link}
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />

        <p style="color: #888; font-size: 13px;">${contact}</p>
        <p style="color: #888; font-size: 13px;">${company}</p>
      </div>
    `,
  }
}

async function postToResend(path: string, body: unknown): Promise<number> {
  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.error(`Resend ${path} failed:`, res.status, await res.text())
    return res.status
  } catch (err) {
    console.error(`Resend ${path} request failed:`, err)
    return 0
  }
}

const isSuccess = (status: number) => status >= 200 && status < 300
const isRejectedContent = (status: number) => status === 400 || status === 422
const isTransient = (status: number) => status === 0 || status === 429 || status >= 500

async function sendGroup(group: WelcomeEmail[], deadline: number): Promise<boolean[]> {
  const failed = () => group.map(() => false)
  if (Date.now() > deadline) return failed()

  let status = await postToResend('/emails/batch', group)
  if (isTransient(status)) {
    await sleep(RESEND_RETRY_DELAY_MS)
    status = await postToResend('/emails/batch', group)
  }

  if (isSuccess(status)) return group.map(() => true)
  if (!isRejectedContent(status) || group.length === 1) return failed()

  const middle = Math.ceil(group.length / 2)
  await sleep(RESEND_SPACING_MS)
  const first = await sendGroup(group.slice(0, middle), deadline)
  await sleep(RESEND_SPACING_MS)
  const second = await sendGroup(group.slice(middle), deadline)
  return [...first, ...second]
}

export async function sendWelcomeEmails(emails: WelcomeEmail[]): Promise<boolean[]> {
  const deadline = Date.now() + RESEND_TIME_BUDGET_MS
  const outcomes: boolean[] = []

  for (let start = 0; start < emails.length; start += RESEND_BATCH_SIZE) {
    if (start > 0) await sleep(RESEND_SPACING_MS)
    outcomes.push(...await sendGroup(emails.slice(start, start + RESEND_BATCH_SIZE), deadline))
  }

  return outcomes
}
