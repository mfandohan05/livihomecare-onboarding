import { formatDateOnly, pluralDays } from '../_shared/documentExpiration.js'

export const PORTAL_DOMAIN = 'rsonboard.com'
const SENDER = 'Ready, Set, Onboard! <onboarding@rsonboard.com>'
const DEFAULT_COLOR = '#577C09'
const RESEND_RATE_RETRY_MS = 1100

export type ReminderItem = {
  documentId: string
  caregiverId: string
  caregiverName: string
  documentType: string
  documentName: string
  expirationDate: string
  checkpoint: 'expired' | '7' | '15' | '30'
  level: 'expired' | 'critical' | 'warning' | 'notice'
  daysLeft: number
}

export type Branding = { companyName: string; primaryColor: string }

export type EmailMessage = { subject: string; html: string; text: string }

const TONES: Record<ReminderItem['level'], { background: string; color: string; border: string }> = {
  expired: { background: '#7F1D1D', color: '#FFFFFF', border: '#450A0A' },
  critical: { background: '#FEE2E2', color: '#7F1D1D', border: '#FCA5A5' },
  warning: { background: '#FFEDD5', color: '#7C2D12', border: '#FDBA74' },
  notice: { background: '#FEF9C3', color: '#713F12', border: '#FDE047' },
}

const SECTIONS: { checkpoint: ReminderItem['checkpoint']; title: string }[] = [
  { checkpoint: 'expired', title: 'Expired' },
  { checkpoint: '7', title: 'Expires within 7 days' },
  { checkpoint: '15', title: 'Expires in 8 to 15 days' },
  { checkpoint: '30', title: 'Expires in 16 to 30 days' },
]

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function safeColor(value: string | null | undefined): string {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : DEFAULT_COLOR
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/[^\s@<>"']+@[^\s@<>"']+/g, '[redacted]').slice(0, 200)
}

export function statusText(item: ReminderItem): string {
  if (item.daysLeft < 0) return `Expired ${pluralDays(-item.daysLeft)} ago`
  if (item.daysLeft === 0) return 'Expires today'
  return `Expires in ${pluralDays(item.daysLeft)}`
}

function badge(item: ReminderItem): string {
  const tone = TONES[item.level]
  return `<span style="display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: ${tone.background}; color: ${tone.color}; border: 1px solid ${tone.border};">${escapeHtml(statusText(item))}</span>`
}

function mostUrgent(items: ReminderItem[]): ReminderItem {
  return items.reduce((worst, item) => (item.daysLeft < worst.daysLeft ? item : worst))
}

function layout(branding: Branding, heading: string, body: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <img src="https://${PORTAL_DOMAIN}/logo.png" alt="${escapeHtml(branding.companyName)}" style="width: 100px; margin-bottom: 32px;" />
      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #111;">${escapeHtml(heading)}</h1>
      ${body}
      <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />
      <p style="color: #888; font-size: 13px;">Ready, Set, Onboard! · ${escapeHtml(branding.companyName)} Onboarding System</p>
    </div>
  `
}

export function buildEmployeeEmail(branding: Branding, caregiverName: string, items: ReminderItem[]): EmailMessage {
  const sorted = [...items].sort((a, b) => a.daysLeft - b.daysLeft)
  const urgent = mostUrgent(sorted)
  const prefix = urgent.level === 'expired' || urgent.level === 'critical' ? 'Action needed:' : 'Reminder:'
  const subject = sorted.length === 1
    ? `${prefix} your ${urgent.documentName} ${statusText(urgent).toLowerCase()}`
    : `${prefix} ${sorted.length} of your documents need attention`

  const firstName = caregiverName.trim().split(/\s+/)[0] || 'there'
  const link = `https://${PORTAL_DOMAIN}/my-documents`
  const color = safeColor(branding.primaryColor)

  const rows = sorted.map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #111; font-weight: 600;">${escapeHtml(item.documentName)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${escapeHtml(formatDateOnly(item.expirationDate))}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${badge(item)}</td>
    </tr>
  `).join('')

  const html = layout(branding, sorted.length === 1 ? 'A document needs to be renewed' : 'Documents need to be renewed', `
    <p style="color: #555; margin-bottom: 24px;">
      Hi ${escapeHtml(firstName)}, ${sorted.length === 1 ? 'the following document' : 'the following documents'} on file with ${escapeHtml(branding.companyName)} ${sorted.length === 1 ? 'is' : 'are'} expiring or already expired. Please upload an updated copy and enter its new expiration date.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Document</th>
          <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Expiration date</th>
          <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; color: #111; font-size: 13px;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${link}" style="background-color: ${color}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 16px;">
      Upload updated document →
    </a>
    <p style="color: #555; font-size: 14px; margin-bottom: 32px;">
      You will be asked to sign in with your employee account. If you have trouble, contact ${escapeHtml(branding.companyName)}.
    </p>
  `)

  const text = [
    `Hi ${firstName},`,
    '',
    `${sorted.length === 1 ? 'The following document' : 'The following documents'} on file with ${branding.companyName} ${sorted.length === 1 ? 'is' : 'are'} expiring or already expired. Please upload an updated copy and enter its new expiration date.`,
    '',
    ...sorted.map((item) => `- ${item.documentName}: ${formatDateOnly(item.expirationDate)} (${statusText(item)})`),
    '',
    `Upload an updated document: ${link}`,
    'You will be asked to sign in with your employee account.',
    '',
    `Ready, Set, Onboard! · ${branding.companyName} Onboarding System`,
  ].join('\n')

  return { subject, html, text }
}

export function buildAdminDigest(branding: Branding, items: ReminderItem[]): EmailMessage {
  const expired = new Set(items.filter((item) => item.checkpoint === 'expired').map((item) => item.documentId)).size
  const soon = items.length - expired
  const parts = [
    expired ? `${expired} expired` : null,
    soon ? `${soon} expiring soon` : null,
  ].filter(Boolean).join(', ')
  const subject = `Document expirations: ${parts} (${branding.companyName})`

  const sections = SECTIONS
    .map((section) => ({ ...section, items: items.filter((item) => item.checkpoint === section.checkpoint) }))
    .filter((section) => section.items.length > 0)

  const byCaregiver = (list: ReminderItem[]) => {
    const groups = new Map<string, { name: string; items: ReminderItem[] }>()
    for (const item of [...list].sort((a, b) => a.caregiverName.localeCompare(b.caregiverName) || a.daysLeft - b.daysLeft)) {
      const group = groups.get(item.caregiverId) ?? { name: item.caregiverName, items: [] }
      group.items.push(item)
      groups.set(item.caregiverId, group)
    }
    return [...groups.entries()]
  }

  const color = safeColor(branding.primaryColor)

  const htmlSections = sections.map((section) => {
    const tone = TONES[section.items[0].level]
    const rows = byCaregiver(section.items).map(([caregiverId, group]) => `
      <tr>
        <td colspan="3" style="padding: 10px 12px 4px 12px; border-bottom: 1px solid #eee;">
          <a href="https://${PORTAL_DOMAIN}/admin/employees/${escapeHtml(caregiverId)}" style="color: ${color}; text-decoration: none; font-weight: 700;">${escapeHtml(group.name)}</a>
        </td>
      </tr>
      ${group.items.map((item) => `
        <tr>
          <td style="padding: 6px 12px 6px 24px; border-bottom: 1px solid #f3f3f3; color: #111;">${escapeHtml(item.documentName)}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #f3f3f3; color: #555;">${escapeHtml(formatDateOnly(item.expirationDate))}</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #f3f3f3; color: #555;">${escapeHtml(statusText(item))}</td>
        </tr>
      `).join('')}
    `).join('')
    return `
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; padding: 8px 12px; border-radius: 6px; font-size: 14px; font-weight: 700; background: ${tone.background}; color: ${tone.color}; border: 1px solid ${tone.border};">
          ${escapeHtml(section.title)} (${section.items.length})
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }).join('')

  const html = layout(branding, 'Document expiration digest', `
    <p style="color: #555; margin-bottom: 24px;">
      The following documents at ${escapeHtml(branding.companyName)} crossed a reminder checkpoint. Employees with an email on file receive their own reminder with a link to upload an updated copy.
    </p>
    ${htmlSections}
  `)

  const textSections = sections.map((section) => {
    const lines = byCaregiver(section.items).flatMap(([, group]) => [
      group.name,
      ...group.items.map((item) => `  - ${item.documentName}: ${formatDateOnly(item.expirationDate)} (${statusText(item)})`),
    ])
    return [`${section.title.toUpperCase()} (${section.items.length})`, ...lines].join('\n')
  })

  const text = [
    `Document expiration digest for ${branding.companyName}`,
    '',
    ...textSections.flatMap((section) => [section, '']),
    `Ready, Set, Onboard! · ${branding.companyName} Onboarding System`,
  ].join('\n')

  return { subject, html, text }
}

export async function sendEmail(to: string[], message: EmailMessage): Promise<void> {
  const send = () => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    },
    body: JSON.stringify({
      from: SENDER,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  })

  let res = await send()
  if (res.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, RESEND_RATE_RETRY_MS))
    res = await send()
  }
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`)
}
