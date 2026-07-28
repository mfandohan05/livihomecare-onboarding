import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction, FORM_TYPE_LABELS, FIELD_MAPPING_TYPES } from '@/lib/studio'

const Field = ({ label, id, children }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
    </div>
)

function NewFormDialog({ open, onClose, onCreated, companyId, roles, existingFormKeys }) {
    const [form, setForm] = useState({ form_key: '', title: '', form_type: 'signature_only', visible_to_roles: [], admin_signable: false, requires_signature: true })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (open) {
            setForm({ form_key: '', title: '', form_type: 'signature_only', visible_to_roles: [], admin_signable: false, requires_signature: true })
            setError(null)
        }
    }, [open])

    const toggleRole = (roleKey) => {
        setForm((prev) => ({
            ...prev,
            visible_to_roles: prev.visible_to_roles.includes(roleKey)
                ? prev.visible_to_roles.filter((r) => r !== roleKey)
                : [...prev.visible_to_roles, roleKey],
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (existingFormKeys.includes(form.form_key.trim())) {
            setError(`A form with key "${form.form_key.trim()}" already exists for this company`)
            return
        }
        if (form.visible_to_roles.length === 0) {
            setError('Select at least one role')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const created = await callStudioFunction('studio-create-company-form', { companyId, ...form })
            toast.success('Form created')
            onCreated(created)
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
                    <DialogTitle>New form</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Form key" id="form_key">
                        <Input
                            id="form_key"
                            value={form.form_key}
                            onChange={(e) => setForm((p) => ({ ...p, form_key: e.target.value }))}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Can't be changed later — used as the template file name.</p>
                    </Field>
                    <Field label="Title" id="title">
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            required
                        />
                    </Field>
                    <Field label="Form type" id="form_type">
                        <Select value={form.form_type} onValueChange={(v) => setForm((p) => ({ ...p, form_type: v }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                {Object.entries(FORM_TYPE_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!FIELD_MAPPING_TYPES.includes(form.form_type) && (
                            <p className="text-xs text-amber-700">
                                This type's content isn't editable in Studio yet — only the fields below (create/edit the
                                rest via SQL for now).
                            </p>
                        )}
                    </Field>

                    <div className="space-y-1.5">
                        <Label>Visible to roles</Label>
                        <div className="flex flex-wrap gap-3">
                            {roles.map((role) => (
                                <label key={role.role_key} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.visible_to_roles.includes(role.role_key)}
                                        onChange={() => toggleRole(role.role_key)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    {role.display_label}
                                </label>
                            ))}
                        </div>
                        {roles.length === 0 && (
                            <p className="text-xs text-muted-foreground">No roles defined for this company yet — add one first.</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.requires_signature}
                                onChange={(e) => setForm((p) => ({ ...p, requires_signature: e.target.checked }))}
                                className="w-4 h-4 rounded border-border"
                            />
                            Requires signature
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.admin_signable}
                                onChange={(e) => setForm((p) => ({ ...p, admin_signable: e.target.checked }))}
                                className="w-4 h-4 rounded border-border"
                            />
                            Admin-signable (company representative can countersign)
                        </label>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Creating...' : 'Create form'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioCompanyForms() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [forms, setForms] = useState([])
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [reordering, setReordering] = useState(null)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [formsResult, rolesResult] = await Promise.all([
                callStudioFunction('studio-list-company-forms', { companyId }),
                callStudioFunction('studio-list-role-labels', { companyId }),
            ])
            setForms(formsResult)
            setRoles(rolesResult)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId])

    const roleLabel = (roleKey) => roles.find((r) => r.role_key === roleKey)?.display_label || roleKey

    const handleCreated = (created) => {
        setDialogOpen(false)
        setForms((prev) => [...prev, created].sort((a, b) => a.form_order - b.form_order))
        navigate(`/studio/companies/${companyId}/forms/${created.id}`)
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-company-form', { id: pendingDelete.id, companyId })
            setForms((prev) => prev.filter((f) => f.id !== pendingDelete.id))
            toast.success('Form deleted')
            setPendingDelete(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const move = async (form, direction) => {
        setReordering(form.id)
        try {
            const updated = await callStudioFunction('studio-reorder-company-form', {
                companyId,
                formId: form.id,
                direction,
            })
            setForms(updated)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setReordering(null)
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
                    <h1 className="text-xl font-semibold">Forms</h1>
                    <p className="text-sm text-muted-foreground">Company forms, field mappings, and signable templates</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New form
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-3"><span className="sr-only">Reorder</span></th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Visible to</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin-signable</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td>
                            </tr>
                        ) : forms.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">No forms yet.</td>
                            </tr>
                        ) : (
                            forms.map((form, index) => (
                                <tr key={form.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                type="button"
                                                disabled={index === 0 || reordering === form.id}
                                                onClick={() => move(form, 'up')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === forms.length - 1 || reordering === form.id}
                                                onClick={() => move(form, 'down')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-sm">{form.title}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{form.form_key}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                            {FORM_TYPE_LABELS[form.form_type] || form.form_type}
                                        </span>
                                        {!FIELD_MAPPING_TYPES.includes(form.form_type) && (
                                            <p className="text-xs text-amber-700 mt-1">Config not editable in Studio</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(form.visible_to_roles || []).map((r) => (
                                                <span key={r} className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {roleLabel(r)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{form.admin_signable ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/studio/companies/${companyId}/forms/${form.id}`)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setPendingDelete(form)}>
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

            <NewFormDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={handleCreated}
                companyId={companyId}
                roles={roles}
                existingFormKeys={forms.map((f) => f.form_key)}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This deletes the form's configuration (content, field mapping, visibility) immediately. It does
                            NOT delete any PDF template already uploaded in Storage, or any document a caregiver has already
                            generated from this form — those stay untouched. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
