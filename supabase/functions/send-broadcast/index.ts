import { requireAdminContext } from '../_shared/requireAdmin.ts'
import { applyTemplate, firstNameOf } from '../_shared/smsText.ts'

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
const MAX_SUBJECT = 150

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
}

function buildEmail(opts: {
  companyName: string; subject: string; body: string
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
      .select('company_name, primary_color, support_email, phone')
      .eq('company_id', companyId)
      .maybeSingle<Company>()

    if (payload.action === 'config') {
      return json({
        maxRecipients: MAX_RECIPIENTS,
        maxPerHour: MAX_PER_HOUR,
        maxSubject: MAX_SUBJECT,
        maxBody: MAX_BODY,
        companyName: company?.company_name ?? '',
      })
    }

    const rawBody = typeof payload.body === 'string' ? payload.body.trim() : ''
    const rawSubject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
    if (!rawSubject || rawSubject.length > MAX_SUBJECT) return json({ error: `Subject must be 1-${MAX_SUBJECT} characters.` }, 400)
    if (!rawBody || rawBody.length > MAX_BODY) return json({ error: `Message must be 1-${MAX_BODY} characters.` }, 400)

    const recipientMode = payload.recipientMode
    if (recipientMode !== 'all' && recipientMode !== 'selected' && recipientMode !== 'single') {
      return json({ error: 'Invalid recipient mode.' }, 400)
    }

    const idempotencyKey = payload.idempotencyKey
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      return json({ error: 'Missing idempotency key.' }, 400)
    }

    let requestedIds: string[] = []
    if (recipientMode !== 'all') {
      const ids = Array.isArray(payload.caregiverIds) ? payload.caregiverIds : []
      requestedIds = [...new Set(ids.filter((x): x is string => typeof x === 'string' && UUID_RE.test(x)))]
      if (requestedIds.length === 0) return json({ error: 'No recipients selected.' }, 400)
      if (recipientMode === 'single' && requestedIds.length !== 1) return json({ error: 'Single mode takes exactly one recipient.' }, 400)
      if (requestedIds.length > MAX_RECIPIENTS) return json({ error: `At most ${MAX_RECIPIENTS} recipients per broadcast.` }, 400)
    }

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

    let cgQuery = supabase
      .from('caregivers')
      .select('id, name, email')
      .eq('company_id', companyId)
      .eq('status', 'completed')
    if (recipientMode !== 'all') cgQuery = cgQuery.in('id', requestedIds)
    const { data: caregivers, error: cgErr } = await cgQuery
    if (cgErr) throw new Error('Recipient lookup failed')
    const recipients = caregivers ?? []
    if (recipients.length === 0) return json({ error: 'No eligible recipients.' }, 400)
    if (recipients.length > MAX_RECIPIENTS) {
      return json({ error: `That would message ${recipients.length} people; the limit is ${MAX_RECIPIENTS} per broadcast.` }, 400)
    }
    const ignoredIds = recipientMode === 'all' ? 0 : requestedIds.length - recipients.length

    const { data: broadcast, error: bErr } = await supabase
      .from('broadcasts')
      .insert({
        company_id: companyId,
        created_by: admin.userId,
        created_by_name: admin.name || admin.email || 'Admin',
        channels: ['email'],
        subject: rawSubject,
        body: rawBody,
        recipient_mode: recipientMode,
        idempotency_key: idempotencyKey,
        status: 'sending',
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

    const companyName = company?.company_name || 'your employer'
    const primaryColor = company?.primary_color && HEX_RE.test(company.primary_color) ? company.primary_color : '#577C09'
    const supportEmail = company?.support_email || 'office@livihomecare.com'
    const supportPhone = company?.phone || ''

    type Plan = { caregiverId: string; name: string; to: string; status: 'queued' | 'skipped'; skipReason?: string }
    const seenEmails = new Set<string>()
    const plan: Plan[] = recipients.map((cg) => {
      const email = (cg.email || '').trim().toLowerCase()
      let reason: string | undefined
      if (!email) reason = 'no_email'
      else if (!EMAIL_RE.test(email)) reason = 'invalid_email'
      else if (seenEmails.has(email)) reason = 'duplicate_email'
      if (email && !reason) seenEmails.add(email)
      return { caregiverId: cg.id, name: cg.name, to: email, status: reason ? 'skipped' : 'queued', skipReason: reason }
    })

    const rowIds = new Map<string, string>()
    for (let i = 0; i < plan.length; i += 200) {
      const chunk = plan.slice(i, i + 200)
      const { data: rows, error: rErr } = await supabase
        .from('broadcast_recipients')
        .insert(chunk.map((p) => ({
          broadcast_id: broadcastId,
          company_id: companyId,
          caregiver_id: p.caregiverId,
          channel: 'email',
          status: p.status,
          skip_reason: p.skipReason ?? null,
        })))
        .select('id, caregiver_id')
      if (rErr) throw new Error('Could not record recipients')
      for (const r of rows ?? []) rowIds.set(r.caregiver_id, r.id)
    }

    const results = { sent: 0, failed: 0, skipped: 0 }
    const skippedReasons: Record<string, number> = {}
    for (const p of plan) {
      if (p.status === 'skipped') {
        results.skipped++
        skippedReasons[p.skipReason!] = (skippedReasons[p.skipReason!] ?? 0) + 1
      }
    }

    const record = async (p: Plan, r: EmailResult) => {
      results[r.ok ? 'sent' : 'failed']++
      const { error } = await supabase
        .from('broadcast_recipients')
        .update({
          status: r.ok ? 'sent' : 'failed',
          provider: 'resend',
          provider_message_id: r.providerId ?? null,
          error_code: r.errorCode ?? null,
          error: r.error ?? null,
          sent_at: r.ok ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rowIds.get(p.caregiverId)!)
        .eq('company_id', companyId)
      if (error) console.error('send-broadcast: could not record result', r.ok ? 'sent' : 'failed')
    }

    await pool(plan.filter((p) => p.status === 'queued'), CONCURRENCY, async (p) => {
      const vars = { first_name: firstNameOf(p.name), company_name: companyName }
      const subject = applyTemplate(rawSubject, vars)
      const { html, text } = buildEmail({
        companyName, subject, body: applyTemplate(rawBody, vars),
        primaryColor, supportEmail, supportPhone,
      })
      const r = await sendEmail({
        from: `${companyName} <${senderEmail}>`,
        to: p.to,
        reply_to: supportEmail,
        subject,
        html,
        text,
      })
      await record(p, r)
    })

    const attempted = results.sent + results.failed
    const status = attempted > 0 && results.failed === attempted ? 'failed' : results.failed > 0 ? 'partial' : 'completed'
    const counts = {
      recipients: recipients.length,
      ignored_ids: ignoredIds,
      email: results,
      skipped_reasons: skippedReasons,
    }

    await supabase.from('broadcasts').update({ status, counts }).eq('id', broadcastId).eq('company_id', companyId)

    const { error: auditErr } = await supabase.from('audit_logs').insert({
      admin_id: admin.userId,
      admin_email: admin.email,
      action: 'sent_broadcast',
      company_id: companyId,
      metadata: {
        admin_name: admin.name,
        broadcast_id: broadcastId,
        subject: rawSubject,
        recipient_mode: recipientMode,
        counts,
      },
    })
    if (auditErr) console.error('send-broadcast: audit log failed')

    console.log(JSON.stringify({
      fn: 'send-broadcast', broadcastId, companyId, adminId: admin.userId, status, email: results,
    }))

    return json({ broadcastId, status, counts, duplicate: false })
  } catch (error) {
    console.error('send-broadcast failed:', (error as Error).message)
    return json({ error: 'Broadcast failed. Check the history before retrying.' }, 500)
  }
})
