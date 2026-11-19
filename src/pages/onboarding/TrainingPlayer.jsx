import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import TrainingSlideView from '@/components/training/TrainingSlideView'
import MyTraining from '@/pages/onboarding/MyTraining'
import { trainingCaregiver } from '@/lib/training'

function FloatingWindow({ title, progress, onClose, footer, children }) {
    useEffect(() => {
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [onClose])

    return (
        <>
            <MyTraining />
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-[2px]"
                onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                    className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-black/10"
                >
                    <div className="border-b border-border px-4 py-4 sm:px-6">
                        <div className="flex items-start justify-between gap-3">
                            <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close training"
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {progress && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>{progress.label}</span>
                                    <span>{progress.value}%</span>
                                </div>
                                <Progress value={progress.value} className="h-2" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
                    {footer && <div className="border-t border-border px-4 py-3 sm:px-6">{footer}</div>}
                </div>
            </div>
        </>
    )
}

export default function TrainingPlayer() {
    const { trainingId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [slideIndex, setSlideIndex] = useState(0)
    const [showQuiz, setShowQuiz] = useState(false)
    const [answers, setAnswers] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)

    useEffect(() => {
        let cancelled = false
        trainingCaregiver('get', { trainingId })
            .then((res) => {
                if (cancelled) return
                setData(res)
                const last = Math.max(res.slides.length - 1, 0)
                setSlideIndex(Math.min(res.progress.current_slide || 0, last))
            })
            .catch((err) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [trainingId])

    const close = () => navigate('/my-training')

    if (error) {
        return (
            <FloatingWindow title="Training" onClose={close}>
                <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" onClick={close}>Back to My Training</Button>
                </div>
            </FloatingWindow>
        )
    }

    if (!data) {
        return (
            <FloatingWindow title="Training" onClose={close}>
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </FloatingWindow>
        )
    }

    const { training, slides, questions } = data
    const alreadyPassed = data.progress.status === 'passed'
    const slide = slides[slideIndex]
    const isLastSlide = slideIndex >= slides.length - 1
    const finished = Boolean(result?.passed)
    const progressValue = showQuiz || finished
        ? 100
        : slides.length > 0 ? Math.round(((slideIndex + 1) / slides.length) * 100) : 0
    const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined)

    const goToSlide = (next) => {
        setSlideIndex(next)
        if (!alreadyPassed) {
            trainingCaregiver('progress', { trainingId, currentSlide: next }).catch(() => {})
        }
    }

    const submit = async () => {
        setSubmitting(true)
        try {
            const res = await trainingCaregiver('submit', {
                trainingId,
                answers: questions.map((_, i) => answers[i]),
            })
            setResult(res)
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleNext = () => {
        if (!isLastSlide) return goToSlide(slideIndex + 1)
        if (alreadyPassed) return close()
        if (questions.length === 0) return submit()
        setShowQuiz(true)
    }

    const handleBack = () => {
        if (showQuiz) {
            setShowQuiz(false)
            setResult(null)
            setAnswers({})
            return
        }
        if (slideIndex > 0) goToSlide(slideIndex - 1)
    }

    const retry = () => {
        setAnswers({})
        setResult(null)
        setShowQuiz(false)
        goToSlide(0)
    }

    const primary = 'bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white'

    let body
    let footer = null

    if (result?.passed) {
        body = (
            <div className="py-6 text-center">
                <CheckCircle className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-3" />
                <h2 className="text-xl font-semibold mb-1">Training complete</h2>
                {result.total > 0 && (
                    <p className="text-sm text-muted-foreground mb-6">
                        You scored {result.score} of {result.total}. Great work!
                    </p>
                )}
                <Button onClick={close} className={`${primary} px-8`}>Continue</Button>
            </div>
        )
    } else if (result) {
        body = (
            <div className="py-6 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h2 className="text-xl font-semibold mb-1">Not quite</h2>
                <p className="text-sm text-muted-foreground mb-1">
                    You scored {result.score} of {result.total}. You need at least {result.passing_score}% to pass.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                    Review the training and try again. You can retake it as many times as you need.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Button variant="outline" onClick={retry}>Review slides</Button>
                    <Button onClick={() => { setAnswers({}); setResult(null) }} className={`${primary} px-8`}>
                        Try again
                    </Button>
                </div>
            </div>
        )
    } else if (showQuiz) {
        body = (
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-1">
                    <h2 className="text-lg font-semibold">Quiz</h2>
                    <span className="text-xs text-muted-foreground">
                        {questions.length} questions. {training.passing_score}% to pass.
                    </span>
                </div>
                <div className="space-y-8">
                    {questions.map((q, qi) => (
                        <div key={q.id}>
                            <p className="font-medium text-sm mb-3">{qi + 1}. {q.question_text}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oi) => (
                                    <button
                                        key={oi}
                                        type="button"
                                        onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${answers[qi] === oi
                                            ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)] text-[var(--hover-color)]'
                                            : 'border-border hover:border-[var(--primary-color)]'}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
        footer = (
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={submit} disabled={!allAnswered || submitting} className={`${primary} px-8 disabled:opacity-50`}>
                    {submitting ? 'Submitting...' : 'Submit quiz'}
                </Button>
            </div>
        )
    } else if (slides.length === 0) {
        body = <p className="py-8 text-center text-sm text-muted-foreground">This training has no content yet.</p>
    } else {
        body = <TrainingSlideView slide={slide} index={slideIndex} total={slides.length} />
        footer = (
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleBack} disabled={slideIndex === 0}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleNext} disabled={submitting} className={primary}>
                    {isLastSlide
                        ? alreadyPassed ? 'Done' : questions.length === 0 ? 'Complete training' : 'Take quiz'
                        : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <FloatingWindow
            title={training.title}
            progress={{
                label: showQuiz ? 'Quiz' : `Slide ${Math.min(slideIndex + 1, Math.max(slides.length, 1))} of ${slides.length}`,
                value: progressValue,
            }}
            onClose={close}
            footer={footer}
        >
            {body}
        </FloatingWindow>
    )
}
