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
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'

const Field = ({ label, id, children, hint }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
)

function NewSectionDialog({ open, onClose, onCreated }) {
    const [form, setForm] = useState({ section_key: '', title: '', passing_score: 0.8 })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (open) {
            setForm({ section_key: '', title: '', passing_score: 0.8 })
            setError(null)
        }
    }, [open])

    const handleSubmit = async (e) => {
        e.preventDefault()
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
                    <DialogTitle>New section</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Section key" id="section_key" hint="Can't be changed later.">
                        <Input id="section_key" value={form.section_key} onChange={(e) => setForm((p) => ({ ...p, section_key: e.target.value }))} required />
                    </Field>
                    <Field label="Title" id="title">
                        <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
                    </Field>
                    <Field label="Passing score" id="passing_score" hint="Fraction of quiz questions that must be correct to pass (e.g. 0.8 = 80%).">
                        <Input
                            id="passing_score"
                            type="number"
                            min="0.01"
                            max="1"
                            step="0.01"
                            value={form.passing_score}
                            onChange={(e) => setForm((p) => ({ ...p, passing_score: e.target.value }))}
                            required
                        />
                    </Field>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create section'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioOrientationSections() {
    const { id: companyId } = useParams()
    const navigate = useNavigate()
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [reordering, setReordering] = useState(null)

    const fetchSections = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-list-orientation-sections', { companyId })
            setSections(data)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSections()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId])

    const handleCreate = async (form) => {
        const created = await callStudioFunction('studio-create-orientation-section', {
            companyId,
            section_key: form.section_key,
            title: form.title,
            passing_score: Number(form.passing_score),
        })
        toast.success('Section created')
        setDialogOpen(false)
        setSections((prev) => [...prev, created].sort((a, b) => a.section_order - b.section_order))
        navigate(`/studio/companies/${companyId}/orientation/${created.id}`)
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-orientation-section', { id: pendingDelete.id, companyId })
            setSections((prev) => prev.filter((s) => s.id !== pendingDelete.id))
            toast.success('Section deleted')
            setPendingDelete(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const move = async (section, direction) => {
        setReordering(section.id)
        try {
            const updated = await callStudioFunction('studio-reorder-orientation-section', {
                companyId, sectionId: section.id, direction,
            })
            setSections((prev) => updated.map((u) => {
                const existing = prev.find((s) => s.id === u.id)
                return { ...u, slide_count: existing?.slide_count || 0, question_count: existing?.question_count || 0 }
            }))
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
                    <h1 className="text-xl font-semibold">Orientation</h1>
                    <p className="text-sm text-muted-foreground">Sections, slides, and quiz questions for New Hire Orientation</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    New section
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-3"><span className="sr-only">Reorder</span></th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Passing score</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Slides</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Quiz questions</th>
                            <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
                        ) : sections.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">No sections yet.</td></tr>
                        ) : (
                            sections.map((section, index) => (
                                <tr key={section.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <button
                                                type="button"
                                                disabled={index === 0 || reordering === section.id}
                                                onClick={() => move(section, 'up')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === sections.length - 1 || reordering === section.id}
                                                onClick={() => move(section, 'down')}
                                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-sm">{section.title}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{section.section_key}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{Math.round(section.passing_score * 100)}%</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{section.slide_count}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{section.question_count}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/studio/companies/${companyId}/orientation/${section.id}`)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setPendingDelete(section)}>
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

            <NewSectionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreated={handleCreate} />

            <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{pendingDelete?.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will also permanently delete {pendingDelete?.slide_count} slide{pendingDelete?.slide_count === 1 ? '' : 's'} and{' '}
                            {pendingDelete?.question_count} quiz question{pendingDelete?.question_count === 1 ? '' : 's'} that belong to this
                            section. This can't be undone.
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
