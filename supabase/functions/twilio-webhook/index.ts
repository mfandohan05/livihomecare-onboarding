import { serviceClient } from '../_shared/caregiverAccess.ts'
import { normalizePhoneE164 } from '../_shared/smsText.ts'

// Twilio calls this directly, so it cannot carry a Supabase JWT. Deploy with
// --no-verify-jwt; the X-Twilio-Signature check below is the authentication.
// Nothing is read or written until the signature is valid.

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'REVOKE', 'OPTOUT'])
const START_WORDS = new Set(['START', 'YES', 'UNSTOP'])

const xml = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })

async function validSignature(url: string, params: URLSearchParams, signature: string, authToken: string) {
  const keys = [...new Set([...params.keys()])].sort()
  let data = url
  for (const k of keys) for (const v of params.getAll(k)) data += k + v
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)))
  const expected = btoa(String.fromCharCode(...mac))
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const publicUrl = Deno.env.get('TWILIO_WEBHOOK_URL') // the exact URL configured in Twilio
  const signature = req.headers.get('X-Twilio-Signature') || ''
  if (!authToken || !publicUrl || !signature) return new Response('Forbidden', { status: 403 })

  const params = new URLSearchParams(await req.text())
  if (!(await validSignature(publicUrl, params, signature, authToken))) {
    return new Response('Forbidden', { status: 403 })
  }

  const supabase = serviceClient()

  try {
    const messageSid = params.get('MessageSid')
    const body = params.get('Body')

    // Inbound message from a caregiver (Body present). Delivery-status callbacks have no Body.
    if (body !== null) {
      const word = body.trim().toUpperCase()
      const isStop = STOP_WORDS.has(word)
      const isStart = START_WORDS.has(word)
      if (!isStop && !isStart) return xml() // HELP and everything else: Twilio's built-in handling replies

      // Tie the number to a company through the Messaging Service / number it was sent to.
      const serviceSid = params.get('MessagingServiceSid')
      const to = params.get('To')
      let companyQuery = supabase.from('company_data').select('company_id')
      if (serviceSid) companyQuery = companyQuery.eq('sms_messaging_service_sid', serviceSid)
      else if (to) companyQuery = companyQuery.eq('sms_from_number', to)
      else return xml()
      const { data: companies } = await companyQuery
      if (!companies || companies.length !== 1) {
        console.log('twilio-webhook: inbound with no unique company match')
        return xml()
      }
      const companyId = companies[0].company_id as string

      const from = normalizePhoneE164(params.get('From'))
      if (!from) return xml()

      const { data: caregivers } = await supabase
        .from('caregivers')
        .select('id, phone')
        .eq('company_id', companyId)
        .not('phone', 'is', null)
      const matches = (caregivers ?? []).filter((c) => normalizePhoneE164(c.phone) === from)

      if (matches.length > 0) {
        await supabase.from('caregiver_sms_consent').upsert(
          matches.map((c) => ({
            caregiver_id: c.id,
            company_id: companyId,
            status: isStop ? 'opted_out' : 'opted_in',
            source: isStop ? 'twilio_stop' : 'twilio_start',
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'caregiver_id' }
        )
      }
      console.log(JSON.stringify({ fn: 'twilio-webhook', kind: isStop ? 'stop' : 'start', companyId, matched: matches.length }))
      return xml()
    }

    // Delivery status callback.
    const status = params.get('MessageStatus')
    if (messageSid && status) {
      const update: Record<string, unknown> | null =
        status === 'delivered' ? { status: 'delivered' }
        : status === 'failed' || status === 'undelivered'
          ? { status: 'failed', error_code: params.get('ErrorCode'), error: `Carrier status: ${status}` }
          : null
      if (update) {
        await supabase
          .from('broadcast_recipients')
          .update({ ...update, updated_at: new Date().toISOString() })
          .eq('provider', 'twilio')
          .eq('provider_message_id', messageSid)
      }
    }
    return xml()
  } catch (e) {
    console.error('twilio-webhook failed:', (e as Error).message)
    return new Response('Error', { status: 500 })
  }
})
