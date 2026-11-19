// SMS provider layer. Mode is chosen by the SMS_MODE secret:
//   mock (default) - never calls Twilio; returns a clearly marked fake id and can
//                    simulate failures (see below)
//   live           - real Twilio send using the company's configured sender, and
//                    only when SMS_LIVE_ENABLED=true. Works with a Twilio trial
//                    account too (trial can only reach verified numbers).
// Going live is therefore secrets + company_data configuration only.
//
// Mock failure simulation (no secrets needed, mock only):
//   - recipient phone is one of MOCK_FAILURE_NUMBERS (mirrors Twilio's magic numbers)
//   - SMS_MOCK_FAIL_IDS = comma-separated caregiver ids that should fail
//   - SMS_MOCK_FAIL_ALL=true makes every mock send fail

export type SmsMode = 'mock' | 'live'

export type CompanySender = {
  sms_enabled: boolean | null
  sms_messaging_service_sid: string | null
  sms_from_number: string | null
}

export type SmsResult = {
  ok: boolean
  provider: 'mock' | 'twilio'
  providerId?: string
  errorCode?: string
  error?: string
}

export const MOCK_FAILURE_NUMBERS: Record<string, { code: string; error: string }> = {
  '+15005550001': { code: '21211', error: 'Invalid To phone number (simulated)' },
  '+15005550002': { code: '21612', error: 'Cannot route to this number (simulated)' },
  '+15005550004': { code: '21610', error: 'Recipient is blocked / has opted out (simulated)' },
  '+15005550009': { code: '21614', error: 'Number cannot receive SMS (simulated)' },
}

export function getSmsMode(): SmsMode {
  const m = (Deno.env.get('SMS_MODE') || '').toLowerCase()
  return m === 'live' ? 'live' : 'mock'
}

// Why SMS cannot be used right now for this company, or null if it can.
export function smsUnavailableReason(mode: SmsMode, company: CompanySender | null): string | null {
  if (!company?.sms_enabled) return 'SMS is not enabled for this company.'
  if (mode === 'live') {
    if (Deno.env.get('SMS_LIVE_ENABLED') !== 'true') return 'Live SMS has not been switched on.'
    if (!Deno.env.get('TWILIO_ACCOUNT_SID') || !Deno.env.get('TWILIO_AUTH_TOKEN')) {
      return 'Live SMS is missing Twilio credentials.'
    }
    if (!company.sms_messaging_service_sid && !company.sms_from_number) {
      return 'No SMS sender is configured for this company.'
    }
  }
  return null
}

// Outside production, nothing may reach a recipient that is not explicitly
// allowlisted. APP_ENV=production lifts the restriction; any other value (or
// unset) enforces it, so a forgotten secret fails closed.
export function isProduction(): boolean {
  return (Deno.env.get('APP_ENV') || '').toLowerCase() === 'production'
}

function parseList(name: string): Set<string> {
  return new Set(
    (Deno.env.get(name) || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  )
}

export function isAllowed(kind: 'sms' | 'email', value: string): boolean {
  if (isProduction()) return true
  return parseList(kind === 'sms' ? 'SMS_ALLOWLIST' : 'EMAIL_ALLOWLIST').has(value.toLowerCase())
}

// Provider errors often echo the To number; never store or log it.
function redact(msg: string): string {
  return msg.replace(/\+?\d[\d\s().-]{8,}\d/g, '[number]').slice(0, 300)
}

export async function sendSms(
  mode: SmsMode,
  to: string,
  body: string,
  company: CompanySender,
  caregiverId?: string
): Promise<SmsResult> {
  if (mode === 'mock') {
    const failIds = parseList('SMS_MOCK_FAIL_IDS')
    const sim = MOCK_FAILURE_NUMBERS[to]
    if (sim) return { ok: false, provider: 'mock', errorCode: sim.code, error: sim.error }
    if (Deno.env.get('SMS_MOCK_FAIL_ALL') === 'true' || (caregiverId && failIds.has(caregiverId.toLowerCase()))) {
      return { ok: false, provider: 'mock', errorCode: '30008', error: 'Simulated delivery failure (mock)' }
    }
    return { ok: true, provider: 'mock', providerId: `MOCK-${crypto.randomUUID()}` }
  }

  const params = new URLSearchParams({ To: to, Body: body })
  if (smsUnavailableReason('live', company)) {
    return { ok: false, provider: 'twilio', errorCode: 'not_configured', error: 'Live SMS is not configured' }
  }
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
  if (company.sms_messaging_service_sid) params.set('MessagingServiceSid', company.sms_messaging_service_sid)
  else params.set('From', company.sms_from_number!)
  const callbackBase = Deno.env.get('TWILIO_WEBHOOK_URL')
  if (callbackBase) params.set('StatusCallback', callbackBase)

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.sid) return { ok: true, provider: 'twilio', providerId: json.sid }
    return {
      ok: false,
      provider: 'twilio',
      errorCode: String(json.code ?? res.status),
      error: redact(String(json.message ?? 'Twilio request failed')),
    }
  } catch (e) {
    return { ok: false, provider: 'twilio', errorCode: 'network', error: redact(String((e as Error).message)) }
  }
}
