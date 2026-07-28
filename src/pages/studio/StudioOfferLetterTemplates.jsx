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
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'

const Field = ({ label, id, children, hint }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
)

function NewTemplateDialog({ open, onClose, onCreated, roles, existingRoleKeys }) {
    const [form, setForm] = useState({ role_key: '', title: '', requires_address: false, uses_custom_pdf: false })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (open) {
            setForm({ role_key: '', title: '', requires_address: false, uses_custom_pdf: false })
            setError(null)
        }
    }, [open])

    const availableRoles = roles.filter((r) => !existingRoleKeys.includes(r.role_key))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.role_key) {
            setError('Choose a role')
            return
        }
        setSaving(true)
        setError(null)
        try {
            await onCreated(form)
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
                    <DialogTitle>New offer letter template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Role" id="role_key" hint="Literal caregiver role this template applies to — can't be changed later.">
                        <Select value={form.role_key} onValueChange={(v) => setForm((p) => ({ ...p, role_key: v }))}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a role" /></SelectTrigger>
                            <SelectContent position="popper">
                                {availableRoles.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">Every role already has a template</div>
                                ) : (
                                    availableRoles.map((r) => <SelectItem key={r.role_key} value={r.role_key}>{r.display_label}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Title" id="title">
                        <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
                    </Field>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.requires_address} onChange={(e) => setForm((p) => ({ ...p, requires_address: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                            Requires mailing address
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.uses_custom_pdf} onChange={(e) => setForm((p) => ({ ...p, uses_custom_pdf: e.target.checked }))} className="w-4 h-4 rounded border-border" />
                            Uses a custom, per-caregiver PDF instead
                        </label>
                        {form.uses_custom_pdf && (
                            <p className="text-xs text-muted-foreground">
                                In this mode the caregiver just reviews and e-signs a PDF uploaded for them individually
                                (via the per-caregiver admin page) — there's no company-wide template or field mapping to
                                manage here.
                            </p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create template'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioOfferLetterTemplates() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [templates, setTemplates] = useState([])
    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [templatesResult, rolesResult] = await Promise.all([
                callStudioFunction('studio-list-offer-letter-templates', { companyId }),
                callStudioFunction('studio-list-role-labels', { companyId }),
            ])
            setTemplates(templatesResult)
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

    const handleCreate = async (form) => {
        const created = await callStudioFunction('studio-create-offer-letter-template', { companyId, ...form })
        toast.success('Template created')
        setDialogOpen(false)
        setTemplates((prev) => [...prev, created].sort((a, b) => a.role_key.localeCompare(b.role_key)))
        navigate(`/studio/companies/${companyId}/offer-letters/${created.id}`)
        return created
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-offer-letter-template', { id: pendingDelete.id, companyId })
            setTemplates((prev) => prev.filter((t) => t.id !== pendingDelete.id))
            toast.success('Template deleted')
            setPendingDelete(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
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
                    <h1 className="text-xl font-semibold">Offer letter templates</h1>
                    <p className="text-sm text-muted-foreground">One per literal role — not bucketed like job descriptions</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New template
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Requires address</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Mode</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">No offer letter templates yet.</td></tr>
                        ) : (
                            templates.map((t) => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">{roleLabel(t.role_key)}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.title}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{t.requires_address ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                            {t.uses_custom_pdf ? 'Custom per-caregiver PDF' : 'Company template'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/studio/companies/${companyId}/offer-letters/${t.id}`)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setPendingDelete(t)}>
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

            <NewTemplateDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onCreated={handleCreate}
                roles={roles}
                existingRoleKeys={templates.map((t) => t.role_key)}
            />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This deletes the offer letter configuration for this role immediately. It does NOT delete any
                            PDF template already uploaded in Storage, or any offer letter a caregiver has already signed —
                            those stay untouched. This can't be undone.
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
