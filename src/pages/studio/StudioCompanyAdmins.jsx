import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'superadmin', label: 'Superadmin' },
]

const Field = ({ label, id, children, hint }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
)

function AdminDialog({ open, onClose, onSaved, companyId, editingAdmin }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin', position: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (editingAdmin) {
            setForm({
                name: editingAdmin.name,
                email: editingAdmin.email,
                password: '',
                role: editingAdmin.role,
                position: editingAdmin.position || '',
            })
        } else {
            setForm({ name: '', email: '', password: '', role: 'admin', position: '' })
        }
        setError(null)
    }, [editingAdmin, open])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const result = editingAdmin
                ? await callStudioFunction('studio-update-company-admin', {
                    id: editingAdmin.id,
                    companyId,
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    position: form.position,
                    ...(form.password ? { password: form.password } : {}),
                })
                : await callStudioFunction('studio-create-company-admin', {
                    companyId,
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                    position: form.position,
                })
            toast.success(editingAdmin ? 'Admin updated' : 'Admin created')
            onSaved(result, !!editingAdmin)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingAdmin ? 'Edit admin' : 'New admin'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Name" id="name">
                        <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                    </Field>
                    <Field label="Email" id="email">
                        <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                    </Field>
                    <Field
                        label={editingAdmin ? 'New password' : 'Password'}
                        id="password"
                        hint={editingAdmin ? 'Leave blank to keep their current password.' : 'At least 8 characters.'}
                    >
                        <Input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                            placeholder={editingAdmin ? '••••••••' : ''}
                            required={!editingAdmin}
                        />
                    </Field>
                    <Field label="Position" id="position" hint="Job title shown in the UI, e.g. HR Manager.">
                        <Input id="position" value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
                    </Field>
                    <Field label="Role" id="role" hint="Superadmins can also see the audit log.">
                        <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent position="popper">
                                {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : editingAdmin ? 'Save changes' : 'Create admin'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioCompanyAdmins() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const fetchAdmins = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-list-company-admins', { companyId })
            setAdmins(data)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAdmins()
    }, [companyId])

    const openCreate = () => {
        setEditingAdmin(null)
        setDialogOpen(true)
    }

    const openEdit = (admin) => {
        setEditingAdmin(admin)
        setDialogOpen(true)
    }

    const handleSaved = (result, wasEdit) => {
        setDialogOpen(false)
        if (wasEdit) {
            setAdmins((prev) => prev.map((a) => (a.id === result.id ? result : a)))
        } else {
            setAdmins((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)))
        }
    }

    const requestDelete = async (admin) => {
        try {
            const result = await callStudioFunction('studio-delete-company-admin', { id: admin.id, companyId })
            setPendingDelete({ id: admin.id, ...result })
        } catch (err) {
            toast.error(err.message)
        }
    }

    const confirmDelete = async () => {
        setConfirmingDelete(true)
        try {
            await callStudioFunction('studio-delete-company-admin', { id: pendingDelete.id, companyId, confirmed: true })
            setAdmins((prev) => prev.filter((a) => a.id !== pendingDelete.id))
            toast.success('Admin deleted')
            setPendingDelete(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setConfirmingDelete(false)
        }
    }

    return (
        <div>
            <button
                onClick={() => navigate(`/studio/companies/${companyId}`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to company
            </button>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold">Admins</h1>
                    <p className="text-sm text-muted-foreground">Users who can sign in to this company's /admin portal</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    New admin
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Position</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">No admins yet.</td></tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">{admin.name}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{admin.email}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{admin.position || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(admin)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => requestDelete(admin)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AdminDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
                companyId={companyId}
                editingAdmin={editingAdmin}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{pendingDelete?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.email} will immediately lose access to this company's /admin portal. This can't be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={confirmingDelete}
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                        >
                            {confirmingDelete ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
