import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { ArrowLeft, Plus, X, ChevronUp, ChevronDown, Eye, ImagePlus, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import TrainingSlideView from '@/components/training/TrainingSlideView'
import {
    TRAINING_ROLES,
    fileToBase64,
    parseVideoUrl,
    trainingAdmin,
    trainingImageUrl,
} from '@/lib/training'

const newSlide = () => ({ key: crypto.randomUUID(), title: '', body: '', image_path: '', video_url: '' })
const newQuestion = () => ({ key: crypto.randomUUID(), question_text: '', options: ['', ''], correct_answer_index: 0 })

const Card = ({ title, description, action, children }) => (
    <section className="bg-white rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div>
                <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{title}</h2>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            {action}
        </div>
        {children}
    </section>
)

const moveItem = (list, index, delta) => {
    const copy = [...list]
    const target = index + delta
    if (target < 0 || target >= copy.length) return copy
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    return copy
}

function SlideEditor({ slide, index, total, companyId, onChange, onMove, onRemove }) {
    const [uploading, setUploading] = useState(false)
    const videoCheck = slide.video_url ? parseVideoUrl(slide.video_url) : null
    const imageUrl = trainingImageUrl(slide.image_path)

    const handleImage = async (e) => {
        const file = e.target.files[0]
        e.target.value = ''
        if (!file) return
        setUploading(true)
        try {
            const fileBase64 = await fileToBase64(file)
            const result = await trainingAdmin('upload-image', { companyId, fileBase64, contentType: file.type })
            onChange({ image_path: result.image_path })
        } catch (err) {
            toast.error(err.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Slide {index + 1}</p>
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(-1)}>
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === total - 1} onClick={() => onMove(1)}>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Title (optional)</Label>
                <Input value={slide.title} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label>Text (optional)</Label>
                <Textarea value={slide.body} onChange={(e) => onChange({ body: e.target.value })} rows={5} />
                <p className="text-xs text-muted-foreground">Leave a blank line between paragraphs.</p>
            </div>
            <div className="space-y-1.5">
                <Label>Image (optional)</Label>
                {imageUrl ? (
                    <div className="flex items-start gap-3">
                        <img src={imageUrl} alt="" className="max-h-32 rounded-lg border border-border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ image_path: '' })}>
                            <X className="w-3.5 h-3.5" /> Remove
                        </Button>
                    </div>
                ) : (
                    <label className="inline-flex">
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleImage} disabled={uploading} />
                        <span className="inline-flex items-center gap-1.5 text-sm border border-border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                            {uploading ? 'Uploading...' : 'Upload image'}
                        </span>
                    </label>
                )}
            </div>
            <div className="space-y-1.5">
                <Label>Video link (optional)</Label>
                <Input
                    value={slide.video_url}
                    onChange={(e) => onChange({ video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                />
                {videoCheck?.error ? (
                    <p className="text-xs text-red-500">{videoCheck.error}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">YouTube, Vimeo, or a direct .mp4 / .webm link.</p>
                )}
            </div>
        </div>
    )
}

function QuestionEditor({ question, index, total, onChange, onMove, onRemove }) {
    const setOption = (i, value) => onChange({ options: question.options.map((o, j) => (j === i ? value : o)) })
    const removeOption = (i) => {
        const correct = question.correct_answer_index
        onChange({
            options: question.options.filter((_, j) => j !== i),
            correct_answer_index: correct === i ? 0 : correct > i ? correct - 1 : correct,
        })
    }

    return (
        <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Question {index + 1}</p>
                <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(-1)}>
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === total - 1} onClick={() => onMove(1)}>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Question text</Label>
                <Input value={question.question_text} onChange={(e) => onChange({ question_text: e.target.value })} />
            </div>
            <div className="space-y-1.5">
                <Label>Options. Select the correct answer.</Label>
                <div className="space-y-2">
                    {question.options.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`correct-${question.key}`}
                                    checked={question.correct_answer_index === i}
                                    onChange={() => onChange({ correct_answer_index: i })}
                                />
                                <span className="text-xs text-muted-foreground">Correct</span>
                            </label>
                            <Input value={option} onChange={(e) => setOption(i, e.target.value)} />
                            <Button type="button" variant="ghost" size="icon-sm" disabled={question.options.length <= 2} onClick={() => removeOption(i)}>
                                <X className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onChange({ options: [...question.options, ''] })}>
                    <Plus className="w-3.5 h-3.5" /> Add option
                </Button>
            </div>
        </div>
    )
}

function PreviewBody({ slides }) {
    const [index, setIndex] = useState(0)
    const shown = slides.filter((s) => s.title || s.body || s.image_path || s.video_url)
    const slide = shown[index]

    if (!slide) return <p className="text-sm text-muted-foreground">Add a slide to preview it.</p>

    return (
        <div className="space-y-4">
            <Progress value={((index + 1) / shown.length) * 100} className="h-2" />
            <TrainingSlideView slide={slide} index={index} total={shown.length} />
            <div className="flex items-center justify-between">
                <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button disabled={index === shown.length - 1} onClick={() => setIndex(index + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}

function PreviewDialog({ open, onClose, slides, title }) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Preview: {title || 'Untitled training'}</DialogTitle>
                </DialogHeader>
                {open && <PreviewBody slides={slides} />}
            </DialogContent>
        </Dialog>
    )
}

export default function TrainingEditor({ companyId, trainingId, backPath }) {
    const navigate = useNavigate()
    const isNew = !trainingId
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [form, setForm] = useState({
        title: '',
        description: '',
        passing_score: 80,
        due_days: '',
        roles: [],
        is_published: false,
    })
    const [slides, setSlides] = useState(isNew ? [newSlide()] : [])
    const [questions, setQuestions] = useState([])

    useEffect(() => {
        if (isNew) return
        let cancelled = false
        const load = async () => {
            try {
                const data = await trainingAdmin('get', { companyId, id: trainingId })
                if (cancelled) return
                const t = data.training
                setForm({
                    title: t.title,
                    description: t.description || '',
                    passing_score: t.passing_score,
                    due_days: t.due_days ?? '',
                    roles: t.roles || [],
                    is_published: t.is_published,
                })
                setSlides(data.slides.map((s) => ({
                    key: s.id,
                    title: s.title || '',
                    body: s.body || '',
                    image_path: s.image_path || '',
                    video_url: s.video_url || '',
                })))
                setQuestions(data.questions.map((q) => ({
                    key: q.id,
                    question_text: q.question_text,
                    options: q.options,
                    correct_answer_index: q.correct_answer_index,
                })))
            } catch (err) {
                toast.error(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [companyId, trainingId, isNew])

    const setField = (patch) => {
        setForm((prev) => ({ ...prev, ...patch }))
        setDirty(true)
    }
    const updateSlides = (updater) => {
        setSlides(updater)
        setDirty(true)
    }
    const updateQuestions = (updater) => {
        setQuestions(updater)
        setDirty(true)
    }

    const toggleRole = (role) => {
        setField({ roles: form.roles.includes(role) ? form.roles.filter((r) => r !== role) : [...form.roles, role] })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await trainingAdmin('save', {
                companyId,
                training: {
                    id: trainingId,
                    ...form,
                    passing_score: Number(form.passing_score),
                    due_days: form.due_days === '' ? null : Number(form.due_days),
                    slides: slides.map(({ title, body, image_path, video_url }) => ({ title, body, image_path, video_url })),
                    questions: questions.map(({ question_text, options, correct_answer_index }) => ({ question_text, options, correct_answer_index })),
                },
            })
            toast.success('Training saved')
            setDirty(false)
            if (isNew) navigate(`${backPath}/${result.id}`, { replace: true })
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await trainingAdmin('delete', { companyId, id: trainingId })
            toast.success('Training deleted')
            navigate(backPath)
        } catch (err) {
            toast.error(err.message)
            setDeleting(false)
        }
    }

    if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <button
                        onClick={() => navigate(backPath)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to trainings
                    </button>
                    <h1 className="text-xl font-semibold">{isNew ? 'New training' : form.title || 'Training'}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                        <Eye className="w-4 h-4" /> Preview slides
                    </Button>
                    {!isNew && (
                        <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                            <Trash2 className="w-4 h-4 text-red-500" /> Delete
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving || (!isNew && !dirty)} className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white">
                        {saving ? 'Saving...' : 'Save training'}
                    </Button>
                </div>
            </div>

            <Card title="Basics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Title</Label>
                        <Input value={form.title} onChange={(e) => setField({ title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setField({ description: e.target.value })} rows={3} />
                        <p className="text-xs text-muted-foreground">Shown to employees on their My Training page.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Minimum passing score</Label>
                        <div className="relative">
                            <Input type="number" min="1" max="100" step="1" value={form.passing_score} onChange={(e) => setField({ passing_score: e.target.value })} className="pr-8" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Share of quiz questions that must be answered correctly.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Due within (days)</Label>
                        <Input type="number" min="1" step="1" value={form.due_days} onChange={(e) => setField({ due_days: e.target.value })} placeholder="No due date" />
                        <p className="text-xs text-muted-foreground">Counted from when the employee finishes onboarding or the training is assigned to them.</p>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Who sees this training</Label>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {TRAINING_ROLES.map((role) => (
                                <label key={role.value} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={form.roles.includes(role.value)} onChange={() => toggleRole(role.value)} />
                                    {role.label}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Leave all unchecked to assign it to every role.</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer sm:col-span-2">
                        <input type="checkbox" checked={form.is_published} onChange={(e) => setField({ is_published: e.target.checked })} />
                        Published. Employees only see and are assigned published trainings.
                    </label>
                </div>
            </Card>

            <Card
                title="Slides"
                description="Each slide can have a title, text, an image, an embedded video, or a mix."
                action={<Button size="sm" onClick={() => updateSlides((prev) => [...prev, newSlide()])} className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white">
                            <Plus className="w-3.5 h-3.5" /> 
                            Add slide
                        </Button>
                        }
            >
                {slides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slides yet.</p>
                ) : (
                    <div className="space-y-3">
                        {slides.map((slide, i) => (
                            <SlideEditor
                                key={slide.key}
                                slide={slide}
                                index={i}
                                total={slides.length}
                                companyId={companyId}
                                onChange={(patch) => updateSlides((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)))}
                                onMove={(delta) => updateSlides((prev) => moveItem(prev, i, delta))}
                                onRemove={() => updateSlides((prev) => prev.filter((_, j) => j !== i))}
                            />
                        ))}
                    </div>
                )}
            </Card>

            <Card
                title="Quiz questions"
                description="Employees must score at least the passing score to finish. Correct answers are never shown to them."
                action={<Button size="sm" onClick={() => updateQuestions((prev) => [...prev, newQuestion()])} className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white">
                    <Plus className="w-3.5 h-3.5" /> Add question</Button>}
            >
                {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions. The training is completed after the last slide.</p>
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, i) => (
                            <QuestionEditor
                                key={q.key}
                                question={q}
                                index={i}
                                total={questions.length}
                                onChange={(patch) => updateQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                                onMove={(delta) => updateQuestions((prev) => moveItem(prev, i, delta))}
                                onRemove={() => updateQuestions((prev) => prev.filter((_, j) => j !== i))}
                            />
                        ))}
                    </div>
                )}
            </Card>

            <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} slides={slides} title={form.title} />

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{form.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently deletes the training and every employee's progress on it. This can't be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deleting} onClick={(e) => { e.preventDefault(); handleDelete() }}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
