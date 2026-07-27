import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const TAX_FORM_OPTIONS = [
    { key: 'i9', label: 'I-9' },
    { key: 'w4', label: 'W-4' },
    { key: 'w9', label: 'W-9' },
    { key: 'nc4ez', label: 'NC-4EZ' },
]

async function callStudioFunction(name, body) {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke(name, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
}

const Field = ({ label, id, children, hint }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
)

function RoleDialog({ open, onClose, onSaved, companyId, editingRole }) {
    const [form, setForm] = useState({ role_key: '', display_label: '', required_tax_forms: [] })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (editingRole) {
            setForm({
                role_key: editingRole.role_key,
                display_label: editingRole.display_label,
                required_tax_forms: editingRole.required_tax_forms || [],
            })
        } else {
            setForm({ role_key: '', display_label: '', required_tax_forms: [] })
        }
        setError(null)
    }, [editingRole, open])

    const toggleTaxForm = (key) => {
        setForm((prev) => ({
            ...prev,
            required_tax_forms: prev.required_tax_forms.includes(key)
                ? prev.required_tax_forms.filter((f) => f !== key)
                : [...prev.required_tax_forms, key],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const result = editingRole
                ? await callStudioFunction('studio-update-role-label', {
                    id: editingRole.id,
                    companyId,
                    display_label: form.display_label,
                    required_tax_forms: form.required_tax_forms,
                })
                : await callStudioFunction('studio-create-role-label', {
                    companyId,
                    role_key: form.role_key,
                    display_label: form.display_label,
                    required_tax_forms: form.required_tax_forms,
                })
            toast.success(editingRole ? 'Role updated' : 'Role created')
            onSaved(result, !!editingRole)
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
                    <DialogTitle>{editingRole ? 'Edit role' : 'New role'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        label="Role key"
                        id="role_key"
                        hint={editingRole ? "Can't be changed after creation — caregivers already reference this exact value." : "A short, stable identifier (e.g. caregiver, nurse_prn). Can't be changed later."}
                    >
                        <Input
                            id="role_key"
                            value={form.role_key}
                            onChange={(e) => setForm((p) => ({ ...p, role_key: e.target.value }))}
                            disabled={!!editingRole}
                            required
                        />
                    </Field>
                    <Field label="Display label" id="display_label">
                        <Input
                            id="display_label"
                            value={form.display_label}
                            onChange={(e) => setForm((p) => ({ ...p, display_label: e.target.value }))}
                            required
                        />
                    </Field>
                    <div className="space-y-1.5">
                        <Label>Required tax forms</Label>
                        <div className="flex flex-wrap gap-3">
                            {TAX_FORM_OPTIONS.map((opt) => (
                                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.required_tax_forms.includes(opt.key)}
                                        onChange={() => toggleTaxForm(opt.key)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : editingRole ? 'Save changes' : 'Create role'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioRoleLabels() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-list-role-labels', { companyId })
            setRoles(data)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [companyId])

    const openCreate = () => {
        setEditingRole(null)
        setDialogOpen(true)
    }

    const openEdit = (role) => {
        setEditingRole(role)
        setDialogOpen(true)
    }

    const handleSaved = (result, wasEdit) => {
        setDialogOpen(false)
        if (wasEdit) {
            setRoles((prev) => prev.map((r) => (r.id === result.id ? { ...r, ...result } : r)))
        } else {
            setRoles((prev) => [...prev, result].sort((a, b) => a.display_label.localeCompare(b.display_label)))
        }
    }

    const requestDelete = async (role) => {
        try {
            // Always fetches fresh confirmation info and always opens the dialog below —
            // this call never deletes anything by itself, even when caregiver_count is 0.
            const result = await callStudioFunction('studio-delete-role-label', { id: role.id, companyId })
            setPendingDelete({ id: role.id, ...result })
        } catch (err) {
            toast.error(err.message)
        }
    }

    const confirmDelete = async () => {
        setConfirmingDelete(true)
        try {
            await callStudioFunction('studio-delete-role-label', { id: pendingDelete.id, companyId, confirmed: true })
            setRoles((prev) => prev.filter((r) => r.id !== pendingDelete.id))
            toast.success('Role deleted')
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
                    <h1 className="text-xl font-semibold">Roles</h1>
                    <p className="text-sm text-muted-foreground">Role labels and required tax forms for this company</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    New role
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Display label</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role key</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Required tax forms</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Caregivers</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td>
                            </tr>
                        ) : roles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">No roles yet.</td>
                            </tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">{role.display_label}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{role.role_key}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(role.required_tax_forms || []).length === 0 ? (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            ) : (
                                                role.required_tax_forms.map((f) => (
                                                    <span key={f} className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                                                        {f}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{role.caregiver_count}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(role)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => requestDelete(role)}>
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

            <RoleDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={handleSaved}
                companyId={companyId}
                editingRole={editingRole}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{pendingDelete?.display_label}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.caregiver_count > 0 ? (
                                <>
                                    {pendingDelete.caregiver_count} caregiver{pendingDelete.caregiver_count === 1 ? '' : 's'} at
                                    this company currently {pendingDelete.caregiver_count === 1 ? 'has' : 'have'} the role key
                                    "{pendingDelete?.role_key}". Deleting this role label won't change those caregivers' records,
                                    but the role will no longer have a display label or a required-tax-forms list anywhere in
                                    the app until a new role with the same key is created.
                                </>
                            ) : (
                                <>
                                    No caregivers at this company currently have the role key "{pendingDelete?.role_key}".
                                    This can't be undone.
                                </>
                            )}
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
                            {confirmingDelete ? 'Deleting...' : pendingDelete?.caregiver_count > 0 ? 'Delete anyway' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
