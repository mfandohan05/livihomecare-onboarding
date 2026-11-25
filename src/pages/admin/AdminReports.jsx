import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Button } from '@/components/ui/button'
import HowDoesThisWork from '@/components/help/HowDoesThisWork'
import ReportEmployeePicker from '@/components/admin/ReportEmployeePicker'
import { MAX_REPORT_EMPLOYEES, loadReportData } from '@/lib/reportData'
import { REPORT_TYPES, buildReport } from '@/lib/reportFormat'
import { downloadTextFile } from '@/lib/downloadFile'

async function recordExport(companyId, reportId, count) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('audit_logs').insert({
        admin_id: session.user.id,
        admin_email: session.user.email,
        action: 'exported_report',
        company_id: companyId,
        metadata: { report: reportId, employees: count },
    })
    if (error) console.error('audit log failed', error)
}

export default function AdminReports() {
    const { companyId } = useCompany()
    const [reportId, setReportId] = useState(REPORT_TYPES[0].id)
    const [selected, setSelected] = useState(new Set())
    const [roleOptions, setRoleOptions] = useState([])
    const [progress, setProgress] = useState(null)

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

    const runReport = async () => {
        if (selected.size > MAX_REPORT_EMPLOYEES) {
            toast.error(`A report can include at most ${MAX_REPORT_EMPLOYEES.toLocaleString()} employees.`)
            return
        }

        const ids = [...selected]
        setProgress({ done: 0, total: ids.length })

        try {
            const data = await loadReportData(companyId, reportId, ids, (done, total) => setProgress({ done, total }))
            const { csv, filename, rows } = buildReport(reportId, { ...data, roleOptions })

            downloadTextFile(filename, csv)
            toast.success(`${report.label} report downloaded (${rows.length.toLocaleString()} row${rows.length === 1 ? '' : 's'})`)
            recordExport(companyId, reportId, ids.length)
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
                    <p className="text-muted-foreground">Choose a report and the employees to include, then download it as a CSV file that opens in Excel.</p>
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
                <details className="mt-4 text-xs text-muted-foreground">
                    <summary className="cursor-pointer font-medium text-foreground">Columns in this report</summary>
                    <p className="mt-2">{report.columns.map(([, label]) => label).join(', ')}</p>
                </details>
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
                <Button
                    onClick={runReport}
                    disabled={selected.size === 0 || running}
                    className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white disabled:opacity-50 w-full sm:w-auto"
                >
                    {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Download CSV
                </Button>
            </div>
        </div>
    )
}
