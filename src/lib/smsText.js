const GSM7_BASIC = new Set(
  Array.from(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
  )
)
const GSM7_EXT = new Set(Array.from('^{}\\[~]|€\f'))

export function analyzeSms(text) {
  let units = 0
  let gsm = true
  for (const ch of text) {
    if (GSM7_BASIC.has(ch)) units += 1
    else if (GSM7_EXT.has(ch)) units += 2
    else { gsm = false; break }
  }
  if (gsm) {
    return { encoding: 'GSM-7', length: units, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153) }
  }
  const len = text.length
  return { encoding: 'UCS-2', length: len, segments: len <= 70 ? 1 : Math.ceil(len / 67) }
}

export function applyTemplate(text, vars) {
  return text
    .replace(/\{first_name\}/g, vars.first_name)
    .replace(/\{company_name\}/g, vars.company_name)
}

export function normalizePhoneE164(raw) {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  let national
  if (digits.length === 10) national = digits
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1)
  else return null
  if (!/^[2-9]\d{9}$/.test(national)) return null
  return `+1${national}`
}

export function firstNameOf(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there'
}

// Appended by the Edge Function to every SMS.
export const smsFooter = (companyName) => `\n\n${companyName}. Reply STOP to opt out.`

export const SKIP_REASON_LABELS = {
  no_email: 'No email on file',
  invalid_email: 'Invalid email address',
  no_phone: 'No phone number',
  invalid_phone: 'Invalid phone number',
  opted_out: 'Opted out of SMS',
  duplicate_phone: 'Phone shared with another recipient',
  not_allowlisted: 'Not on the dev allowlist',
}
