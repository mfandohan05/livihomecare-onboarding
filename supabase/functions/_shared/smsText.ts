// Pure text helpers (no Deno APIs). src/lib/smsText.js mirrors analyzeSms,
// applyTemplate and normalizePhoneE164 for the live counter in the admin UI —
// keep the two in sync.

const GSM7_BASIC = new Set(
  Array.from(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
  )
)
// Extension table characters take two GSM-7 septets.
const GSM7_EXT = new Set(Array.from('^{}\\[~]|€\f'))

export type SmsAnalysis = { encoding: 'GSM-7' | 'UCS-2'; length: number; segments: number }

export function analyzeSms(text: string): SmsAnalysis {
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
  const len = text.length // UTF-16 code units, which is what UCS-2 segments count
  return { encoding: 'UCS-2', length: len, segments: len <= 70 ? 1 : Math.ceil(len / 67) }
}

// Only {first_name} and {company_name} are substituted; anything else is left as typed.
export function applyTemplate(text: string, vars: { first_name: string; company_name: string }): string {
  return text
    .replace(/\{first_name\}/g, vars.first_name)
    .replace(/\{company_name\}/g, vars.company_name)
}

// US/Canada (+1) only — that is what A2P 10DLC covers. Returns null if not valid.
export function normalizePhoneE164(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  let national: string
  if (digits.length === 10) national = digits
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1)
  else return null
  if (!/^[2-9]\d{9}$/.test(national)) return null
  return `+1${national}`
}

export function firstNameOf(name: string): string {
  return (name || '').trim().split(/\s+/)[0] || 'there'
}
