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
import { ArrowLeft, Plus, X, Pencil, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'

const SectionCard = ({ title, description, children, action }) => (
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

function LineListEditor({ lines, onChange }) {
    return (
        <div className="space-y-2">
            {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input value={line} onChange={(e) => onChange(lines.map((l, j) => (j === i ? e.target.value : l)))} />
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => {
                        const copy = [...lines]; [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]; onChange(copy)
                    }}>
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={i === lines.length - 1} onClick={() => {
                        const copy = [...lines]; [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]]; onChange(copy)
                    }}>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(lines.filter((_, j) => j !== i))}>
                        <X className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, ''])}>
                <Plus className="w-3.5 h-3.5" /> Add line
            </Button>
            <p className="text-xs text-muted-foreground">
                Start a line with "•" for a bullet, wrap it in quotes for a highlighted quote, or end it with ":" for a bold heading.
            </p>
        </div>
    )
}

function SlideDialog({ open, onClose, onSaved, sectionId, companyId, editingSlide }) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState([''])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (editingSlide) {
            setTitle(editingSlide.title || '')
            setContent(editingSlide.content?.length ? editingSlide.content : [''])
        } else {
            setTitle('')
            setContent([''])
        }
        setError(null)
    }, [editingSlide, open])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const cleanedContent = content.filter((l) => l.trim() !== '')
            const result = editingSlide
                ? await callStudioFunction('studio-update-orientation-slide', { id: editingSlide.id, sectionId, companyId, title, content: cleanedContent })
                : await callStudioFunction('studio-create-orientation-slide', { sectionId, companyId, title, content: cleanedContent })
            toast.success(editingSlide ? 'Slide updated' : 'Slide added')
            onSaved(result, !!editingSlide)
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
                    <DialogTitle>{editingSlide ? 'Edit slide' : 'Add slide'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Slide title (optional)</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Content lines</Label>
                        <LineListEditor lines={content} onChange={setContent} />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingSlide ? 'Save changes' : 'Add slide'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function QuizQuestionDialog({ open, onClose, onSaved, sectionId, companyId, editingQuestion }) {
    const [questionText, setQuestionText] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [correctIndex, setCorrectIndex] = useState(0)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (editingQuestion) {
            setQuestionText(editingQuestion.question_text)
            setOptions(editingQuestion.options?.length ? editingQuestion.options : ['', ''])
            setCorrectIndex(editingQuestion.correct_answer_index)
        } else {
            setQuestionText('')
            setOptions(['', ''])
            setCorrectIndex(0)
        }
        setError(null)
    }, [editingQuestion, open])

    const updateOption = (i, value) => setOptions((prev) => prev.map((o, j) => (j === i ? value : o)))
    const removeOption = (i) => {
        setOptions((prev) => prev.filter((_, j) => j !== i))
        if (correctIndex === i) setCorrectIndex(0)
        else if (correctIndex > i) setCorrectIndex((prev) => prev - 1)
    }
    const addOption = () => setOptions((prev) => [...prev, ''])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (options.some((o) => !o.trim())) {
            setError('All options must have text')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const result = editingQuestion
                ? await callStudioFunction('studio-update-orientation-quiz-question', {
                    id: editingQuestion.id, sectionId, companyId, question_text: questionText, options, correct_answer_index: correctIndex,
                })
                : await callStudioFunction('studio-create-orientation-quiz-question', {
                    sectionId, companyId, question_text: questionText, options, correct_answer_index: correctIndex,
                })
            toast.success(editingQuestion ? 'Question updated' : 'Question added')
            onSaved(result, !!editingQuestion)
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
                    <DialogTitle>{editingQuestion ? 'Edit question' : 'Add question'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Question text</Label>
                        <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Options — select the correct answer</Label>
                        <div className="space-y-2">
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={correctIndex === i}
                                            onChange={() => setCorrectIndex(i)}
                                        />
                                        <span className="text-xs text-muted-foreground">Correct</span>
                                    </label>
                                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                                    <Button type="button" variant="ghost" size="icon-sm" disabled={options.length <= 2} onClick={() => removeOption(i)}>
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                            <Plus className="w-3.5 h-3.5" /> Add option
                        </Button>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingQuestion ? 'Save changes' : 'Add question'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function StudioOrientationSectionEditor() {
    const { id: companyId, sectionId } = useParams()
    const navigate = useNavigate()

    const [section, setSection] = useState(null)
    const [slides, setSlides] = useState([])
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)

    const [title, setTitle] = useState('')
    const [passingScore, setPassingScore] = useState(0.8)
    const [savingBasics, setSavingBasics] = useState(false)

    const [slideDialogOpen, setSlideDialogOpen] = useState(false)
    const [editingSlide, setEditingSlide] = useState(null)
    const [pendingDeleteSlide, setPendingDeleteSlide] = useState(null)

    const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState(null)
    const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState(null)

    const [reorderingSlide, setReorderingSlide] = useState(null)
    const [reorderingQuestion, setReorderingQuestion] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const fetchAll = async () => {
        setLoading(true)
        try {
            const data = await callStudioFunction('studio-get-orientation-section-detail', { id: sectionId, companyId })
            setSection(data.section)
            setTitle(data.section.title)
            setPassingScore(data.section.passing_score)
            setSlides(data.slides)
            setQuestions(data.questions)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, companyId])

    const saveBasics = async () => {
        setSavingBasics(true)
        try {
            const updated = await callStudioFunction('studio-update-orientation-section', {
                id: sectionId, companyId, title, passing_score: Number(passingScore),
            })
            setSection((prev) => ({ ...prev, ...updated }))
            toast.success('Saved')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSavingBasics(false)
        }
    }

    const handleSlideSaved = (result, wasEdit) => {
        setSlideDialogOpen(false)
        if (wasEdit) setSlides((prev) => prev.map((s) => (s.id === result.id ? result : s)))
        else setSlides((prev) => [...prev, result].sort((a, b) => a.slide_order - b.slide_order))
    }

    const confirmDeleteSlide = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-orientation-slide', { id: pendingDeleteSlide.id, sectionId, companyId })
            setSlides((prev) => prev.filter((s) => s.id !== pendingDeleteSlide.id))
            toast.success('Slide deleted')
            setPendingDeleteSlide(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const moveSlide = async (slide, direction) => {
        setReorderingSlide(slide.id)
        try {
            const updated = await callStudioFunction('studio-reorder-orientation-slide', { sectionId, companyId, slideId: slide.id, direction })
            setSlides(updated)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setReorderingSlide(null)
        }
    }

    const handleQuestionSaved = (result, wasEdit) => {
        setQuestionDialogOpen(false)
        if (wasEdit) setQuestions((prev) => prev.map((q) => (q.id === result.id ? result : q)))
        else setQuestions((prev) => [...prev, result].sort((a, b) => a.question_order - b.question_order))
    }

    const confirmDeleteQuestion = async () => {
        setDeleting(true)
        try {
            await callStudioFunction('studio-delete-orientation-quiz-question', { id: pendingDeleteQuestion.id, sectionId, companyId })
            setQuestions((prev) => prev.filter((q) => q.id !== pendingDeleteQuestion.id))
            toast.success('Question deleted')
            setPendingDeleteQuestion(null)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    const moveQuestion = async (question, direction) => {
        setReorderingQuestion(question.id)
        try {
            const updated = await callStudioFunction('studio-reorder-orientation-quiz-question', { sectionId, companyId, questionId: question.id, direction })
            setQuestions(updated)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setReorderingQuestion(null)
        }
    }

    if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
    if (!section) return <p className="text-muted-foreground text-sm">Section not found.</p>

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate(`/studio/companies/${companyId}/orientation`)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to sections
                    </button>
                    <h1 className="text-xl font-semibold">{section.title}</h1>
                    <p className="text-sm text-muted-foreground font-mono">{section.section_key}</p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/studio/companies/${companyId}/orientation/${sectionId}/preview`)}>
                    <Eye className="w-4 h-4" />
                    Preview as caregiver
                </Button>
            </div>

            <SectionCard title="Basics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Passing score</Label>
                        <Input type="number" min="0.01" max="1" step="0.01" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
                    </div>
                </div>
                <Button onClick={saveBasics} disabled={savingBasics}>{savingBasics ? 'Saving...' : 'Save basics'}</Button>
            </SectionCard>

            <SectionCard
                title="Slides"
                action={<Button size="sm" onClick={() => { setEditingSlide(null); setSlideDialogOpen(true) }}><Plus className="w-3.5 h-3.5" /> Add slide</Button>}
            >
                {slides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slides yet.</p>
                ) : (
                    <div className="space-y-2">
                        {slides.map((slide, index) => (
                            <div key={slide.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button type="button" disabled={index === 0 || reorderingSlide === slide.id} onClick={() => moveSlide(slide, 'up')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button type="button" disabled={index === slides.length - 1 || reorderingSlide === slide.id} onClick={() => moveSlide(slide, 'down')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{slide.title || <span className="text-muted-foreground italic">Untitled slide</span>}</p>
                                    <p className="text-xs text-muted-foreground">{(slide.content || []).length} line(s)</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditingSlide(slide); setSlideDialogOpen(true) }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setPendingDeleteSlide(slide)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Quiz questions"
                action={<Button size="sm" onClick={() => { setEditingQuestion(null); setQuestionDialogOpen(true) }}><Plus className="w-3.5 h-3.5" /> Add question</Button>}
            >
                {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No quiz questions yet.</p>
                ) : (
                    <div className="space-y-2">
                        {questions.map((q, index) => (
                            <div key={q.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                                <div className="flex flex-col gap-0.5 shrink-0">
                                    <button type="button" disabled={index === 0 || reorderingQuestion === q.id} onClick={() => moveQuestion(q, 'up')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button type="button" disabled={index === questions.length - 1 || reorderingQuestion === q.id} onClick={() => moveQuestion(q, 'down')} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{q.question_text}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {q.options.length} option(s) — correct: <span className="font-medium">{q.options[q.correct_answer_index]}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditingQuestion(q); setQuestionDialogOpen(true) }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setPendingDeleteQuestion(q)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SlideDialog
                open={slideDialogOpen}
                onClose={() => setSlideDialogOpen(false)}
                onSaved={handleSlideSaved}
                sectionId={sectionId}
                companyId={companyId}
                editingSlide={editingSlide}
            />

            <QuizQuestionDialog
                open={questionDialogOpen}
                onClose={() => setQuestionDialogOpen(false)}
                onSaved={handleQuestionSaved}
                sectionId={sectionId}
                companyId={companyId}
                editingQuestion={editingQuestion}
            />

            <AlertDialog open={!!pendingDeleteSlide} onOpenChange={(o) => !o && setPendingDeleteSlide(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deleting} onClick={(e) => { e.preventDefault(); confirmDeleteSlide() }}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!pendingDeleteQuestion} onOpenChange={(o) => !o && setPendingDeleteQuestion(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={deleting} onClick={(e) => { e.preventDefault(); confirmDeleteQuestion() }}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
