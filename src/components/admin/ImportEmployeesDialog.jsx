import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { functionError } from '@/lib/functionError'
import { Button } from '@/components/ui/button'
import HowDoesThisWork from '@/components/help/HowDoesThisWork'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const MAX_ROWS = 1000
const MAX_FILE_BYTES = 2 * 1024 * 1024
const STATUS_LABELS = { invalid: 'Needs fixing', duplicate: 'Already exists', repeated: 'Repeated in file' }
const STATUS_STYLES = { invalid: 'text-amber-700', duplicate: 'text-red-600', repeated: 'text-amber-700' }
const SKIPPED_STATUSES = Object.keys(STATUS_LABELS)
const FORMAT_GUIDE = [
    {
        title: 'Employee',
        items: [
            { column: 'name', required: true, hint: 'Full name', example: 'Maria Santos' },
            { column: 'email', required: true, hint: 'Email address', example: 'maria@email.com' },
            { column: 'role', required: true, hint: 'Caregiver, Nurse PRN, Nurse Director or Other', example: 'Nurse Director' },
            { column: 'position_title', required: true, hint: 'Job title', example: 'Home Health Aide' },
            { column: 'employment_type', required: true, hint: 'Hourly, Part-Time / Hourly, Full-Time / Independent Contractor', example: 'Hourly, Full-Time' },
            { column: 'phone', hint: '10 digits, any format', example: '(704) 555-0123' },
            { column: 'start_date', hint: 'A real date: YYYY-MM-DD, M/D/YYYY or M/D/YY', example: '2025-03-14' },
            { column: 'employee_id', hint: 'Your own employee number', example: 'E-1001' },
            { column: 'gender', hint: 'Female, Male, Non-binary, Other or Prefer not to say', example: 'Female' },
            { column: 'pay_rate', hint: 'Hourly rate as a number', example: '18.50' },
        ],
    },
    {
        title: 'Address',
        note: 'Fill in all four columns, or leave them empty.',
        items: [
            { column: 'street_address', hint: 'Street address', example: '406 Burke Drive' },
            { column: 'city', hint: 'City', example: 'Joliet' },
            { column: 'state', hint: '2-letter state code', example: 'IL' },
            { column: 'zip', hint: '5-digit zip code', example: '60433' },
        ],
    },
    {
        title: 'Primary emergency contact',
        note: 'Needs a first and last name. Leave all empty if you do not have one.',
        items: [
            { column: 'emergency_first_name', hint: 'First name', example: 'John' },
            { column: 'emergency_last_name', hint: 'Last name', example: 'Santos' },
            { column: 'emergency_relationship', hint: 'Relationship to the employee', example: 'Spouse' },
            { column: 'emergency_phone', hint: 'Primary phone, 10 digits', example: '(704) 555-6321' },
            { column: 'emergency_secondary_phone', hint: 'Secondary phone, 10 digits', example: '(704) 555-1188' },
            { column: 'emergency_email', hint: 'Email', example: 'john.santos@email.com' },
            { column: 'emergency_street_address', hint: 'Street address', example: '406 Burke Drive' },
            { column: 'emergency_city', hint: 'City', example: 'Joliet' },
            { column: 'emergency_state', hint: '2-letter state code', example: 'IL' },
            { column: 'emergency_zip', hint: '5-digit zip code', example: '60433' },
        ],
    },
]
const joinNames = (names) =>
    names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`

function withCompanyRoles(guide, roleOptions) {
    const names = (roleOptions || []).map((role) => role.display_label || role.role_key).filter(Boolean)
    if (names.length === 0) return guide

    const example = names.find((name) => name.toLowerCase() !== 'other') || names[0]
    return guide.map((group) => ({
        ...group,
        items: group.items.map((item) => (
            item.column === 'role' ? { ...item, hint: joinNames(names), example } : item
        )),
    }))
}

const GUIDE_ITEMS = FORMAT_GUIDE.flatMap((group) => group.items)
const KNOWN_COLUMNS = GUIDE_ITEMS.map((item) => item.column)
const REQUIRED_COLUMNS = GUIDE_ITEMS.filter((item) => item.required).map((item) => item.column)

function parseCsv(input) {
    const text = (input.charCodeAt(0) === 0xfeff ? input.slice(1) : input).replace(/\r\n?/g, '\n')
    const rows = []
    let row = []
    const lines = []
    let field = ''
    let inQuotes = false
    let line = 1
    let rowLine = 1

    const endRow = () => {
        row.push(field)
        field = ''
        rows.push(row)
        lines.push(rowLine)
        row = []
        rowLine = line
    }

    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === '\n') line++

        if (inQuotes) {
            if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
            else if (ch === '"') inQuotes = false
            else field += ch
        } else if (ch === '"' && field === '') {
            inQuotes = true
        } else if (ch === ',') {
            row.push(field); field = ''
        } else if (ch === '\n') {
            endRow()
        } else {
            field += ch
        }
    }

    if (inQuotes) {
        throw new Error(`The quotation mark opened on row ${rowLine} is never closed. Check that row in your file.`)
    }
    if (field !== '' || row.length > 0) endRow()

    return { rows, lines }
}

function csvToEmployees(fileText) {
    const { rows, lines } = parseCsv(fileText)

    const headerRow = rows.findIndex((cells) => cells.some((c) => c.trim() !== ''))
    if (headerRow === -1) throw new Error('The file is empty.')

    const headerCells = rows[headerRow].map((h) => h.trim())
    if (headerCells.length === 1 && headerCells[0].includes(';')) {
        throw new Error('This file looks semicolon-separated. Save it as CSV (comma delimited) and try again.')
    }

    const headers = headerCells.map((h) => h.toLowerCase().replace(/[\s-]+/g, '_'))

    const duplicates = headers.filter((h, i) => h && headers.indexOf(h) !== i)
    if (duplicates.length > 0) {
        const names = [...new Set(duplicates)]
        throw new Error(`Column${names.length > 1 ? 's' : ''} listed more than once: ${names.join(', ')}. Each column should appear once.`)
    }

    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
    if (missing.length > 0) {
        throw new Error(`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Please start from the template.`)
    }

    const ignoredColumns = headerCells.filter((_, i) => headers[i] && !KNOWN_COLUMNS.includes(headers[i]))

    const employees = []
    rows.slice(headerRow + 1).forEach((cells, offset) => {
        if (cells.every((c) => c.trim() === '')) return
        const record = { line: lines[headerRow + 1 + offset] }
        headers.forEach((header, col) => {
            if (KNOWN_COLUMNS.includes(header)) record[header] = (cells[col] ?? '').trim()
        })
        employees.push(record)
    })

    if (employees.length === 0) throw new Error('No employees found in the file.')
    if (employees.length > MAX_ROWS) throw new Error(`Please import at most ${MAX_ROWS} employees at a time.`)
    return { employees, ignoredColumns }
}

const formatDate = (iso) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    })

function understoodDates(results, employees) {
    const rawByLine = new Map(employees.map((e) => [e.line, e.start_date]))

    return results
        .filter((r) => r.status === 'valid' && r.startDate && rawByLine.get(r.line) !== r.startDate)
        .map((r) => ({ line: r.line, email: r.email, typed: rawByLine.get(r.line), understood: formatDate(r.startDate) }))
}

function SummaryTile({ label, value, tone }) {
    const TONES = { good: 'text-[var(--primary-color)]', warn: 'text-amber-600', bad: 'text-red-500' }
    const color = TONES[tone] || 'text-foreground'
    return (
        <div className="border border-border rounded-lg px-3 py-2">
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    )
}

function SkippedTable({ rows, employees }) {
    const nameByLine = new Map(employees.map((e) => [e.line, e.name]))

    return (
        <div className="border border-border rounded-lg max-h-64 overflow-auto scrollbar-hide">
            <table className="w-full min-w-[480px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-muted">
                    <tr>
                        <th scope="col" className="px-3 py-2 font-semibold">Row</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Employee</th>
                        <th scope="col" className="px-3 py-2 font-semibold">Why it was skipped</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={`${r.line}-${r.email}`} className="border-t border-border align-top">
                            <td className="px-3 py-2 whitespace-nowrap">{r.line}</td>
                            <td className="px-3 py-2">
                                <p className="font-medium">{nameByLine.get(r.line) || '—'}</p>
                                <p className="text-muted-foreground break-all">{r.email || 'No email'}</p>
                            </td>
                            <td className="px-3 py-2">
                                <p className={`font-medium ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</p>
                                <p className="text-muted-foreground">{r.reason}</p>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ProblemList({ rows }) {
    return (
        <div className="border border-border rounded-lg divide-y max-h-48 overflow-y-auto scrollbar-hide">
            {rows.map((r) => (
                <div key={`${r.line}-${r.email}`} className="px-3 py-2 text-sm">
                    <p className="font-medium truncate">
                        Row {r.line}{r.email ? ` · ${r.email}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <span className={`font-medium ${STATUS_STYLES[r.status]}`}>
                            {STATUS_LABELS[r.status] || r.status}
                        </span>
                        : {r.reason}
                    </p>
                </div>
            ))}
        </div>
    )
}

export default function ImportEmployeesDialog({ open, onClose, onImported, roleOptions }) {
    const guide = withCompanyRoles(FORMAT_GUIDE, roleOptions)
    const [step, setStep] = useState('upload')
    const [file, setFile] = useState(null)
    const [employees, setEmployees] = useState([])
    const [ignoredColumns, setIgnoredColumns] = useState([])
    const [review, setReview] = useState(null)
    const [outcome, setOutcome] = useState(null)
    const [sendEmails, setSendEmails] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const reset = () => {
        setStep('upload')
        setFile(null)
        setEmployees([])
        setIgnoredColumns([])
        setReview(null)
        setOutcome(null)
        setSendEmails(true)
        setLoading(false)
        setError(null)
    }

    const handleClose = () => {
        if (loading) return
        const imported = step === 'done' && outcome?.summary?.created > 0
        reset()
        onClose()
        if (imported) onImported?.()
    }

    const handleDownloadTemplate = async () => {
        const { data, error: fnError } = await supabase.functions.invoke('admin-import-employees', {
            body: { action: 'template' },
        })
        if (fnError || !data?.signedUrl) {
            toast.error('Could not download the template. Please try again.')
            return
        }
        window.location.assign(data.signedUrl)
    }

    const handleFile = async (e) => {
        const picked = e.target.files?.[0]
        e.target.value = ''
        if (!picked) return

        setError(null)

        if (!/\.csv$/i.test(picked.name)) {
            setError('Please choose a .csv file.')
            return
        }
        if (picked.size > MAX_FILE_BYTES) {
            setError('That file is too large. Please keep it under 2 MB.')
            return
        }

        setLoading(true)
        try {
            const { employees: parsed, ignoredColumns: ignored } = csvToEmployees(await picked.text())
            const { data, error: fnError } = await supabase.functions.invoke('admin-import-employees', {
                body: { rows: parsed, validateOnly: true },
            })
            if (fnError) throw new Error(await functionError(fnError, 'Could not check the file. Please try again.'))

            setFile(picked)
            setEmployees(parsed)
            setIgnoredColumns(ignored)
            setReview(data)
            setStep('review')
        } catch (err) {
            setError(err.message || 'Could not read the file.')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fnError } = await supabase.functions.invoke('admin-import-employees', {
                body: { rows: employees, sendEmails },
            })
            if (fnError) throw new Error(await functionError(fnError, 'Import failed. Please try again.'))
            setOutcome(data)
            setStep('done')
        } catch (err) {
            setError(err.message || 'Import failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const summary = review?.summary
    const problems = (review?.results || []).filter((r) => SKIPPED_STATUSES.includes(r.status))
    const skippedRows = (outcome?.results || []).filter((r) => SKIPPED_STATUSES.includes(r.status))
    const readyCount = summary?.valid ?? 0
    const needFixingCount = (summary?.invalid ?? 0) + (summary?.repeated ?? 0)
    const dateChanges = understoodDates(review?.results || [], employees)
    const unsentEmails = (outcome?.results || []).filter((r) => r.status === 'created' && r.emailSent === false)

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader>
                    <DialogTitle>Import Employees</DialogTitle>
                    <HowDoesThisWork article="import-employees" className="mt-1" />
                </DialogHeader>

                {step === 'upload' && (
                    <div className="space-y-6 pt-2">
                        <div>
                            <h3 className="text-sm font-medium mb-4 pb-2 border-b">1. Download the template</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Fill in one employee per row. Columns marked <span className="text-red-500">*</span> are required.
                            </p>
                            <div className="mb-4 space-y-3">
                                {guide.map((group) => (
                                    <div key={group.title} className="overflow-hidden rounded-lg border border-border text-xs">
                                        <div className="bg-muted/60 px-3 py-2">
                                            <p className="font-semibold">{group.title}</p>
                                            {group.note && <p className="mt-0.5 text-muted-foreground">{group.note}</p>}
                                        </div>
                                        <div className="hidden sm:grid sm:grid-cols-[9.5rem_1fr_9rem] sm:gap-4 border-t border-border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                            <span>Column</span>
                                            <span>What to enter</span>
                                            <span>Example</span>
                                        </div>
                                        <ul className="divide-y divide-border border-t border-border">
                                            {group.items.map((item) => (
                                                <li
                                                    key={item.column}
                                                    className="grid grid-cols-1 gap-1 px-3 py-2.5 sm:grid-cols-[9.5rem_1fr_9rem] sm:items-center sm:gap-4"
                                                >
                                                    <p className="break-words font-medium">
                                                        {item.column}{item.required && <span className="text-red-500"> *</span>}
                                                    </p>
                                                    <p className="text-muted-foreground">{item.hint}</p>
                                                    <p>
                                                        <span className="inline-block max-w-full break-words rounded-md bg-muted px-2 py-0.5 text-foreground">
                                                            {item.example}
                                                        </span>
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-center">
                                <Button variant="outline" className="w-full sm:w-auto" onClick={handleDownloadTemplate}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download CSV template
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-4 pb-2 border-b">2. Upload your file</h3>
                            <label className={`flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 transition-colors ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-muted/30'}`}>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    disabled={loading}
                                    onChange={handleFile}
                                />
                                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-sm text-muted-foreground">
                                    {loading ? 'Checking file...' : 'Choose CSV file...'}
                                </span>
                            </label>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'review' && summary && (
                    <div className="space-y-6 pt-2">
                        <div>
                            <h3 className="text-sm font-medium mb-4 pb-2 border-b">Review</h3>
                            <p className="text-sm text-muted-foreground mb-3 truncate">{file?.name}</p>
                            <div className="grid grid-cols-3 gap-3">
                                <SummaryTile label="Ready to import" value={readyCount} tone="good" />
                                <SummaryTile label="Need fixing" value={needFixingCount} tone={needFixingCount ? 'warn' : undefined} />
                                <SummaryTile label="Already exist" value={summary.duplicate} tone={summary.duplicate ? 'bad' : undefined} />
                            </div>
                            {ignoredColumns.length > 0 && (
                                <p className="text-xs text-amber-700 mt-3">
                                    These columns are not recognized and were ignored: {ignoredColumns.join(', ')}. Check the spelling against the template.
                                </p>
                            )}
                        </div>

                        {problems.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Rows that will be skipped</h3>
                                <ProblemList rows={problems} />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Fix these in your file and upload it again, or import the ready rows now.
                                </p>
                            </div>
                        )}

                        {dateChanges.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Start dates as we read them</h3>
                                <div className="border border-border rounded-lg divide-y max-h-48 overflow-y-auto scrollbar-hide">
                                    {dateChanges.map((d) => (
                                        <div key={`${d.line}-${d.email}`} className="px-3 py-2 text-sm">
                                            <p className="font-medium truncate">Row {d.line} · {d.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {d.typed} <span aria-hidden="true">→</span> <span className="font-medium text-foreground">{d.understood}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {readyCount > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Notification</h3>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={sendEmails}
                                        onChange={(e) => setSendEmails(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 accent-[var(--primary-color)]"
                                    />
                                    <span className="text-sm">
                                        Send a welcome email to each imported employee
                                        <span className="block text-xs text-muted-foreground">
                                            Imported employees skip onboarding and get a link to create their account.
                                        </span>
                                    </span>
                                </label>
                            </div>
                        )}

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                onClick={handleImport}
                                disabled={readyCount === 0 || loading}
                                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white disabled:opacity-50 w-full sm:w-auto"
                            >
                                {loading ? 'Importing...' : `Import ${readyCount} Employee${readyCount === 1 ? '' : 's'}`}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled={loading}
                                onClick={reset}
                            >
                                Choose Another File
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'done' && outcome?.summary && (
                    <div className="space-y-6 pt-2">
                        <div>
                            <h3 className="text-sm font-medium mb-4 pb-2 border-b">Import complete</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <SummaryTile label="Imported" value={outcome.summary.created} tone="good" />
                                <SummaryTile label="Emailed" value={outcome.summary.emailed} />
                                <SummaryTile
                                    label="Skipped"
                                    value={skippedRows.length}
                                    tone={skippedRows.length > 0 ? 'bad' : undefined}
                                />
                            </div>
                            {outcome.summary.profileFailures > 0 && (
                                <p className="text-sm text-red-500 mt-3">
                                    Address and emergency contact details could not be saved for {outcome.summary.profileFailures} employee(s).
                                </p>
                            )}
                            {outcome.summary.trainingFailures > 0 && (
                                <p className="text-sm text-red-500 mt-3">
                                    Trainings could not be assigned to {outcome.summary.trainingFailures} employee(s).
                                </p>
                            )}
                        </div>

                        {skippedRows.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Skipped rows</h3>
                                <SkippedTable rows={skippedRows} employees={employees} />
                                <p className="text-xs text-muted-foreground mt-2">
                                    These rows were not imported. Fix them in your file and upload it again.
                                </p>
                            </div>
                        )}

                        {unsentEmails.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium mb-4 pb-2 border-b">Welcome emails not sent</h3>
                                <div className="border border-border rounded-lg divide-y max-h-48 overflow-y-auto scrollbar-hide">
                                    {unsentEmails.map((r) => (
                                        <p key={`${r.line}-${r.email}`} className="px-3 py-2 text-sm truncate">
                                            Row {r.line} · {r.email}
                                        </p>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    These employees were imported, but the welcome email could not be delivered. Check the addresses and contact them directly.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                onClick={handleClose}
                                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white w-full sm:w-auto"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
