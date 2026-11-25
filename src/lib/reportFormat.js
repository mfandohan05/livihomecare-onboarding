import {
    EXPIRATION_REQUIRED_TYPES,
    TRACKED_DOCUMENT_TYPES,
    canonicalDocumentType,
    collapseAliasedDocuments,
    documentLabel,
    findDocumentByType,
    getExpirationStatus,
    todayInTimeZone,
    toDateOnly,
} from '@/lib/documentExpiration'

const NURSE_ROLES = ['nurse_prn', 'nurse_director']
const CSV_BOM = '﻿'

const ROSTER_COLUMNS = [
    ['employeeId', 'Employee ID'],
    ['name', 'Full name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['role', 'Role'],
    ['position', 'Position title'],
    ['employmentType', 'Employment type'],
    ['startDate', 'Start date'],
    ['status', 'Status'],
    ['onboardingCompleted', 'Onboarding completed'],
    ['payRate', 'Pay rate ($/hr)'],
]

const DETAIL_COLUMNS = [
    ...ROSTER_COLUMNS,
    ['companionPayRate', 'Companion pay rate ($/hr)'],
    ['gender', 'Gender'],
    ['readyForPayroll', 'Ready for payroll'],
    ['street', 'Street address'],
    ['city', 'City'],
    ['state', 'State'],
    ['zip', 'Zip'],
    ['emergency1Name', 'Primary emergency contact'],
    ['emergency1Relationship', 'Primary emergency relationship'],
    ['emergency1Phone', 'Primary emergency phone'],
    ['emergency1Email', 'Primary emergency email'],
    ['emergency2Name', 'Secondary emergency contact'],
    ['emergency2Relationship', 'Secondary emergency relationship'],
    ['emergency2Phone', 'Secondary emergency phone'],
    ['emergency2Email', 'Secondary emergency email'],
]

const COMPLIANCE_COLUMNS = [
    ['name', 'Full name'],
    ['email', 'Email'],
    ['role', 'Role'],
    ['document', 'Document'],
    ['expirationDate', 'Expiration date'],
    ['daysUntil', 'Days until expiration'],
    ['timeUntil', 'Time until expiration'],
    ['status', 'Status'],
]

export const REPORT_TYPES = [
    {
        id: 'roster',
        label: 'Basic roster',
        description: 'One row per employee: contact details, role, employment type, start date, status, onboarding completion date and pay rate.',
        columns: ROSTER_COLUMNS,
    },
    {
        id: 'compliance',
        label: 'Compliance status',
        description: 'One row per document: its expiration date and how long until it expires. Required documents that are not on file are listed too.',
        columns: COMPLIANCE_COLUMNS,
    },
    {
        id: 'details',
        label: 'Full employee details',
        description: 'The roster plus gender, companion pay rate, payroll readiness, home address and emergency contacts. Social security numbers, dates of birth and banking details are never included.',
        columns: DETAIL_COLUMNS,
    },
]

const text = (value) => (value === null || value === undefined ? '' : String(value).trim())

export function usDate(value) {
    const date = toDateOnly(value)
    if (!date) return ''
    const [year, month, day] = date.split('-')
    return `${month}/${day}/${year}`
}

export function payText(value) {
    if (value === null || value === undefined || value === '') return ''
    const amount = Number(value)
    return Number.isFinite(amount) ? amount.toFixed(2) : ''
}

export function statusText(caregiver) {
    if (caregiver.status === 'completed') return caregiver.source === 'imported' ? 'Imported' : 'Completed'
    if (caregiver.status === 'in_progress') return 'In Progress'
    if (caregiver.status === 'cancelled') return 'Cancelled'
    return 'Pending'
}

export function onboardingCompletedDate(caregiver, timeLogs = []) {
    if (caregiver.status !== 'completed' || caregiver.source === 'imported') return ''

    const latest = timeLogs
        .map((log) => log.session_end)
        .filter(Boolean)
        .reduce((best, value) => (!best || new Date(value) > new Date(best) ? value : best), null)

    return latest ? usDate(todayInTimeZone(undefined, new Date(latest))) : ''
}

export function roleName(role, roleOptions = []) {
    const match = roleOptions.find((option) => option.role_key === role)
    return match?.display_label || role || ''
}

const byName = (a, b) => text(a.name).localeCompare(text(b.name), undefined, { sensitivity: 'base' })

function rosterRow(caregiver, { timeLogsById = {}, roleOptions = [] }) {
    return {
        employeeId: text(caregiver.employee_id),
        name: text(caregiver.name),
        email: text(caregiver.email),
        phone: text(caregiver.phone),
        role: roleName(caregiver.role, roleOptions),
        position: text(caregiver.position_title),
        employmentType: text(caregiver.employment_type),
        startDate: usDate(caregiver.start_date),
        status: statusText(caregiver),
        onboardingCompleted: onboardingCompletedDate(caregiver, timeLogsById[caregiver.id]),
        payRate: payText(caregiver.pay_rate),
    }
}

export function rosterRows(caregivers, context = {}) {
    return [...caregivers].sort(byName).map((caregiver) => rosterRow(caregiver, context))
}

const fullName = (first, last) => [text(first), text(last)].filter(Boolean).join(' ')

export function detailRows(caregivers, context = {}) {
    const { personalInfoById = {} } = context

    return [...caregivers].sort(byName).map((caregiver) => {
        const info = personalInfoById[caregiver.id] || {}

        return {
            ...rosterRow(caregiver, context),
            companionPayRate: payText(caregiver.companion_pay_rate),
            gender: text(caregiver.gender),
            readyForPayroll: caregiver.ready_for_payroll ? 'Yes' : 'No',
            street: [text(info.streetAddress), text(info.addressLine2)].filter(Boolean).join(' '),
            city: text(info.city),
            state: text(info.state),
            zip: text(info.zip),
            emergency1Name: fullName(info.primaryEmergencyFirstName, info.primaryEmergencyLastName),
            emergency1Relationship: text(info.primaryEmergencyRelationship),
            emergency1Phone: text(info.primaryEmergencyPrimaryPhone),
            emergency1Email: text(info.primaryEmergencyEmail),
            emergency2Name: fullName(info.secondaryEmergencyFirstName, info.secondaryEmergencyLastName),
            emergency2Relationship: text(info.secondaryEmergencyRelationship),
            emergency2Phone: text(info.secondaryEmergencyPrimaryPhone),
            emergency2Email: text(info.secondaryEmergencyEmail),
        }
    })
}

function documentStatus(expiration) {
    if (!expiration) return 'No expiration date'
    if (expiration.level === 'expired') return 'Expired'
    if (expiration.level === 'none') return 'Valid'
    return 'Expiring soon'
}

export function complianceRows(caregivers, documents, { roleOptions = [], today = todayInTimeZone() } = {}) {
    const docsById = new Map()
    for (const doc of documents) {
        if (!docsById.has(doc.caregiver_id)) docsById.set(doc.caregiver_id, [])
        docsById.get(doc.caregiver_id).push(doc)
    }

    const rows = []
    for (const caregiver of [...caregivers].sort(byName)) {
        const own = docsById.get(caregiver.id) || []
        const tracked = collapseAliasedDocuments(own.filter((doc) => TRACKED_DOCUMENT_TYPES.includes(doc.document_type)))
        const isNurse = NURSE_ROLES.includes(caregiver.role)

        const base = {
            name: text(caregiver.name),
            email: text(caregiver.email),
            role: roleName(caregiver.role, roleOptions),
        }

        const documentRows = tracked.map((doc) => {
            const expiration = getExpirationStatus(doc.expiration_date, today)
            return {
                ...base,
                document: documentLabel(canonicalDocumentType(doc.document_type)),
                expirationDate: expiration ? usDate(expiration.date) : '',
                daysUntil: expiration ? expiration.daysLeft : '',
                timeUntil: expiration ? expiration.label : '',
                status: documentStatus(expiration),
            }
        })

        const missingRows = EXPIRATION_REQUIRED_TYPES
            .filter((type) => (type !== 'nursingLicense' || isNurse) && !findDocumentByType(own, type))
            .map((type) => ({
                ...base,
                document: documentLabel(type),
                expirationDate: '',
                daysUntil: '',
                timeUntil: '',
                status: 'Not on file',
            }))

        documentRows
            .sort((a, b) => (a.daysUntil === '' ? Infinity : a.daysUntil) - (b.daysUntil === '' ? Infinity : b.daysUntil))
            .forEach((row) => rows.push(row))
        missingRows.forEach((row) => rows.push(row))
    }
    return rows
}

export function csvCell(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'number') return String(value)

    let cell = String(value)
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`
    if (/[",\r\n]/.test(cell)) cell = `"${cell.replace(/"/g, '""')}"`
    return cell
}

export function toCsv(columns, rows) {
    const header = columns.map(([, label]) => csvCell(label)).join(',')
    const lines = rows.map((row) => columns.map(([key]) => csvCell(row[key])).join(','))
    return CSV_BOM + [header, ...lines].join('\r\n') + '\r\n'
}

export function reportFilename(reportId, now = new Date()) {
    return `${reportId}-report-${todayInTimeZone(undefined, now)}.csv`
}

export function buildReport(reportId, data) {
    const type = REPORT_TYPES.find((t) => t.id === reportId)
    if (!type) throw new Error(`Unknown report: ${reportId}`)

    const rows = reportId === 'roster'
        ? rosterRows(data.caregivers, data)
        : reportId === 'compliance'
            ? complianceRows(data.caregivers, data.documents || [], data)
            : detailRows(data.caregivers, data)

    return { columns: type.columns, rows, csv: toCsv(type.columns, rows), filename: reportFilename(reportId, data.now) }
}
