import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdminContext } from '../_shared/requireAdmin.ts'
import { assignTrainings, CAREGIVER_ROLES } from '../_shared/training.ts'
import { buildWelcomeEmail, loadBranding, sendWelcomeEmails } from '../_shared/importWelcomeEmail.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const MAX_ROWS = 1000
const UNIQUE_VIOLATION = '23505'
const ID_CHUNK = 100
const TEMPLATE_BUCKET = 'generated-pdfs'
const TEMPLATE_PATH = 'templates/default/employee-import-template.csv'
const TEMPLATE_FILENAME = 'employee-import-template.csv'
const TEMPLATE_URL_TTL_SECONDS = 600

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMPLOYMENT_TYPES = ['Hourly, Part-Time', 'Hourly, Full-Time', 'Independent Contractor']
const GENDERS = ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say']
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
]
const CONTACT_FIELDS = [
  'FirstName', 'LastName', 'StreetAddress', 'AddressLine2', 'City', 'State', 'Zip',
  'PrimaryPhone', 'SecondaryPhone', 'Email', 'Relationship',
]

type RawRow = Record<string, unknown>

type RowResult = {
  line: number
  email: string
  status: 'valid' | 'created' | 'invalid' | 'duplicate'
  reason?: string
  emailSent?: boolean
}

type Lookups = {
  roleNames: string[]
  roleByInput: Map<string, string>
  existingEmails: Set<string>
  seenEmails: Set<string>
}

type Validation =
  | { ok: true; record: Record<string, unknown>; personalInfo: Record<string, string> }
  | { ok: false; status: 'invalid' | 'duplicate'; reason: string }

type Parsed<T> = { value: T | null; error: string | null }

const text = (value: unknown): string => (value == null ? '' : String(value).trim())

const roleLookupKey = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_')

const caseInsensitiveLookup = (values: string[]) => new Map(values.map((v) => [v.toLowerCase(), v]))
const employmentTypeByInput = caseInsensitiveLookup(EMPLOYMENT_TYPES)
const genderByInput = caseInsensitiveLookup(GENDERS)

function toIsoDate(value: string): string | null {
  const iso = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  const us = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)

  const parts = iso
    ? { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
    : us
    ? { year: Number(us[3]), month: Number(us[1]), day: Number(us[2]) }
    : null
  if (!parts) return null

  const { year, month, day } = parts
  if (year < 1900 || year > 2100) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  const isRealDate = date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  return isRealDate ? date.toISOString().slice(0, 10) : null
}

function toPhone(value: string): string | null {
  let digits = value.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1)
  if (digits.length !== 10) return null
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function toState(value: string): string | null {
  const state = value.toUpperCase()
  return US_STATES.includes(state) ? state : null
}

function toZip(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 4) return digits.padStart(5, '0')
  if (digits.length === 5 || digits.length === 9) return digits.slice(0, 5)
  return null
}

function toPayRate(value: string): number | null {
  const rate = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(rate) && rate >= 0 && rate < 10000 ? rate : null
}

function toEmail(value: string): string | null {
  const email = value.toLowerCase()
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null
}

function parseOptional<T>(raw: string, parse: (value: string) => T | null, message: string): Parsed<T> {
  if (!raw) return { value: null, error: null }
  const value = parse(raw)
  return value === null ? { value: null, error: message } : { value, error: null }
}

function splitName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

async function loadRoles(supabase: SupabaseClient, companyId: string) {
  const { data: labels, error } = await supabase
    .from('role_labels')
    .select('role_key, display_label')
    .eq('company_id', companyId)
  if (error) throw error

  const roleKeys: string[] = labels?.length ? labels.map((l) => l.role_key) : CAREGIVER_ROLES

  const roleByInput = new Map<string, string>()
  for (const key of roleKeys) roleByInput.set(roleLookupKey(key), key)
  for (const label of labels ?? []) {
    if (label.display_label) roleByInput.set(roleLookupKey(String(label.display_label)), label.role_key)
  }
  const roleNames: string[] = labels?.length
    ? labels.map((l) => l.display_label || l.role_key)
    : CAREGIVER_ROLES
  return { roleNames, roleByInput }
}

async function loadExistingEmails(supabase: SupabaseClient, companyId: string): Promise<Set<string>> {
  const PAGE = 1000
  const emails = new Set<string>()

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('caregivers')
      .select('email')
      .eq('company_id', companyId)
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error

    for (const row of data ?? []) emails.add(String(row.email).toLowerCase())
    if (!data || data.length < PAGE) break
  }
  return emails
}

const prefixed = (prefix: string, values: Record<string, string>) =>
  Object.fromEntries(CONTACT_FIELDS.map((field) => [`${prefix}${field}`, values[field] ?? '']))

function validateRow(raw: RawRow, lookups: Lookups): Validation {
  const invalid = (reason: string): Validation => ({ ok: false, status: 'invalid', reason })
  const field = (key: string) => text(raw[key])

  const name = field('name')
  const email = field('email').toLowerCase()
  const positionTitle = field('position_title')
  const employmentRaw = field('employment_type')
  const employeeId = field('employee_id')

  if (!name) return invalid('Name is required')
  if (!toEmail(email)) return invalid('Email is missing or not valid')

  const role = lookups.roleByInput.get(roleLookupKey(field('role')))
  if (!role) return invalid(`Role must be one of: ${lookups.roleNames.join(', ')}`)

  if (lookups.existingEmails.has(email)) {
    return { ok: false, status: 'duplicate', reason: 'An employee with this email already exists' }
  }
  if (lookups.seenEmails.has(email)) {
    return { ok: false, status: 'duplicate', reason: 'This email appears more than once in the file' }
  }

  if (!positionTitle) return invalid('Position title is required')
  if (!employmentRaw) return invalid('Employment type is required')
  const employmentType = employmentTypeByInput.get(employmentRaw.toLowerCase())
  if (!employmentType) return invalid(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(' | ')}`)

  const gender = parseOptional(field('gender'), (v) => genderByInput.get(v.toLowerCase()) ?? null,
    `Gender must be one of: ${GENDERS.join(' | ')}`)
  const startDate = parseOptional(field('start_date'), toIsoDate,
    'Start date is not a valid date. Use YYYY-MM-DD or M/D/YYYY, e.g. 2025-03-14')
  const payRate = parseOptional(field('pay_rate'), toPayRate, 'Pay rate must be a number, e.g. 18.50')
  const phone = parseOptional(field('phone'), toPhone, 'Phone must have 10 digits, e.g. (704) 555-0123')
  const state = parseOptional(field('state'), toState, 'State must be a 2-letter code, e.g. NC')
  const zip = parseOptional(field('zip'), toZip, 'Zip must be 5 digits, e.g. 28202')

  const emergencyPhone = parseOptional(field('emergency_phone'), toPhone,
    'Emergency contact phone must have 10 digits, e.g. (704) 555-0123')
  const emergencySecondaryPhone = parseOptional(field('emergency_secondary_phone'), toPhone,
    'Emergency contact secondary phone must have 10 digits, e.g. (704) 555-0123')
  const emergencyEmail = parseOptional(field('emergency_email'), toEmail, 'Emergency contact email is not valid')
  const emergencyState = parseOptional(field('emergency_state'), toState,
    'Emergency contact state must be a 2-letter code, e.g. NC')
  const emergencyZip = parseOptional(field('emergency_zip'), toZip, 'Emergency contact zip must be 5 digits')

  const parseError = [
    gender, startDate, payRate, phone, state, zip,
    emergencyPhone, emergencySecondaryPhone, emergencyEmail, emergencyState, emergencyZip,
  ].find((parsed) => parsed.error)?.error
  if (parseError) return invalid(parseError)

  const street = field('street_address')
  const city = field('city')
  const address = [street, city, field('state'), field('zip')]
  if (address.some(Boolean) && !address.every(Boolean)) {
    return invalid('Address needs a street address, city, state and zip. Fill in all four or leave them empty')
  }

  const emergencyFirstName = field('emergency_first_name')
  const emergencyLastName = field('emergency_last_name')
  const emergencyRelationship = field('emergency_relationship')
  const emergencyStreet = field('emergency_street_address')
  const emergencyCity = field('emergency_city')
  const emergencyAddress = [emergencyStreet, emergencyCity, field('emergency_state'), field('emergency_zip')]
  const emergencyContact = [
    emergencyFirstName, emergencyLastName, emergencyRelationship,
    field('emergency_phone'), field('emergency_secondary_phone'), field('emergency_email'),
    ...emergencyAddress,
  ]
  if (emergencyContact.some(Boolean) && !(emergencyFirstName && emergencyLastName)) {
    return invalid('Emergency contact needs a first and last name')
  }
  if (emergencyAddress.some(Boolean) && !emergencyAddress.every(Boolean)) {
    return invalid('Emergency contact address needs a street address, city, state and zip. Fill in all four or leave them empty')
  }

  const lengthChecked = [
    name, positionTitle, employeeId, field('phone'), street, city,
    emergencyFirstName, emergencyLastName, emergencyRelationship, emergencyStreet, emergencyCity,
  ]
  if (lengthChecked.some((value) => value.length > 200)) {
    return invalid('A value is too long (200 characters maximum)')
  }

  return {
    ok: true,
    record: {
      name,
      email,
      phone: phone.value,
      role,
      position_title: positionTitle,
      employment_type: employmentType,
      start_date: startDate.value,
      hire_date: startDate.value,
      employee_id: employeeId || null,
      gender: gender.value,
      pay_rate: payRate.value,
      status: 'completed',
      source: 'imported',
      link_expires_at: null,
    },
    personalInfo: {
      ...splitName(name),
      streetAddress: street,
      addressLine2: '',
      city,
      state: state.value ?? '',
      zip: zip.value ?? '',
      primaryPhone: phone.value ?? '',
      secondaryPhone: '',
      email,
      ...prefixed('primaryEmergency', {
        FirstName: emergencyFirstName,
        LastName: emergencyLastName,
        StreetAddress: emergencyStreet,
        City: emergencyCity,
        State: emergencyState.value ?? '',
        Zip: emergencyZip.value ?? '',
        PrimaryPhone: emergencyPhone.value ?? '',
        SecondaryPhone: emergencySecondaryPhone.value ?? '',
        Email: emergencyEmail.value ?? '',
        Relationship: emergencyRelationship,
      }),
      ...prefixed('secondaryEmergency', {}),
    },
  }
}

const countByStatus = (results: RowResult[], status: RowResult['status']) =>
  results.filter((r) => r.status === status).length

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = await requireAdminContext(req)
    const { supabase, companyId } = admin

    let body
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid request' }, 400)
    }

    if (body?.action === 'template') {
      const { data, error } = await supabase.storage
        .from(TEMPLATE_BUCKET)
        .createSignedUrl(TEMPLATE_PATH, TEMPLATE_URL_TTL_SECONDS, { download: TEMPLATE_FILENAME })

      if (error || !data?.signedUrl) {
        console.error('Template not found:', error)
        return json({ error: 'Template not found' }, 404)
      }
      return json({ signedUrl: data.signedUrl })
    }

    if (body?.action === 'resend') {
      const caregiverId = typeof body.caregiverId === 'string' ? body.caregiverId : ''
      if (!UUID_PATTERN.test(caregiverId)) return json({ error: 'Employee not found' }, 404)

      const { data: employee } = await supabase
        .from('caregivers')
        .select('id, name, email, token, user_id, source')
        .eq('id', caregiverId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (!employee || employee.source !== 'imported') return json({ error: 'Employee not found' }, 404)
      if (employee.user_id) return json({ error: 'This employee already has an account.' }, 400)

      const token = employee.token ?? crypto.randomUUID()
      if (!employee.token) await supabase.from('caregivers').update({ token }).eq('id', employee.id)

      const branding = await loadBranding(supabase, companyId)
      const [sent] = await sendWelcomeEmails([buildWelcomeEmail({ name: employee.name, email: employee.email, token }, branding)])
      if (!sent) return json({ error: 'The email could not be sent. Please try again.' }, 502)

      const welcomeEmailSentAt = new Date().toISOString()
      await supabase.from('caregivers').update({ welcome_email_sent_at: welcomeEmailSentAt }).eq('id', employee.id)

      const { error: auditError } = await supabase.from('audit_logs').insert({
        admin_id: admin.userId,
        admin_email: admin.email,
        action: 'resent_invitation',
        caregiver_id: employee.id,
        caregiver_name: employee.name,
        company_id: companyId,
        metadata: { admin_name: admin.name },
      })
      if (auditError) console.error('audit log failed', auditError)

      return json({ success: true, welcomeEmailSentAt })
    }

    const rows: unknown = body?.rows
    const sendEmails = body?.sendEmails !== false
    const validateOnly = body?.validateOnly === true

    if (!Array.isArray(rows) || rows.length === 0) return json({ error: 'No rows to import' }, 400)
    if (rows.length > MAX_ROWS) {
      return json({ error: `Please import at most ${MAX_ROWS} employees at a time.` }, 400)
    }

    const { roleNames, roleByInput } = await loadRoles(supabase, companyId)
    const lookups: Lookups = {
      roleNames,
      roleByInput,
      existingEmails: await loadExistingEmails(supabase, companyId),
      seenEmails: new Set(),
    }

    const results: RowResult[] = []
    const records: Record<string, unknown>[] = []
    const personalInfoByEmail = new Map<string, Record<string, string>>()

    rows.forEach((item, index) => {
      const raw: RawRow = item && typeof item === 'object' ? (item as RawRow) : {}
      const line = Number.isInteger(raw.line) ? (raw.line as number) : index + 2
      const email = text(raw.email).toLowerCase()

      const check = validateRow(raw, lookups)
      if (!check.ok) {
        results.push({ line, email, status: check.status, reason: check.reason })
        return
      }

      lookups.seenEmails.add(email)
      results.push({ line, email, status: 'valid' })
      records.push({ ...check.record, company_id: companyId })
      personalInfoByEmail.set(email, check.personalInfo)
    })

    const buildSummary = (trainingFailures = 0, profileFailures = 0) => ({
      total: results.length,
      valid: countByStatus(results, 'valid'),
      created: countByStatus(results, 'created'),
      invalid: countByStatus(results, 'invalid'),
      duplicate: countByStatus(results, 'duplicate'),
      emailed: results.filter((r) => r.emailSent === true).length,
      trainingFailures,
      profileFailures,
    })

    if (validateOnly || records.length === 0) {
      return json({ success: true, validateOnly, results, summary: buildSummary() })
    }

    const { data: created, error: insertError } = await supabase
      .from('caregivers')
      .insert(records)
      .select('id, name, email, role, token, company_id')

    if (insertError || !created) {
      console.error('admin-import-employees insert failed:', insertError)
      const message = insertError?.code === UNIQUE_VIOLATION
        ? 'Some of these employees were added while the import was running. Nothing was imported. Please try again.'
        : 'Could not save the employees. Nothing was imported.'
      return json({ error: message }, insertError?.code === UNIQUE_VIOLATION ? 409 : 500)
    }

    const resultByEmail = new Map(results.map((r) => [r.email, r]))
    for (const employee of created) {
      const result = resultByEmail.get(String(employee.email).toLowerCase())
      if (result) result.status = 'created'
    }

    let profileFailures = 0
    const { error: profileError } = await supabase.from('caregiver_progress').insert(
      created.map((employee) => ({
        caregiver_id: employee.id,
        company_id: employee.company_id,
        active_step: 1,
        completed_steps: [],
        form_data: { personalInfo: personalInfoByEmail.get(String(employee.email).toLowerCase()) },
        last_saved: new Date().toISOString(),
      }))
    )
    if (profileError) {
      profileFailures = created.length
      console.error('profile data could not be saved:', profileError)
    }

    let trainingFailures = 0
    for (const employee of created) {
      try {
        await assignTrainings(supabase, {
          id: employee.id,
          company_id: employee.company_id,
          role: String(employee.role || ''),
        })
      } catch (err) {
        trainingFailures++
        console.error('training assignment failed for', employee.id, err)
      }
    }

    if (sendEmails) {
      const branding = await loadBranding(supabase, companyId)
      const delivered = await sendWelcomeEmails(created.map((e) => buildWelcomeEmail(e, branding)))
      created.forEach((employee, i) => {
        const result = resultByEmail.get(String(employee.email).toLowerCase())
        if (result) result.emailSent = delivered[i]
      })

      const sentIds = created.filter((_, i) => delivered[i]).map((e) => e.id)
      const sentAt = new Date().toISOString()
      for (let i = 0; i < sentIds.length; i += ID_CHUNK) {
        const { error: stampError } = await supabase
          .from('caregivers')
          .update({ welcome_email_sent_at: sentAt })
          .in('id', sentIds.slice(i, i + ID_CHUNK))
        if (stampError) console.error('welcome_email_sent_at update failed:', stampError)
      }
    }

    const summary = buildSummary(trainingFailures, profileFailures)

    const { error: auditError } = await supabase.from('audit_logs').insert({
      admin_id: admin.userId,
      admin_email: admin.email,
      action: 'imported_employees',
      company_id: companyId,
      metadata: {
        admin_name: admin.name,
        created: summary.created,
        skipped: summary.invalid + summary.duplicate,
        emailed: summary.emailed,
        emails_requested: sendEmails,
      },
    })
    if (auditError) console.error('audit log failed', auditError)

    return json({ success: true, validateOnly: false, results, summary })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return json({ error: 'Unauthorized' }, 401)
    }
    console.error('admin-import-employees failed:', err)
    return json({ error: 'Import failed. Please try again.' }, 500)
  }
})
