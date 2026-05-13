import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const Field = ({ label, id, children, required }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {children}
    </div>
)

function NewCaregiverDialog({ open, onClose, onCreated }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'caregiver',
        position_title: '',
        employment_type: '',
        start_date: '',
        pay_rate: '',
        companion_pay_rate: '',
    })

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

    const canSave = form.name && form.email && form.role &&
        form.position_title && form.employment_type && form.pay_rate

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('caregivers')
            .insert({
                name: form.name,
                email: form.email.toLowerCase(),
                phone: form.phone,
                role: form.role,
                position_title: form.position_title,
                employment_type: form.employment_type,
                start_date: form.start_date || null,
                pay_rate: parseFloat(form.pay_rate),
                companion_pay_rate: form.companion_pay_rate ? parseFloat(form.companion_pay_rate) : null,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            setError('Failed to create caregiver. Please try again.')
            setLoading(false)
            return
        }

        setForm({
            name: '', email: '', phone: '', role: 'caregiver',
            position_title: '', employment_type: '', start_date: '',
            pay_rate: '', companion_pay_rate: '',
        })
        setLoading(false)
        onCreated(data)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Caregiver</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Personal Information</h3>
                        <div className="space-y-4">
                            <Field label="Full name" id="name" required>
                                <Input id="name" value={form.name} onChange={set('name')} placeholder="Maria Santos" />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Email" id="email" required>
                                    <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" />
                                </Field>
                                <Field label="Phone" id="phone">
                                    <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="(704) 555-0123" />
                                </Field>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Position Details</h3>
                        <div className="space-y-4">
                            <Field label="Role" id="role" required>
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={set('role')}
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                                >
                                    <option value="caregiver">Caregiver</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="other">Other</option>
                                </select>
                            </Field>
                            <Field label="Position title" id="position_title" required>
                                <Input id="position_title" value={form.position_title} onChange={set('position_title')} placeholder="PCA-Caregiver" />
                            </Field>
                            <Field label="Employment type" id="employment_type" required>
                                <select
                                    id="employment_type"
                                    value={form.employment_type}
                                    onChange={set('employment_type')}
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white"
                                >
                                    <option value="">Select type</option>
                                    <option value="Hourly, Part-Time">Hourly, Part-Time</option>
                                    <option value="Hourly, Full-Time">Hourly, Full-Time</option>
                                    <option value="Independent Contractor">Independent Contractor</option>
                                </select>
                            </Field>
                            <Field label="Start date" id="start_date">
                                <Input id="start_date" type="date" value={form.start_date} onChange={set('start_date')} />
                            </Field>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-4 pb-2 border-b">Compensation</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Pay rate ($/hr)" id="pay_rate" required>
                                <Input id="pay_rate" type="number" value={form.pay_rate} onChange={set('pay_rate')} placeholder="16.00" />
                            </Field>
                            <Field label="Companion pay rate ($/hr)" id="companion_pay_rate">
                                <Input id="companion_pay_rate" type="number" value={form.companion_pay_rate} onChange={set('companion_pay_rate')} placeholder="14.00" />
                            </Field>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSave || loading}
                            className="bg-[#577C09] hover:bg-[#3D5906] text-white disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Caregiver'}
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminCaregivers() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [showNewDialog, setShowNewDialog] = useState(searchParams.get('new') === 'true')
    const [caregivers, setCaregivers] = useState([])
    const [filtered, setFiltered] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [roleFilter, setRoleFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCaregivers()
    }, [])

    const fetchCaregivers = async () => {
        const { data } = await supabase
            .from('caregivers')
            .select(`
            *,
            caregiver_progress (
                active_step,
                completed_steps
            ),
            caregiver_time_logs (
                active_seconds,
                completed
            )
        `)
            .order('created_at', { ascending: false })

        if (data) {
            setCaregivers(data)
            setFiltered(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        let result = caregivers
        if (search) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase())
            )
        }
        if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter)
        if (roleFilter !== 'all') result = result.filter(c => c.role === roleFilter)
        setFiltered(result)
    }, [search, statusFilter, roleFilter, caregivers])

    const statusColor = (status) => {
        if (status === 'completed') return 'text-[#577C09] bg-[#E8F0D0]'
        if (status === 'in_progress') return 'text-amber-700 bg-amber-50'
        return 'text-muted-foreground bg-muted'
    }

    const statusLabel = (status) => {
        if (status === 'completed') return 'Completed'
        if (status === 'in_progress') return 'In Progress'
        return 'Pending'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    return (
        <AdminLayout>
            <NewCaregiverDialog
                open={showNewDialog}
                onClose={() => setShowNewDialog(false)}
                onCreated={(newCaregiver) => {
                    setShowNewDialog(false)
                    navigate(`/admin/caregivers/${newCaregiver.id}`)
                }}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Caregivers</h1>
                    <p className="text-muted-foreground">{caregivers.length} total caregivers</p>
                </div>
                <Button
                    onClick={() => setShowNewDialog(true)}
                    className="bg-[#577C09] hover:bg-[#3D5906] text-white"
                >
                    + New Caregiver
                </Button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="all">All roles</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="nurse">Nurse</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment Type</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Time</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                    No caregivers found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((caregiver) => {
                                const progress = caregiver.caregiver_progress?.[0]
                                const timeLog = caregiver.caregiver_time_logs?.[0]
                                const completedCount = progress?.completed_steps?.length || 0
                                const activeSeconds = timeLog?.active_seconds || 0
                                const activeTime = activeSeconds > 0
                                    ? `${Math.floor(activeSeconds / 3600)}h ${Math.floor((activeSeconds % 3600) / 60)}m`
                                    : '—'

                                return (
                                    <tr
                                        key={caregiver.id}
                                        onClick={() => navigate(`/admin/caregivers/${caregiver.id}`)}
                                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#577C09] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                                    {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{caregiver.name}</p>
                                                    <p className="text-xs text-muted-foreground">{caregiver.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm capitalize">{caregiver.role}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{caregiver.employment_type || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{caregiver.phone || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {caregiver.start_date ? new Date(caregiver.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {progress ? (
                                                <div>
                                                    <p className="text-sm font-medium">{completedCount} steps done</p>
                                                    <p className="text-xs text-muted-foreground">Step {progress.active_step} active</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Not started</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{activeTime}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(caregiver.status)}`}>
                                                {statusLabel(caregiver.status)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    )
}