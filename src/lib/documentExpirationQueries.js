import { supabase } from '@/lib/supabase'
import {
  collapseAliasedDocuments,
  getExpirationStatus,
  isTrackedDocumentType,
  todayInTimeZone,
  worstStatus,
} from './documentExpiration'

const PAGE_SIZE = 1000

export const EXPIRY_FILTERS = ['all', 'attention', 'expired', 'expiring']

export function summarizeDocuments(documents, today = todayInTimeZone()) {
  const statusesByCaregiver = new Map()
  for (const doc of collapseAliasedDocuments(documents.filter((d) => isTrackedDocumentType(d.document_type)))) {
    const status = getExpirationStatus(doc.expiration_date, today)
    if (!status) continue
    const list = statusesByCaregiver.get(doc.caregiver_id) ?? []
    list.push(status)
    statusesByCaregiver.set(doc.caregiver_id, list)
  }

  const summaries = new Map()
  for (const [caregiverId, statuses] of statusesByCaregiver) {
    const expiredCount = statuses.filter((s) => s.level === 'expired').length
    const expiringCount = statuses.filter((s) => s.level !== 'expired' && s.level !== 'none').length
    summaries.set(caregiverId, {
      worst: worstStatus(statuses),
      expiredCount,
      expiringCount,
      attentionCount: expiredCount + expiringCount,
    })
  }
  return summaries
}

export function matchesExpiryFilter(summary, filter) {
  if (!summary) return false
  if (filter === 'expired') return summary.expiredCount > 0
  if (filter === 'expiring') return summary.expiringCount > 0
  if (filter === 'attention') return summary.attentionCount > 0
  return true
}

export async function fetchExpirySummaries(companyId, caregiverIds) {
  if (!caregiverIds.length) return new Map()
  const { data, error } = await supabase
    .from('caregiver_documents')
    .select('caregiver_id, document_type, expiration_date')
    .eq('company_id', companyId)
    .in('caregiver_id', caregiverIds)
    .not('expiration_date', 'is', null)
  if (error) return new Map()
  return summarizeDocuments(data || [])
}

export async function fetchCompanyExpirySummaries(companyId) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('caregiver_documents')
      .select('caregiver_id, document_type, expiration_date')
      .eq('company_id', companyId)
      .not('expiration_date', 'is', null)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) return new Map()
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return summarizeDocuments(rows)
}
