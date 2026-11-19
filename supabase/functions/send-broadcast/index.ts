import { requireAdminContext } from '../_shared/requireAdmin.ts'
import { analyzeSms, applyTemplate, firstNameOf, normalizePhoneE164 } from '../_shared/smsText.ts'
import { getSmsMode, isAllowed, MOCK_FAILURE_NUMBERS, isProduction, sendSms, smsUnavailableReason } from '../_shared/sms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEX_RE = /^#[0-9a-f]{6}$/i

const MAX_RECIPIENTS = Number(Deno.env.get('BROADCAST_MAX_RECIPIENTS') || 300)
const MAX_PER_HOUR = Number(Deno.env.get('BROADCAST_MAX_PER_HOUR') || 5)
const CONCURRENCY = 3
const MAX_BODY = 2000
const MAX_SMS_BODY = 1000

const portalDomain = 'rsonboard.com'
const senderEmail = 'onboarding@rsonboard.com'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++]
      try { await fn(item) } catch (e) { console.error('send-broadcast worker error:', (e as Error).message) }
    }
  })
  await Promise.all(workers)
}

type Company = {
  company_name: string | null
  primary_color: string | null
  support_email: string | null
  phone: string | null
  sms_enabled: boolean | null
  sms_messaging_service_sid: string | null
  sms_from_number: string | null
}

function buildEmail(opts: {
  companyName: string; firstName: string; subject: string; body: string
  primaryColor: string; supportEmail: string; supportPhone: string
}) {
  const { companyName, subject, body, primaryColor, supportEmail, supportPhone } = opts
  const logoUrl = `https://${portalDomain}/logo.png`
  const contactText = `Questions? Contact us at ${supportEmail}${supportPhone ? ` or call ${supportPhone}` : ''}.`
  const text = `${body}\n\n--\n${companyName}\n${contactText}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <img src="${logoUrl}" alt="${escapeHtml(companyName)}" style="width: 100px; margin-bottom: 32px;" />
      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #111;">${escapeHtml(subject)}</h1>
      <div style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
        ${escapeHtml(body).replace(/\r?\n/g, '<br />')}
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 24px;" />
      <p style="color: #888; font-size: 13px;">
        Questions? Contact us at
        <a href="mailto:${escapeHtml(supportEmail)}" style="color: ${primaryColor};">${escapeHtml(supportEmail)}</a>${supportPhone ? ` or call <a href="tel:${supportPhone.replace(/\D/g, '')}" style="color: ${primaryColor};">${escapeHtml(supportPhone)}</a>` : ''}.
      </p>
      <p style="color: #888; font-size: 13px;">${escapeHtml(companyName)}</p>
    </div>`
  return { html, text }
}

type EmailResult = { ok: boolean; providerId?: string; errorCode?: string; error?: string }

async function sendEmail(payload: Record<string, unknown>): Promise<EmailResult> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.status === 429 && attempt < 2) { await sleep(700 * (attempt + 1)); continue }
      const data = await res.json().catch(() => ({}))
      if (res.ok) return { ok: true, providerId: data.id }
      return { ok: false, errorCode: String(res.status), error: String(data.message ?? 'Resend request failed').slice(0, 300) }
    } catch (e) {
      return { ok: false, errorCode: 'network', error: String((e as Error).message).slice(0, 300) }
    }
  }
  return { ok: false, errorCode: '429', error: 'Resend rate limit' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // company_id / admin identity come ONLY from the verified JWT -> admin_users.
  let admin
  try {
    admin = await requireAdminContext(req)
  } catch {
    return json({ error: 'Unauthorized' }, 401)
  }
  const { supabase, companyId } = admin

  let payload: Record<string, unknown>
  try { payload = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  try {
    const { data: company } = await supabase
      .from('company_data')
      .select('company_name, primary_color, support_email, phone, sms_enabled, sms_messaging_service_sid, sms_from_number')
      .eq('company_id', companyId)
      .maybeSingle<Company>()

    const mode = getSmsMode()
    const smsBlocked = smsUnavailableReason(mode, company)

    if (payload.action === 'config') {
      return json({
        smsMode: mode,
        smsAvailable: !smsBlocked,
        smsUnavailableReason: smsBlocked,
        restrictedToAllowlist: !isProduction(),
        maxRecipients: MAX_RECIPIENTS,
        companyName: company?.company_name ?? '',
      })
    }

    // ---- validate input -------------------------------------------------
    const channels = Array.isArray(payload.channels) ? [...new Set(payload.channels as string[])] : []
    if (channels.length === 0 || channels.some((c) => c !== 'email' && c !== 'sms')) {
      return json({ error: 'Choose email, SMS, or both.' }, 400)
    }
    const wantEmail = channels.includes('email')
    const wantSms = channels.includes('sms')

    const rawBody = typeof payload.body === 'string' ? payload.body.trim() : ''
    const rawSubject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
    if (!rawBody || rawBody.length > MAX_BODY) return json({ error: `Message must be 1-${MAX_BODY} characters.` }, 400)
    if (wantSms && rawBody.length > MAX_SMS_BODY) return json({ error: `SMS messages are limited to ${MAX_SMS_BODY} characters.` }, 400)
    if (wantEmail && (!rawSubject || rawSubject.length > 150)) return json({ error: 'Email needs a subject (150 characters max).' }, 400)
    if (wantSms && smsBlocked) return json({ error: smsBlocked }, 400)

    const mode_ = payload.recipientMode
    if (mode_ !== 'all' && mode_ !== 'selected' && mode_ !== 'single') return json({ error: 'Invalid recipient mode.' }, 400)

    const idempotencyKey = payload.idempotencyKey
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      return json({ error: 'Missing idempotency key.' }, 400)
    }

    let requestedIds: string[] = []
    if (mode_ !== 'all') {
      const ids = Array.isArray(payload.caregiverIds) ? payload.caregiverIds : []
      requestedIds = [...new Set(ids.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x)))]
      if (requestedIds.length === 0) return json({ error: 'No recipients selected.' }, 400)
      if (mode_ === 'single' && requestedIds.length !== 1) return json({ error: 'Single mode takes exactly one recipient.' }, 400)
      if (requestedIds.length > MAX_RECIPIENTS) return json({ error: `At most ${MAX_RECIPIENTS} recipients per broadcast.` }, 400)
    }

    // ---- idempotency: a repeat submit returns the original result --------
    const findExisting = async () => {
      const { data } = await supabase
        .from('broadcasts')
        .select('id, status, counts')
        .eq('company_id', companyId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      return data
    }
    const existing = await findExisting()
    if (existing) return json({ broadcastId: existing.id, status: existing.status, counts: existing.counts, duplicate: true })

    // ---- per-admin rate limit -------------------------------------------
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('broadcasts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('created_by', admin.userId)
      .gte('created_at', since)
    if ((recentCount ?? 0) >= MAX_PER_HOUR) {
      return json({ error: `Rate limit reached: ${MAX_PER_HOUR} broadcasts per hour.` }, 429)
    }

    // ---- resolve recipients: this company, completed only ----------------
    let cgQuery = supabase
      .from('caregivers')
      .select('id, name, email, phone')
      .eq('company_id', companyId)
      .eq('status', 'completed')
    if (mode_ !== 'all') cgQuery = cgQuery.in('id', requestedIds)
    const { data: caregivers, error: cgErr } = await cgQuery
    if (cgErr) throw new Error('Recipient lookup failed')
    const recipients = caregivers ?? []
    if (recipients.length === 0) return json({ error: 'No eligible recipients.' }, 400)
    if (recipients.length > MAX_RECIPIENTS) {
      return json({ error: `That would message ${recipients.length} people; the limit is ${MAX_RECIPIENTS} per broadcast.` }, 400)
    }
    const ignoredIds = mode_ === 'all' ? 0 : requestedIds.length - recipients.length

    // ---- create the broadcast row (unique key blocks concurrent doubles) --
    const { data: broadcast, error: bErr } = await supabase
      .from('broadcasts')
      .insert({
        company_id: companyId,
        created_by: admin.userId,
        created_by_name: admin.name,
        channels,
        subject: wantEmail ? rawSubject : null,
        body: rawBody,
        recipient_mode: mode_,
        idempotency_key: idempotencyKey,
        status: 'sending',
        sms_mode: wantSms ? mode : null,
      })
      .select('id')
      .single()
    if (bErr || !broadcast) {
      if (bErr?.code === '23505') {
        const dup = await findExisting()
        if (dup) return json({ broadcastId: dup.id, status: dup.status, counts: dup.counts, duplicate: true })
      }
      throw new Error('Could not create broadcast')
    }
    const broadcastId = broadcast.id as string

    // ---- consent + per-recipient plan -----------------------------------
    const optedOut = new Set<string>()
    if (wantSms) {
      const { data: consent } = await supabase
        .from('caregiver_sms_consent')
        .select('caregiver_id')
        .eq('company_id', companyId)
        .eq('status', 'opted_out')
        .in('caregiver_id', recipients.map((r) => r.id))
      for (const c of consent ?? []) optedOut.add(c.caregiver_id)
    }

    const companyName = company?.company_name || 'your employer'
    const primaryColor = company?.primary_color && HEX_RE.test(company.primary_color) ? company.primary_color : '#577C09'
    const supportEmail = company?.support_email || 'office@livihomecare.com'
    const supportPhone = company?.phone || ''

    type Plan = {
      caregiverId: string; channel: 'email' | 'sms'; status: 'queued' | 'skipped'; skipReason?: string
      to?: string; name: string; segments?: number; text?: string
    }
    const plan: Plan[] = []
    const seenPhones = new Set<string>()

    for (const cg of recipients) {
      const vars = { first_name: firstNameOf(cg.name), company_name: companyName }

      if (wantEmail) {
        const email = (cg.email || '').trim().toLowerCase()
        let reason: string | undefined
        if (!email) reason = 'no_email'
        else if (!EMAIL_RE.test(email)) reason = 'invalid_email'
        else if (!isAllowed('email', email)) reason = 'not_allowlisted'
        plan.push({ caregiverId: cg.id, channel: 'email', name: cg.name, to: email, status: reason ? 'skipped' : 'queued', skipReason: reason })
      }

      if (wantSms) {
        const phone = normalizePhoneE164(cg.phone)
        let reason: string | undefined
        if (!cg.phone || !cg.phone.trim()) reason = 'no_phone'
        else if (!phone) reason = 'invalid_phone'
        else if (optedOut.has(cg.id)) reason = 'opted_out'
        else if (seenPhones.has(phone)) reason = 'duplicate_phone'
        else if (!(mode === 'mock' && MOCK_FAILURE_NUMBERS[phone]) && !isAllowed('sms', phone)) reason = 'not_allowlisted'
        if (phone && !reason) seenPhones.add(phone)

        const text = `${applyTemplate(rawBody, vars)}\n\n${companyName}. Reply STOP to opt out.`
        plan.push({
          caregiverId: cg.id, channel: 'sms', name: cg.name, to: phone ?? undefined,
          status: reason ? 'skipped' : 'queued', skipReason: reason,
          segments: analyzeSms(text).segments, text,
        })
      }
    }

    // Insert every row up front so the log is complete even if we are cut off.
    const rowIds = new Map<string, string>() // `${caregiverId}:${channel}` -> row id
    for (let i = 0; i < plan.length; i += 200) {
      const chunk = plan.slice(i, i + 200)
      const { data: rows, error: rErr } = await supabase
        .from('broadcast_recipients')
        .insert(chunk.map((p) => ({
          broadcast_id: broadcastId,
          company_id: companyId,
          caregiver_id: p.caregiverId,
          channel: p.channel,
          status: p.status,
          skip_reason: p.skipReason ?? null,
          segments: p.channel === 'sms' ? p.segments : null,
        })))
        .select('id, caregiver_id, channel')
      if (rErr) throw new Error('Could not record recipients')
      for (const r of rows ?? []) rowIds.set(`${r.caregiver_id}:${r.channel}`, r.id)
    }

    // ---- send ------------------------------------------------------------
    const results = { email: { sent: 0, failed: 0, skipped: 0 }, sms: { sent: 0, failed: 0, skipped: 0 } }
    const skippedReasons: Record<string, Record<string, number>> = { email: {}, sms: {} }
    for (const p of plan) {
      if (p.status === 'skipped') {
        results[p.channel].skipped++
        skippedReasons[p.channel][p.skipReason!] = (skippedReasons[p.channel][p.skipReason!] ?? 0) + 1
      }
    }

    const record = async (p: Plan, r: { ok: boolean; provider: string; providerId?: string; errorCode?: string; error?: string }) => {
      results[p.channel][r.ok ? 'sent' : 'failed']++
      const { error } = await supabase
        .from('broadcast_recipients')
        .update({
          status: r.ok ? 'sent' : 'failed',
          provider: r.provider,
          provider_message_id: r.providerId ?? null,
          error_code: r.errorCode ?? null,
          error: r.error ?? null,
          sent_at: r.ok ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rowIds.get(`${p.caregiverId}:${p.channel}`)!)
        .eq('company_id', companyId)
      if (error) console.error('send-broadcast: could not record result', p.channel, r.ok ? 'sent' : 'failed')
    }

    const queued = plan.filter((p) => p.status === 'queued')
    const senderCompany = {
      sms_enabled: company?.sms_enabled ?? false,
      sms_messaging_service_sid: company?.sms_messaging_service_sid ?? null,
      sms_from_number: company?.sms_from_number ?? null,
    }

    await pool(queued, CONCURRENCY, async (p) => {
      if (p.channel === 'email') {
        const cg = recipients.find((c) => c.id === p.caregiverId)!
        const vars = { first_name: firstNameOf(cg.name), company_name: companyName }
        const { html, text } = buildEmail({
          companyName, firstName: vars.first_name,
          subject: applyTemplate(rawSubject, vars), body: applyTemplate(rawBody, vars),
          primaryColor, supportEmail, supportPhone,
        })
        const r = await sendEmail({
          from: `${companyName} <${senderEmail}>`,
          to: p.to, // one recipient per request: nobody sees anyone else
          reply_to: supportEmail,
          subject: applyTemplate(rawSubject, vars),
          html,
          text,
        })
        await record(p, { ...r, provider: 'resend' })
      } else {
        const r = await sendSms(mode, p.to!, p.text!, senderCompany, p.caregiverId)
        await record(p, r)
      }
    })

    // ---- finalize --------------------------------------------------------
    const attempted = results.email.sent + results.email.failed + results.sms.sent + results.sms.failed
    const failed = results.email.failed + results.sms.failed
    const status = attempted > 0 && failed === attempted ? 'failed' : failed > 0 ? 'partial' : 'completed'
    const counts = {
      recipients: recipients.length,
      ignored_ids: ignoredIds,
      email: results.email,
      sms: results.sms,
      skipped_reasons: skippedReasons,
    }

    await supabase.from('broadcasts').update({ status, counts }).eq('id', broadcastId).eq('company_id', companyId)

    // Audit entry: identity comes from the verified JWT + admin_users, so the
    // attribution (admin_id -> admin_users.name in AdminLogs) is the real sender.
    const { error: auditErr } = await supabase.from('audit_logs').insert({
      admin_id: admin.userId,
      admin_email: admin.email,
      action: 'sent_broadcast',
      company_id: companyId,
      metadata: {
        admin_name: admin.name,
        broadcast_id: broadcastId,
        channels,
        recipient_mode: mode_,
        sms_mode: wantSms ? mode : null,
        counts,
      },
    })
    if (auditErr) console.error('send-broadcast: audit log failed')

    console.log(JSON.stringify({
      fn: 'send-broadcast', broadcastId, companyId, adminId: admin.userId, smsMode: wantSms ? mode : null,
      status, email: results.email, sms: results.sms,
      smsSegments: plan.filter((p) => p.channel === 'sms' && p.status === 'queued').reduce((n, p) => n + (p.segments ?? 0), 0),
    }))

    return json({ broadcastId, status, counts, duplicate: false })
  } catch (error) {
    console.error('send-broadcast failed:', (error as Error).message)
    return json({ error: 'Broadcast failed. Check the history before retrying.' }, 500)
  }
})
