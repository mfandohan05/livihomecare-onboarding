import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { callStudioFunction } from '@/lib/studio'

// Fresh, read-only replica of the slide/quiz rendering and grading logic in
// src/pages/onboarding/onboarding-pages/NewHireOrientationPage.jsx. It doesn't import
// that component: the real one writes quiz results to a real caregiver's
// caregiver_progress.quiz_scores on submit, and there's no safe way to preview against a
// real caregiver's data without either corrupting their saved progress or needing a fake
// caregiverId the real component was never built to handle. This preview keeps the exact
// same slide-styling rules and grading math, but everything lives in local state — nothing
// is ever written anywhere.
function renderContentLine(line, i) {
    if (line.startsWith('•')) {
        return <p key={i} className="pl-4 text-muted-foreground">{line}</p>
    }
    if (line.startsWith('"')) {
        return <p key={i} className="italic bg-muted/40 rounded-lg px-4 py-2">{line}</p>
    }
    if (line.endsWith(':')) {
        return <p key={i} className="font-semibold mt-2">{line}</p>
    }
    return <p key={i}>{line}</p>
}

export default function StudioOrientationPreview() {
    const { id: companyId, sectionId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [section, setSection] = useState(null)
    const [slides, setSlides] = useState([])
    const [quiz, setQuiz] = useState([])

    const [currentSlide, setCurrentSlide] = useState(0)
    const [showQuiz, setShowQuiz] = useState(false)
    const [quizAnswers, setQuizAnswers] = useState({})
    const [quizSubmitted, setQuizSubmitted] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const data = await callStudioFunction('studio-get-orientation-section-detail', { id: sectionId, companyId })
                setSection(data.section)
                setSlides(data.slides.map((s) => ({ title: s.title, content: s.content || [] })))
                setQuiz(data.questions.map((q) => ({ question: q.question_text, choices: q.options, correct: q.correct_answer_index })))
            } catch (err) {
                toast.error(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [sectionId, companyId])

    if (loading) return <p className="text-muted-foreground text-sm p-8">Loading...</p>
    if (!section) return <p className="text-muted-foreground text-sm p-8">Section not found.</p>

    const passingScore = section.passing_score ?? 0.8
    const allAnswered = Object.keys(quizAnswers).length === quiz.length
    const score = quiz.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correct ? 1 : 0), 0)
    const passed = score >= Math.ceil(quiz.length * passingScore)

    const restart = () => {
        setCurrentSlide(0)
        setShowQuiz(false)
        setQuizAnswers({})
        setQuizSubmitted(false)
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <button
                onClick={() => navigate(`/studio/companies/${companyId}/orientation/${sectionId}`)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to editor
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6 text-xs text-amber-800">
                Preview only — company branding (colors/logo) isn't applied here, and nothing you do on this page is saved
                anywhere. It reflects the live saved content for this section.
            </div>

            <h1 className="text-2xl font-bold mb-1">{section.title}</h1>
            <p className="text-sm text-muted-foreground mb-6">
                Passing score: {Math.round(passingScore * 100)}%
            </p>

            <div className="border border-border rounded-xl p-8">
                {!showQuiz ? (
                    slides.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No slides in this section yet.</p>
                    ) : (
                        <>
                            {slides[currentSlide].title && <h2 className="text-lg font-semibold mb-4">{slides[currentSlide].title}</h2>}
                            <div className="space-y-3 text-sm leading-relaxed mb-8">
                                {slides[currentSlide].content.map((line, i) => renderContentLine(line, i))}
                            </div>
                            <div className="flex items-center justify-between">
                                <Button variant="outline" disabled={currentSlide === 0} onClick={() => setCurrentSlide((s) => s - 1)}>
                                    Previous
                                </Button>
                                <p className="text-xs text-muted-foreground">Slide {currentSlide + 1} of {slides.length}</p>
                                {currentSlide < slides.length - 1 ? (
                                    <Button onClick={() => setCurrentSlide((s) => s + 1)}>Next</Button>
                                ) : (
                                    <Button onClick={() => setShowQuiz(true)} disabled={quiz.length === 0}>
                                        {quiz.length === 0 ? 'No quiz configured' : 'Take quiz'}
                                    </Button>
                                )}
                            </div>
                        </>
                    )
                ) : !quizSubmitted ? (
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Quiz</h2>
                        {quiz.map((q, qi) => (
                            <div key={qi} className="space-y-2">
                                <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                                <div className="space-y-1.5">
                                    {q.choices.map((choice, ci) => (
                                        <label key={ci} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`q${qi}`}
                                                checked={quizAnswers[qi] === ci}
                                                onChange={() => setQuizAnswers((prev) => ({ ...prev, [qi]: ci }))}
                                            />
                                            {choice}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button disabled={!allAnswered} onClick={() => setQuizSubmitted(true)}>
                            Submit quiz
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className={`flex items-center gap-2 font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {passed && <CheckCircle className="w-5 h-5" />}
                            {passed ? 'Passed' : 'Did not pass'} — {score} of {quiz.length} correct (need {Math.ceil(quiz.length * passingScore)})
                        </div>
                        {quiz.map((q, qi) => (
                            <div key={qi} className="space-y-1.5">
                                <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                                <div className="space-y-1">
                                    {q.choices.map((choice, ci) => {
                                        const isCorrect = ci === q.correct
                                        const isPicked = ci === quizAnswers[qi]
                                        return (
                                            <p
                                                key={ci}
                                                className={`text-sm px-2 py-1 rounded ${isCorrect ? 'bg-green-100 text-green-700' : isPicked ? 'bg-red-100 text-red-700 line-through' : 'text-muted-foreground'}`}
                                            >
                                                {choice}
                                            </p>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" onClick={restart}>Restart preview</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
