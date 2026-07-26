import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { GraduationCap, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'

export default function NewHireOrientationPage({ stepLabel, onNext, initialData, onChange, caregiverId, companyId }) {
    const [sections, setSections] = useState([])
    const [loadingContent, setLoadingContent] = useState(true)

    const [currentSection, setCurrentSection] = useState(initialData?.currentSection || 0)
    const [currentSlide, setCurrentSlide] = useState(initialData?.currentSlide || 0)
    const [showQuiz, setShowQuiz] = useState(initialData?.showQuiz || false)
    const [quizAnswers, setQuizAnswers] = useState(initialData?.quizAnswers || {})
    const [quizSubmitted, setQuizSubmitted] = useState(initialData?.quizSubmitted || false)
    const [completedSections, setCompletedSections] = useState(initialData?.completedSections || [])
    const [sectionStates, setSectionStates] = useState(initialData?.sectionStates || {})
    const [visitedSections, setVisitedSections] = useState(initialData?.visitedSections || [0])

    useEffect(() => {
        if (!companyId) return

        const loadOrientationContent = async () => {
            setLoadingContent(true)

            const { data: sectionRows, error: sectionError } = await supabase
                .from('orientation_sections')
                .select('id, title, section_order, passing_score')
                .eq('company_id', companyId)
                .order('section_order')

            if (sectionError || !sectionRows || sectionRows.length === 0) {
                setSections([])
                setLoadingContent(false)
                return
            }

            const sectionIds = sectionRows.map(s => s.id)

            const { data: slideRows } = await supabase
                .from('orientation_slides')
                .select('section_id, slide_order, title, content')
                .in('section_id', sectionIds)
                .order('slide_order')

            const { data: quizRows } = await supabase
                .from('orientation_quiz_questions')
                .select('section_id, question_order, question_text, options, correct_answer_index')
                .in('section_id', sectionIds)
                .order('question_order')

            const assembled = sectionRows.map(section => ({
                id: section.id,
                title: section.title,
                passingScore: section.passing_score ?? 0.7,
                slides: (slideRows || [])
                    .filter(sl => sl.section_id === section.id)
                    .map(sl => ({ title: sl.title, content: sl.content })),
                quiz: (quizRows || [])
                    .filter(q => q.section_id === section.id)
                    .map(q => ({
                        question: q.question_text,
                        choices: q.options,
                        correct: q.correct_answer_index,
                    })),
            }))

            setSections(assembled)
            setLoadingContent(false)
        }

        loadOrientationContent()
    }, [companyId])

    if (loadingContent) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--primary-color)] mr-2" />
                <p className="text-muted-foreground">Loading orientation content...</p>
            </div>
        )
    }

    if (sections.length === 0) {
        return (
            <div className="max-w-3xl mx-auto py-16 px-8 text-center">
                <p className="text-muted-foreground">Orientation content is not available yet. Please contact your administrator.</p>
            </div>
        )
    }

    const section = sections[currentSection]
    const slide = section.slides[currentSlide]
    const isLastSlide = currentSlide === section.slides.length - 1
    const isLastSection = currentSection === sections.length - 1

    const overallProgress = Math.round((completedSections.length / sections.length) * 100)
    const saveProgress = (updates) => {
        onChange({
            currentSection,
            currentSlide,
            showQuiz,
            quizAnswers,
            quizSubmitted,
            completedSections,
            sectionStates,
            visitedSections,
            ...updates,
        })
    }
    const switchSection = (targetIndex) => {
        const updatedSectionStates = {
            ...sectionStates,
            [currentSection]: {
                currentSlide,
                showQuiz,
                quizAnswers,
                quizSubmitted,
            }
        }
        setSectionStates(updatedSectionStates)

        const updatedVisited = visitedSections.includes(targetIndex)
            ? visitedSections
            : [...visitedSections, targetIndex]
        setVisitedSections(updatedVisited)

        const target = updatedSectionStates[targetIndex]

        setCurrentSection(targetIndex)
        setCurrentSlide(target?.currentSlide || 0)
        setShowQuiz(target?.showQuiz || false)
        setQuizAnswers(target?.quizAnswers || {})
        setQuizSubmitted(target?.quizSubmitted || false)

        saveProgress({
            sectionStates: updatedSectionStates,
            visitedSections: updatedVisited,
            currentSection: targetIndex,
            currentSlide: target?.currentSlide || 0,
            showQuiz: target?.showQuiz || false,
            quizAnswers: target?.quizAnswers || {},
            quizSubmitted: target?.quizSubmitted || false,
        })
    }
    const handleNextSlide = () => {
        if (isLastSlide) {
            if (section.quiz.length === 0) {
                handleNextSection();
            }
            else {
                setShowQuiz(true)
                saveProgress({ showQuiz: true })
            }

        }
        else {
            setCurrentSlide(prev => prev + 1)
            saveProgress({ currentSlide: currentSlide + 1 })
        }
    }

    const handlePrevSlide = () => {
        if (showQuiz) {
            setShowQuiz(false)
            if (!completedSections.includes(currentSection)) {
                setQuizAnswers({})
                setQuizSubmitted(false)
            }
        }
        else if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1)
        }
    }

    const handleAnswerSelect = (questionIndex, answerIndex) => {
        if (quizSubmitted) {
            return;
        }
        const updated = { ...quizAnswers, [questionIndex]: answerIndex }
        setQuizAnswers(updated)
        saveProgress({ quizAnswers: updated })
    }

    const allAnswered = Object.keys(quizAnswers).length === section.quiz.length

    const score = section.quiz.reduce((acc, q, i) => {
        return acc + (quizAnswers[i] === q.correct ? 1 : 0)
    }, 0)

    const passed = score >= Math.ceil(section.quiz.length * section.passingScore)

    const handleSubmitQuiz = () => {
        if (!passed) {
            setQuizSubmitted(true);
            return;
        }
        setQuizSubmitted(true)
        const payload = {
            sectionTitle: section.title,
            passedStatus: passed
        }
        pushProgress(payload)
    }

    const handleRetakeQuiz = () => {
        setQuizAnswers({})
        setQuizSubmitted(false)
    }

    const handleNextSection = () => {
        const updatedSections = completedSections.includes(currentSection)
            ? completedSections
            : [...completedSections, currentSection]

        setCompletedSections(updatedSections)

        if (isLastSection) {
            saveProgress({ completedSections: updatedSections })
            onNext()
        } else {
            const nextSection = currentSection + 1
            const updatedVisited = visitedSections.includes(nextSection)
                ? visitedSections
                : [...visitedSections, nextSection]
            setVisitedSections(updatedVisited)
            setCurrentSection(nextSection)
            setCurrentSlide(0)
            setShowQuiz(false)
            setQuizAnswers({})
            setQuizSubmitted(false)
            saveProgress({
                completedSections: updatedSections,
                visitedSections: updatedVisited,
                currentSection: nextSection,
                currentSlide: 0,
                showQuiz: false,
                quizAnswers: {},
                quizSubmitted: false,
            })
        }
    }

    const pushProgress = async (sectionScoreData) => {
        const { data } = await supabase
            .from('caregiver_progress')
            .select('quiz_scores')
            .eq('caregiver_id', caregiverId)
            .maybeSingle()

        const existing = data?.quiz_scores || []
        const updated = [...existing, sectionScoreData]

        await supabase
            .from('caregiver_progress')
            .update({ quiz_scores: updated })
            .eq('caregiver_id', caregiverId)
    }

    return (
        <div className="max-w-3xl mx-auto py-8 md:py-16 px-4 md:px-8">

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-[var(--primary-color)]" />
                <span className="text-[var(--primary-color)] font-medium">{stepLabel}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">New Hire Orientation</h1>
            <p className="text-muted-foreground mb-6">
                Complete all {sections.length} sections and their quizzes.
            </p>

            {/* Overall Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{completedSections.length} of {sections.length} sections complete</span>
                    <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
                {sections.map((s, i) => (
                    <button
                        key={s.id}
                        onClick={() => {
                            if (completedSections.includes(i) || i === currentSection || visitedSections.includes(i)) {
                                switchSection(i);
                            }
                        }}
                        className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium transition-colors border ${i === currentSection
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                            : completedSections.includes(i)
                                ? 'bg-[var(--secondary-bg)] text-[var(--primary-color)] border-[var(--primary-color)]'
                                : visitedSections.includes(i)
                                    ? 'bg-muted text-[var(--primary-color)] border-[var(--primary-color)] opacity-75'
                                    : 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {completedSections.includes(i) ? '✓ ' : ''}{s.title}
                    </button>
                ))}
            </div>

            {/* Slide View */}
            {!showQuiz && (
                <div className="border border-border rounded-xl p-4 md:p-8 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-1">
                        <h2 className="text-lg md:text-xl font-semibold">{slide.title}</h2>
                        <span className="text-xs text-muted-foreground">
                            Slide {currentSlide + 1} of {section.slides.length}
                        </span>
                    </div>
                    <div className="space-y-3">
                        {slide.content.map((line, i) => (
                            <p
                                key={i}
                                className={`text-sm leading-relaxed ${line.startsWith('•')
                                    ? 'pl-4 text-muted-foreground'
                                    : line.startsWith('"')
                                        ? 'italic text-[#577C09] font-medium text-base'
                                        : line.endsWith(':')
                                            ? 'font-medium text-foreground'
                                            : 'text-foreground'
                                    }`}
                            >
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Quiz View */}
            {showQuiz && (
                <div className="border border-border rounded-xl p-8 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-1">
                        <h2 className="text-lg md:text-xl font-semibold">Section Quiz — {section.title}</h2>
                        <span className="text-xs text-muted-foreground">{section.quiz.length} questions</span>
                    </div>

                    {!quizSubmitted ? (
                        <div className="space-y-8">
                            {section.quiz.map((q, qi) => (
                                <div key={qi}>
                                    <p className="font-medium text-sm mb-3">
                                        {qi + 1}. {q.question}
                                    </p>
                                    <div className="space-y-2">
                                        {q.choices.map((choice, ci) => (
                                            <button
                                                key={ci}
                                                onClick={() => handleAnswerSelect(qi, ci)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${quizAnswers[qi] === ci
                                                    ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)] text-[var(--hover-color)]'
                                                    : 'border-border hover:border-[var(--primary-color)] hover:bg-[var(--secondary-color)]/50'
                                                    }`}
                                            >
                                                {choice}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button
                                onClick={handleSubmitQuiz}
                                disabled={!allAnswered}
                                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Quiz
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {/* Score */}
                            <div className={`rounded-lg p-6 mb-8 text-center ${passed ? 'bg-[var(--secondary-bg)]' : 'bg-red-50'}`}>
                                <p className={`text-4xl font-bold mb-1 ${passed ? 'text-[var(--primary-color)]' : 'text-red-600'}`}>
                                    {score}/{section.quiz.length}
                                </p>
                                <p className={`text-sm font-medium ${passed ? 'text-[var(--hover-color)]' : 'text-red-600'}`}>
                                    {passed
                                        ? 'Passed — great work!'
                                        : 'Not quite — review the answers below and try again.'}
                                </p>
                            </div>

                            {/* Answer Review */}
                            <div className="space-y-6 mb-8">
                                {section.quiz.map((q, qi) => {
                                    const isCorrect = quizAnswers[qi] === q.correct
                                    return (
                                        <div
                                            key={qi}
                                            className={`rounded-lg border p-4 ${isCorrect
                                                ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)]/50'
                                                : 'border-red-200 bg-red-50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-2 mb-3">
                                                {isCorrect
                                                    ? <CheckCircle className="w-4 h-4 text-[var(--primary-color)] mt-0.5 shrink-0" />
                                                    : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                }
                                                <p className="font-medium text-sm">{q.question}</p>
                                            </div>
                                            <div className="space-y-1 pl-6">
                                                {q.choices.map((choice, ci) => (
                                                    <p
                                                        key={ci}
                                                        className={`text-sm px-3 py-1.5 rounded ${ci === q.correct
                                                            ? 'bg-[var(--primary-color)] text-white font-medium'
                                                            : ci === quizAnswers[qi] && !isCorrect
                                                                ? 'bg-red-200 text-red-800 line-through'
                                                                : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {choice}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {!passed ? (
                                <Button
                                    onClick={handleRetakeQuiz}
                                    className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8"
                                >
                                    Retake Quiz
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleNextSection}
                                    className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white px-8"
                                >
                                    {isLastSection ? 'Complete Orientation' : 'Continue to Next Section →'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Slide Navigation */}
            {!showQuiz && (
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePrevSlide}
                        disabled={currentSlide === 0}
                        className="gap-1 md:gap-2 disabled:opacity-50 text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>

                    <div className="flex gap-1.5">
                        {section.slides.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-[var(--primary-color)]' : 'bg-muted-foreground/30'
                                    }`}
                            />
                        ))}
                    </div>

                    <Button
                        onClick={handleNextSlide}
                        className="gap-1 md:gap-2 bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white text-sm"
                    >
                        {isLastSlide ? (section.quiz.length === 0 ? 'Complete Section' : 'Take Quiz') : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

        </div>
    )
}