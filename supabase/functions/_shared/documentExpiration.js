export const EXPIRATION_TIME_ZONE = 'America/New_York'
export const EXPIRED_REPEAT_DAYS = 7

export const EXPIRATION_BANDS = [
  { level: 'critical', maxDays: 7, checkpoint: '7' },
  { level: 'warning', maxDays: 15, checkpoint: '15' },
  { level: 'notice', maxDays: 30, checkpoint: '30' },
]

export const EXPIRATION_SEVERITY = { expired: 4, critical: 3, warning: 2, notice: 1, none: 0 }

export const CHECKPOINT_ORDER = ['expired', '7', '15', '30']

export const TRACKED_DOCUMENT_TYPES = [
  'driversLicense',
  'carInsurance',
  'nursingLicense',
  'socialSecurityCard',
  'certifications',
  'tbTest',
  'bloodborne_certificate',
  'bloodbornePathogens',
]

export const EXPIRATION_REQUIRED_TYPES = ['driversLicense', 'carInsurance', 'nursingLicense']

export const DOCUMENT_ALIAS_GROUPS = [['bloodborne_certificate', 'bloodbornePathogens']]

export const TRACKED_DOCUMENT_LABELS = {
  driversLicense: "Driver's License",
  carInsurance: 'Car Insurance',
  nursingLicense: 'Nursing License',
  socialSecurityCard: 'Social Security Card / Other Supporting I-9 Documentation',
  certifications: 'Certifications',
  tbTest: 'TB Test',
  bloodborne_certificate: 'Bloodborne Pathogens Certificate',
  bloodbornePathogens: 'Bloodborne Pathogens Certificate',
}

export function isTrackedDocumentType(type) {
  return TRACKED_DOCUMENT_TYPES.includes(type)
}

export function canonicalDocumentType(type) {
  const group = DOCUMENT_ALIAS_GROUPS.find((types) => types.includes(type))
  return group ? group[0] : type
}

export function aliasesOf(type) {
  const group = DOCUMENT_ALIAS_GROUPS.find((types) => types.includes(type))
  return group ? [...group] : [type]
}

export function documentLabel(type) {
  return TRACKED_DOCUMENT_LABELS[type] || type
}

export function toDateOnly(value) {
  if (!value) return null
  const text = value instanceof Date ? value.toISOString() : String(value)
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

function dayNumber(dateOnly) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

export function daysBetween(fromDate, toDate) {
  return dayNumber(toDate) - dayNumber(fromDate)
}

export function addDays(dateOnly, days) {
  return new Date((dayNumber(dateOnly) + days) * 86400000).toISOString().slice(0, 10)
}

export function todayInTimeZone(timeZone = EXPIRATION_TIME_ZONE, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function toExpirationTimestamp(dateOnly) {
  const date = toDateOnly(dateOnly)
  return date ? `${date}T00:00:00Z` : null
}

export function formatDateOnly(dateOnly) {
  if (!dateOnly) return ''
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function pluralDays(count) {
  return `${count} day${count === 1 ? '' : 's'}`
}

function describe(daysLeft) {
  if (daysLeft < 0) return `Expired ${pluralDays(-daysLeft)} ago`
  if (daysLeft === 0) return 'Expires today'
  return `Expires in ${pluralDays(daysLeft)}`
}

export function getExpirationStatus(expirationDate, today = todayInTimeZone()) {
  const date = toDateOnly(expirationDate)
  if (!date) return null
  const daysLeft = daysBetween(today, date)
  const label = describe(daysLeft)
  if (daysLeft < 0) return { level: 'expired', checkpoint: 'expired', daysLeft, date, label }
  const band = EXPIRATION_BANDS.find((entry) => daysLeft <= entry.maxDays)
  if (!band) return { level: 'none', checkpoint: null, daysLeft, date, label }
  return { level: band.level, checkpoint: band.checkpoint, daysLeft, date, label }
}

export function worstStatus(statuses) {
  return statuses.reduce((worst, status) => {
    if (!status) return worst
    if (!worst) return status
    const diff = EXPIRATION_SEVERITY[status.level] - EXPIRATION_SEVERITY[worst.level]
    if (diff > 0 || (diff === 0 && status.daysLeft < worst.daysLeft)) return status
    return worst
  }, null)
}

function expirationRank(doc) {
  const date = toDateOnly(doc.expiration_date)
  return date ? dayNumber(date) : -Infinity
}

export function collapseAliasedDocuments(documents) {
  const chosen = new Map()
  for (const doc of documents) {
    const key = `${doc.caregiver_id}:${canonicalDocumentType(doc.document_type)}`
    const current = chosen.get(key)
    if (!current || expirationRank(doc) > expirationRank(current)) chosen.set(key, doc)
  }
  return [...chosen.values()]
}

export function findDocumentByType(documents, type) {
  const aliases = aliasesOf(type)
  return documents
    .filter((doc) => aliases.includes(doc.document_type))
    .reduce((best, doc) => (!best || expirationRank(doc) > expirationRank(best) ? doc : best), null)
}
