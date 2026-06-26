import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const ACTION_LABELS = {
    viewed_ssn: 'Viewed SSN',
    viewed_banking: 'Viewed Banking',
    viewed_document: 'Viewed Document',
    deleted_employee: 'Deleted Employee',
    completed_i9_section2: 'Completed I-9 Section 2',
    signed_drug_test_policy_signed: 'Signed Drug Test Policy',
    signed_non_compete_signed: 'Signed Non-Compete',
    signed_orientation_checklist_signed: 'Signed Orientation Checklist',
    opened_caregiver_view: 'Opened Caregiver View',
    completed_i9_section1: 'Completed I-9 Section 1',
    regenerated_link: "Regenerated Onboarding Link",
    created_employee: "Created Employee",
    removed_step: "Removed Steps",
    reset_all_progress: "Reset All Progress",
    uploaded_doc_on_behalf: "Uploaded Document For Employee",
    updated_employee_info: "Updated Employee Info",
    cancelled_onboarding: "Cancelled Onboarding",
}

const actionColor = (action) => {
    if (action.includes('deleted') || (action.includes('remove')) || (action.includes('reset')) || action.includes('cancelled')) return 'bg-red-50 text-red-700 border-red-200'
    if (action.includes('viewed') || action.includes('opened') || (action.includes('created')) || (action.includes('up'))) return 'bg-amber-50 text-amber-700 border-amber-200'
    if (action.includes('signed') || action.includes('completed') || action.includes('Completed') || action.includes('Started') || action.includes('regenerate')) return 'bg-[#E8F0D0] text-[#577C09] border-[#577C09]/20'
    return 'bg-muted text-muted-foreground border-border'
}

const isTimestamp = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', {
                timeZone: 'America/New_York',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }
    }
    else {
        return String(value);
    }
}

export default function AdminLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const PER_PAGE = 20

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [actionFilter, setActionFilter] = useState('all')
    const [adminFilter, setAdminFilter] = useState('all')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [admins, setAdmins] = useState([])

    const [adminRole, setAdminRole] = useState(null)
    const [checkingRole, setCheckingRole] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { navigate('/admin/login'); return }

            const { data } = await supabase
                .from('admin_users')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (data?.role !== 'superadmin') {
                navigate('/admin/dashboard')
                return;
            }
            setAdminRole(data.role)
            setCheckingRole(false)
        }
        checkRole()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        fetchLogs()
    }, [page, debouncedSearch, actionFilter, adminFilter, dateFrom, dateTo])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, actionFilter, adminFilter, dateFrom, dateTo])

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        const { data } = await supabase
            .from('admin_users')
            .select('id, name, email')
            .order('name')
        setAdmins(data || [])
    }

    const fetchLogs = async () => {
        setLoading(true)
        const from = (page - 1) * PER_PAGE
        const to = from + PER_PAGE - 1

        let query = supabase
            .from('audit_logs')
            .select('*, admin_users(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (debouncedSearch) {
            query = query.or(`caregiver_name.ilike.%${debouncedSearch}%,admin_email.ilike.%${debouncedSearch}%`)
        }
        if (actionFilter !== 'all') query = query.eq('action', actionFilter)
        if (adminFilter !== 'all') {
            if (adminFilter === 'system') {
                query = query.is('admin_email', null)
            }
            else {
                query = query.eq('admin_email', adminFilter)
            }
        }
        if (dateFrom) {
            const [year, month, day] = dateFrom.split('-')
            const start = new Date(year, month - 1, day, 0, 0, 0, 0)
            query = query.gte('created_at', start.toISOString())
        }
        if (dateTo) {
            const [year, month, day] = dateTo.split('-')
            const end = new Date(year, month - 1, day, 23, 59, 59, 999)
            query = query.lte('created_at', end.toISOString())
        }

        const { data, count } = await query
        setLogs(data || [])
        setTotal(count || 0)
        setLoading(false)
    }

    if (checkingRole) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }


    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-muted-foreground">{total} total entries</p>
                </div>
            </div>

            <div className="flex gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by caregiver or admin..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All actions</option>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select
                    value={adminFilter}
                    onChange={(e) => setAdminFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All admins</option>
                    {admins.map(admin => (
                        <option key={admin.id} value={admin.email}>{admin.name}</option>
                    ))}
                    <option value="system">System / Caregiver</option>
                </select>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                />
                {(actionFilter !== 'all' || adminFilter !== 'all' || dateFrom || dateTo || search) && (
                    <button
                        onClick={() => {
                            setSearch('')
                            setActionFilter('all')
                            setAdminFilter('all')
                            setDateFrom('')
                            setDateTo('')
                        }}
                        className="text-sm text-red-500 hover:underline px-2"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Timestamp</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin Email</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Caregiver</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                    Loading...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                    No logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${actionColor(log.action)}`}>
                                            {ACTION_LABELS[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {log.admin_users?.name ? (
                                            <div>
                                                <p className="font-medium">{log.admin_users.name}</p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">System / Caregiver</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {log.admin_email ? (
                                            <div>
                                                <p className="font-medium">{log.admin_email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">System / Caregiver</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {log.caregiver_name ? (
                                            <button
                                                onClick={() => log.caregiver_id && window.open(`/admin/employees/${log.caregiver_id}`, '_blank')}
                                                className="text-[#577C09] hover:underline font-medium"
                                            >
                                                {log.caregiver_name}
                                            </button>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                            <div className="space-y-0.5">
                                                {Object.entries(log.metadata).map(([key, value]) => (
                                                    <p key={key} className="text-xs">
                                                        {!isNaN(key) ? (
                                                            value
                                                        ) : (
                                                            <><span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                                                {String(isTimestamp(value))}</>
                                                        )}

                                                    </p>
                                                ))}
                                            </div>
                                        ) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => prev - 1)}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page * PER_PAGE >= total}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}