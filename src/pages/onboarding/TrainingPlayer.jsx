import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useCompletedCaregiver } from '@/hooks/useCompletedCaregiver'
import CaregiverShell, { CaregiverGate } from '@/components/training/CaregiverShell'
import TrainingSlideView from '@/components/training/TrainingSlideView'
import { trainingCaregiver } from '@/lib/training'

export default function TrainingPlayer() {
    const { trainingId } = useParams()
    const navigate = useNavigate()
    const state = useCompletedCaregiver()

    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [slideIndex, setSlideIndex] = useState(0)
    const [showQuiz, setShowQuiz] = useState(false)
    const [answers, setAnswers] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)

    useEffect(() => {
        if (state.status !== 'ready') return
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
    }, [state.status, trainingId])

    if (state.status !== 'ready') return <CaregiverGate state={state} />

    if (error) {
        return (
            <CaregiverShell>
                <div className="bg-white rounded-xl border border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" onClick={() => navigate('/my-training')}>Back to My Training</Button>
                </div>
            </CaregiverShell>
        )
    }

    if (!data) {
        return (
            <CaregiverShell>
                <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </CaregiverShell>
        )
    }

    const { training, slides, questions } = data
    const alreadyPassed = data.progress.status === 'passed'
    const slide = slides[slideIndex]
    const isLastSlide = slideIndex >= slides.length - 1
    const progressValue = showQuiz || result?.passed
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
        if (alreadyPassed) return navigate('/my-training')
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

    return (
        <CaregiverShell maxWidth="max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-3">{training.title}</h1>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{showQuiz ? 'Quiz' : `Slide ${Math.min(slideIndex + 1, Math.max(slides.length, 1))} of ${slides.length}`}</span>
                    <span>{progressValue}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
            </div>

            {result?.passed ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-3" />
                    <h2 className="text-xl font-semibold mb-1">Training complete</h2>
                    {result.total > 0 && (
                        <p className="text-sm text-muted-foreground mb-6">
                            You scored {result.score} of {result.total}. Great work!
                        </p>
                    )}
                    <Button
                        onClick={() => navigate('/my-training')}
                        className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8"
                    >
                        Continue
                    </Button>
                </div>
            ) : result ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center">
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
                        <Button
                            onClick={() => { setAnswers({}); setResult(null) }}
                            className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8"
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            ) : showQuiz ? (
                <div className="bg-white border border-border rounded-xl p-4 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-1">
                        <h2 className="text-lg md:text-xl font-semibold">Quiz</h2>
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
                        <div className="flex items-center justify-between">
                            <Button variant="outline" onClick={handleBack}>
                                <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button
                                onClick={submit}
                                disabled={!allAnswered || submitting}
                                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit quiz'}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : slides.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center">
                    <p className="text-sm text-muted-foreground">This training has no content yet.</p>
                </div>
            ) : (
                <>
                    <TrainingSlideView slide={slide} index={slideIndex} total={slides.length} />
                    <div className="flex items-center justify-between mt-6">
                        <Button variant="outline" onClick={handleBack} disabled={slideIndex === 0}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={submitting}
                            className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white"
                        >
                            {isLastSlide
                                ? alreadyPassed ? 'Done' : questions.length === 0 ? 'Complete training' : 'Take quiz'
                                : 'Next'}
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </>
            )}
        </CaregiverShell>
    )
}
