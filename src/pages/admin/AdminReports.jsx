import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Button } from '@/components/ui/button'
import HowDoesThisWork from '@/components/help/HowDoesThisWork'
import ReportEmployeePicker from '@/components/admin/ReportEmployeePicker'
import { MAX_REPORT_EMPLOYEES, loadReportData } from '@/lib/reportData'
import { COMPLIANCE_SORTS, REPORT_TYPES, buildReport, toCsv } from '@/lib/reportFormat'
import { toXlsxBlob } from '@/lib/reportExcel'
import { CSV_TYPE, downloadBlob } from '@/lib/downloadFile'

const FORMATS = {
    xlsx: { extension: 'xlsx', toBlob: toXlsxBlob },
    csv: { extension: 'csv', toBlob: async (columns, rows) => new Blob([toCsv(columns, rows)], { type: CSV_TYPE }) },
}

const allColumnKeys = () => Object.fromEntries(REPORT_TYPES.map((type) => [type.id, type.columns.map(([key]) => key)]))

async function recordExport(companyId, reportId, count, format, columns) {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { error } = await supabase.from('audit_logs').insert({
            admin_id: session.user.id,
            admin_email: session.user.email,
            action: 'exported_report',
            company_id: companyId,
            metadata: { report: reportId, employees: count, format, columns },
        })
        if (error) throw error
    } catch (err) {
        console.error('audit log failed', err)
    }
}

export default function AdminReports() {
    const { companyId } = useCompany()
    const [reportId, setReportId] = useState(REPORT_TYPES[0].id)
    const [selected, setSelected] = useState(new Set())
    const [roleOptions, setRoleOptions] = useState([])
    const [complianceSort, setComplianceSort] = useState(COMPLIANCE_SORTS[0].value)
    const [progress, setProgress] = useState(null)
    const [columnKeys, setColumnKeys] = useState(allColumnKeys)

    useEffect(() => {
        if (!companyId) return
        supabase
            .from('role_labels')
            .select('role_key, display_label')
            .eq('company_id', companyId)
            .then(({ data }) => setRoleOptions(data || []))
    }, [companyId])

    const report = REPORT_TYPES.find((type) => type.id === reportId)
    const running = progress !== null
    const chosenKeys = columnKeys[reportId]
    const chosen = new Set(chosenKeys)

    const setChosen = (keys) => setColumnKeys((current) => ({ ...current, [reportId]: keys }))
    const toggleColumn = (key) => setChosen(
        report.columns.map(([k]) => k).filter((k) => (k === key ? !chosen.has(k) : chosen.has(k)))
    )

    const runReport = async (format) => {
        if (selected.size > MAX_REPORT_EMPLOYEES) {
            toast.error(`A report can include at most ${MAX_REPORT_EMPLOYEES.toLocaleString()} employees.`)
            return
        }

        const ids = [...selected]
        setProgress({ done: 0, total: ids.length, format })

        try {
            const data = await loadReportData(companyId, reportId, ids, (done, total) => setProgress({ done, total, format }))
            const { columns, rows, baseName } = buildReport(reportId, { ...data, roleOptions, sort: complianceSort }, chosenKeys)
            const { extension, toBlob } = FORMATS[format]

            downloadBlob(`${baseName}.${extension}`, await toBlob(columns, rows, report.label))
            toast.success(`${report.label} report downloaded (${rows.length.toLocaleString()} row${rows.length === 1 ? '' : 's'})`)
            recordExport(companyId, reportId, ids.length, format, columns.map(([key]) => key))
        } catch (err) {
            toast.error(err.message || 'The report could not be created. Please try again.')
        } finally {
            setProgress(null)
        }
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Reports</h1>
                    <p className="text-muted-foreground">Choose a report and the employees to include, then download it as an Excel spreadsheet or a CSV file.</p>
                </div>
                <HowDoesThisWork article="reports" className="shrink-0" />
            </div>

            <section className="bg-white rounded-xl border border-border p-6 mb-6">
                <h2 className="font-semibold mb-4">1. Choose a report</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    {REPORT_TYPES.map((type) => (
                        <label
                            key={type.id}
                            className={`block cursor-pointer rounded-lg border p-4 transition-colors ${type.id === reportId
                                ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)]'
                                : 'border-border hover:border-[var(--primary-color)]'}`}
                        >
                            <input
                                type="radio"
                                name="report"
                                value={type.id}
                                checked={type.id === reportId}
                                onChange={() => setReportId(type.id)}
                                className="sr-only"
                            />
                            <span className="block text-sm font-medium mb-1">{type.label}</span>
                            <span className="block text-xs text-muted-foreground">{type.description}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <p className="font-medium">
                            Columns to include
                            <span className="text-muted-foreground font-normal"> · {chosenKeys.length} of {report.columns.length}</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setChosen(report.columns.map(([key]) => key))}
                                className="text-[var(--primary-color)] hover:underline disabled:opacity-50 disabled:no-underline"
                                disabled={chosenKeys.length === report.columns.length}
                            >
                                Select all
                            </button>
                            <button
                                type="button"
                                onClick={() => setChosen([])}
                                className="text-[var(--primary-color)] hover:underline disabled:opacity-50 disabled:no-underline"
                                disabled={chosenKeys.length === 0}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3">
                        {report.columns.map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={chosen.has(key)}
                                    onChange={() => toggleColumn(key)}
                                    className="h-4 w-4 shrink-0 accent-[var(--primary-color)]"
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                    {chosenKeys.length === 0 && (
                        <p className="mt-2 text-red-500">Choose at least one column.</p>
                    )}
                </div>
                {reportId === 'compliance' && (
                    <label className="mt-4 flex items-center gap-2 text-xs">
                        <span className="font-medium">Sort rows by</span>
                        <select
                            value={complianceSort}
                            onChange={(e) => setComplianceSort(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[var(--primary-color)]"
                        >
                            {COMPLIANCE_SORTS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                )}
            </section>

            <section className="bg-white rounded-xl border border-border p-6 mb-6">
                <h2 className="font-semibold mb-4">2. Choose employees</h2>
                <ReportEmployeePicker
                    companyId={companyId}
                    roleOptions={roleOptions}
                    selected={selected}
                    onChange={setSelected}
                />
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-border p-6">
                <p className="text-sm">
                    <span className="font-semibold">{selected.size.toLocaleString()}</span> employee{selected.size === 1 ? '' : 's'} selected
                    {running && (
                        <span className="text-muted-foreground"> · Preparing {progress.done.toLocaleString()} of {progress.total.toLocaleString()}...</span>
                    )}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => runReport('csv')}
                        disabled={selected.size === 0 || chosenKeys.length === 0 || running}
                    >
                        {progress?.format === 'csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Download CSV
                    </Button>
                    <Button
                        onClick={() => runReport('xlsx')}
                        disabled={selected.size === 0 || chosenKeys.length === 0 || running}
                        className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white disabled:opacity-50"
                    >
                        {progress?.format === 'xlsx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                        Download Excel (.xlsx)
                    </Button>
                </div>
            </div>
        </div>
    )
}
