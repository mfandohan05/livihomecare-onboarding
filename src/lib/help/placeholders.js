const GENERIC = 'your employer'

export function buildCompanyValues(company) {
  const name = company?.name?.trim() || ''
  const phone = company?.phone?.trim() || ''
  const email = company?.email?.trim() || ''
  const contactParts = [phone, email].filter(Boolean)
  return {
    'company.name': name || GENERIC,
    'company.phone': phone || GENERIC,
    'company.email': email || GENERIC,
    'company.contact': contactParts.length ? contactParts.join(' or ') : GENERIC,
  }
}

export function fillPlaceholders(text, company) {
  if (typeof text !== 'string' || !text.includes('{{')) return text
  const values = buildCompanyValues(company)
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => values[key] ?? match)
}
export function sentenceCase(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}
