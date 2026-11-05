import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serviceClient } from '../_shared/caregiverAccess.ts'
import {
  EXPIRED_REPEAT_DAYS,
  TRACKED_DOCUMENT_TYPES,
  collapseAliasedDocuments,
  daysBetween,
  documentLabel,
  getExpirationStatus,
  isTrackedDocumentType,
  toDateOnly,
  todayInTimeZone,
} from '../_shared/documentExpiration.js'
import type { Branding, EmailMessage, ReminderItem } from './emails.ts'
import {
  buildAdminDigest,
  buildEmployeeEmail,
  safeColor,
  sanitizeError,
  sendEmail,
} from './emails.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const PAGE_SIZE = 1000
const SEND_SPACING_MS = 600
const STALE_PENDING_MS = 60 * 60 * 1000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Channel = 'email'
type RecipientType = 'admin' | 'employee'

type CompanyRow = {
  company_id: string
  company_name: string | null
  primary_color: string | null
  admin_notification_emails: string[] | null
}

type CaregiverRow = { id: string; name: string; email: string | null; status: string }

type DocumentRow = {
  id: string
  caregiver_id: string
  document_type: string
  expiration_date: string | null
}

type HistoryRow = {
  document_id: string
  expiration_date: string
  checkpoint: string
  recipient_type: string
  sent_on: string
}

type Claim = { item: ReminderItem; rowId: string }

type CompanySummary = {
  company_id: string
  documents_evaluated: number
  skipped: Record<string, number>
  employee_emails: { sent: number; failed: number }
  admin_digest: 'sent' | 'failed' | 'skipped' | 'planned' | 'none'
  admin_digest_documents: number
  error?: string
  planned_employee_emails?: unknown[]
  planned_admin_digest?: unknown
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function secretMatches(provided: string | null, expected: string | undefined): Promise<boolean> {
  if (!provided || !expected) return false
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function pageAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

function bump(skipped: Record<string, number>, reason: string, count = 1) {
  skipped[reason] = (skipped[reason] ?? 0) + count
}

function historyKey(documentId: string, expirationDate: string, checkpoint: string, recipient: RecipientType) {
  return `${documentId}|${expirationDate}|${checkpoint}|${recipient}`
}

function isDue(item: ReminderItem, recipient: RecipientType, history: Map<string, string>, today: string): boolean {
  const lastSent = history.get(historyKey(item.documentId, item.expirationDate, item.checkpoint, recipient))
  if (!lastSent) return true
  if (item.checkpoint !== 'expired') return false
  return daysBetween(lastSent, today) >= EXPIRED_REPEAT_DAYS
}

async function claim(
  supabase: SupabaseClient,
  companyId: string,
  items: ReminderItem[],
  recipient: RecipientType,
  channel: Channel,
  today: string,
): Promise<Claim[]> {
  const claims: Claim[] = []
  for (const item of items) {
    const { data, error } = await supabase
      .from('document_expiration_reminders')
      .insert({
        company_id: companyId,
        caregiver_id: item.caregiverId,
        document_id: item.documentId,
        document_type: item.documentType,
        expiration_date: item.expirationDate,
        checkpoint: item.checkpoint,
        channel,
        recipient_type: recipient,
        result: 'pending',
        sent_on: today,
      })
      .select('id')
      .single()
    if (error) {
      if (error.code !== '23505') console.error(`claim failed for company ${companyId}:`, sanitizeError(error.message))
      continue
    }
    claims.push({ item, rowId: data.id })
  }
  return claims
}

async function settle(
  supabase: SupabaseClient,
  companyId: string,
  claims: Claim[],
  result: 'sent' | 'failed',
  error?: string,
) {
  if (claims.length === 0) return
  const { error: updateError } = await supabase
    .from('document_expiration_reminders')
    .update({
      result,
      error: error ?? null,
      sent_at: result === 'sent' ? new Date().toISOString() : null,
    })
    .eq('company_id', companyId)
    .in('id', claims.map((entry) => entry.rowId))
  if (updateError) console.error(`settle failed for company ${companyId}:`, sanitizeError(updateError.message))
}

const CHANNEL_SENDERS: Record<Channel, (to: string[], message: EmailMessage) => Promise<void>> = {
  email: sendEmail,
}

async function processCompany(
  supabase: SupabaseClient,
  company: CompanyRow,
  today: string,
  dryRun: boolean,
): Promise<CompanySummary> {
  const companyId = company.company_id
  const branding: Branding = {
    companyName: company.company_name || 'your employer',
    primaryColor: safeColor(company.primary_color),
  }
  const summary: CompanySummary = {
    company_id: companyId,
    documents_evaluated: 0,
    skipped: {},
    employee_emails: { sent: 0, failed: 0 },
    admin_digest: 'none',
    admin_digest_documents: 0,
  }
  if (dryRun) summary.planned_employee_emails = []

  const caregivers = await pageAll<CaregiverRow>((from, to) =>
    supabase.from('caregivers').select('id, name, email, status').eq('company_id', companyId).order('id').range(from, to))
  const caregiverMap = new Map(caregivers.map((caregiver) => [caregiver.id, caregiver]))

  const documents = await pageAll<DocumentRow>((from, to) =>
    supabase
      .from('caregiver_documents')
      .select('id, caregiver_id, document_type, expiration_date')
      .eq('company_id', companyId)
      .not('expiration_date', 'is', null)
      .order('id')
      .range(from, to))

  const { count: undated } = await supabase
    .from('caregiver_documents')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('expiration_date', null)
    .in('document_type', TRACKED_DOCUMENT_TYPES)
  if (undated) bump(summary.skipped, 'no_expiration_date', undated)

  const tracked = documents.filter((doc) => {
    if (isTrackedDocumentType(doc.document_type)) return true
    bump(summary.skipped, 'untracked_document_type')
    return false
  })

  const eligible = collapseAliasedDocuments(tracked).filter((doc) => {
    if (caregiverMap.get(doc.caregiver_id)?.status === 'completed') return true
    bump(summary.skipped, 'caregiver_not_completed')
    return false
  })

  summary.documents_evaluated = eligible.length

  const items: ReminderItem[] = []
  for (const doc of eligible) {
    const status = getExpirationStatus(doc.expiration_date, today)
    const expirationDate = toDateOnly(doc.expiration_date)
    if (!status || !status.checkpoint || !expirationDate) continue
    const caregiver = caregiverMap.get(doc.caregiver_id)!
    items.push({
      documentId: doc.id,
      caregiverId: doc.caregiver_id,
      caregiverName: caregiver.name,
      documentType: doc.document_type,
      documentName: documentLabel(doc.document_type),
      expirationDate,
      checkpoint: status.checkpoint as ReminderItem['checkpoint'],
      level: status.level as ReminderItem['level'],
      daysLeft: status.daysLeft,
    })
  }

  if (items.length === 0) return summary

  const historyRows = await pageAll<HistoryRow>((from, to) =>
    supabase
      .from('document_expiration_reminders')
      .select('document_id, expiration_date, checkpoint, recipient_type, sent_on')
      .eq('company_id', companyId)
      .eq('channel', 'email')
      .in('result', ['pending', 'sent'])
      .order('id')
      .range(from, to))
  const history = new Map<string, string>()
  for (const row of historyRows) {
    const key = historyKey(row.document_id, row.expiration_date, row.checkpoint, row.recipient_type as RecipientType)
    const current = history.get(key)
    if (!current || row.sent_on > current) history.set(key, row.sent_on)
  }

  const employeeDue = items.filter((item) => isDue(item, 'employee', history, today))
  const byCaregiver = new Map<string, ReminderItem[]>()
  for (const item of employeeDue) {
    const list = byCaregiver.get(item.caregiverId) ?? []
    list.push(item)
    byCaregiver.set(item.caregiverId, list)
  }

  for (const [caregiverId, caregiverItems] of byCaregiver) {
    const caregiver = caregiverMap.get(caregiverId)!
    if (!caregiver.email || !EMAIL_RE.test(caregiver.email)) {
      bump(summary.skipped, 'employee_no_email', caregiverItems.length)
      continue
    }
    const message = buildEmployeeEmail(branding, caregiver.name, caregiverItems)

    if (dryRun) {
      summary.planned_employee_emails!.push({
        caregiver_id: caregiverId,
        caregiver_name: caregiver.name,
        subject: message.subject,
        documents: caregiverItems.map((item) => ({
          document_type: item.documentType,
          expiration_date: item.expirationDate,
          checkpoint: item.checkpoint,
          days_left: item.daysLeft,
        })),
      })
      continue
    }

    const claims = await claim(supabase, companyId, caregiverItems, 'employee', 'email', today)
    if (claims.length === 0) continue
    try {
      await CHANNEL_SENDERS.email([caregiver.email], message)
      await settle(supabase, companyId, claims, 'sent')
      summary.employee_emails.sent++
    } catch (error) {
      await settle(supabase, companyId, claims, 'failed', sanitizeError(error))
      summary.employee_emails.failed++
      console.error(`employee reminder failed for company ${companyId} caregiver ${caregiverId}:`, sanitizeError(error))
    }
    await sleep(SEND_SPACING_MS)
  }

  const adminDue = items.filter((item) => isDue(item, 'admin', history, today))
  if (adminDue.length === 0) return summary

  const recipients = (company.admin_notification_emails ?? []).filter((email) => EMAIL_RE.test(email))
  if (recipients.length === 0) {
    bump(summary.skipped, 'admin_no_recipients', adminDue.length)
    summary.admin_digest = 'skipped'
    return summary
  }

  summary.admin_digest_documents = adminDue.length

  if (dryRun) {
    summary.planned_admin_digest = {
      subject: buildAdminDigest(branding, adminDue).subject,
      recipient_count: recipients.length,
      documents: adminDue.map((item) => ({
        caregiver_id: item.caregiverId,
        document_type: item.documentType,
        expiration_date: item.expirationDate,
        checkpoint: item.checkpoint,
        days_left: item.daysLeft,
      })),
    }
    summary.admin_digest = 'planned'
    return summary
  }

  const claims = await claim(supabase, companyId, adminDue, 'admin', 'email', today)
  if (claims.length === 0) return summary
  try {
    await CHANNEL_SENDERS.email(recipients, buildAdminDigest(branding, claims.map((entry) => entry.item)))
    await settle(supabase, companyId, claims, 'sent')
    summary.admin_digest = 'sent'
    summary.admin_digest_documents = claims.length
  } catch (error) {
    await settle(supabase, companyId, claims, 'failed', sanitizeError(error))
    summary.admin_digest = 'failed'
    console.error(`admin digest failed for company ${companyId}:`, sanitizeError(error))
  }
  return summary
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!(await secretMatches(req.headers.get('x-cron-secret'), Deno.env.get('CRON_SECRET')))) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body?.dry_run === true
    const onlyCompany = typeof body?.company_id === 'string' ? body.company_id : null
    if (onlyCompany && !UUID_RE.test(onlyCompany)) return json({ error: 'Invalid company_id' }, 400)

    let today = todayInTimeZone()
    if (dryRun && typeof body?.as_of === 'string') {
      if (!DATE_RE.test(body.as_of)) return json({ error: 'Invalid as_of' }, 400)
      today = body.as_of
    }

    const supabase = serviceClient()

    if (!dryRun) {
      await supabase
        .from('document_expiration_reminders')
        .delete()
        .eq('result', 'pending')
        .lt('created_at', new Date(Date.now() - STALE_PENDING_MS).toISOString())
    }

    let companyQuery = supabase
      .from('company_data')
      .select('company_id, company_name, primary_color, admin_notification_emails')
    if (onlyCompany) companyQuery = companyQuery.eq('company_id', onlyCompany)
    const { data: companies, error: companyError } = await companyQuery
    if (companyError) throw new Error(`Company lookup failed: ${companyError.message}`)

    const summaries: CompanySummary[] = []
    for (const company of companies ?? []) {
      try {
        summaries.push(await processCompany(supabase, company as CompanyRow, today, dryRun))
      } catch (error) {
        console.error(`send-expiration-reminders company ${company.company_id} failed:`, sanitizeError(error))
        summaries.push({
          company_id: company.company_id,
          documents_evaluated: 0,
          skipped: {},
          employee_emails: { sent: 0, failed: 0 },
          admin_digest: 'failed',
          admin_digest_documents: 0,
          error: sanitizeError(error),
        })
      }
    }

    const totals = summaries.reduce(
      (acc, entry) => ({
        employee_emails_sent: acc.employee_emails_sent + entry.employee_emails.sent,
        employee_emails_failed: acc.employee_emails_failed + entry.employee_emails.failed,
        admin_digests_sent: acc.admin_digests_sent + (entry.admin_digest === 'sent' ? 1 : 0),
        admin_digests_failed: acc.admin_digests_failed + (entry.admin_digest === 'failed' ? 1 : 0),
      }),
      { employee_emails_sent: 0, employee_emails_failed: 0, admin_digests_sent: 0, admin_digests_failed: 0 },
    )

    console.log('send-expiration-reminders finished', JSON.stringify({ dry_run: dryRun, as_of: today, ...totals }))

    return json({ success: true, dry_run: dryRun, as_of: today, totals, companies: summaries })
  } catch (error) {
    console.error('send-expiration-reminders failed:', sanitizeError(error))
    return json({ error: 'Reminder run failed' }, 500)
  }
})
