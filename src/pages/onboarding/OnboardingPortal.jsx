import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { stepsByRole } from '@/data/steps'
import { welcomeSteps } from '@/data/steps'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import SidebarComponent from '@/components/global/SidebarComponent'
import WelcomePage from '@/pages/onboarding/onboarding-pages/WelcomePage'
import UploadDocumentsPage from '@/pages/onboarding/onboarding-pages/UploadDocumentsPage'
import PersonalInformationPage from './onboarding-pages/PersonalInformationPage'
import ERSPApplicationPage from './onboarding-pages/ERSPApplicationPage'
import NewHireOrientationPage from './onboarding-pages/NewHireOrientationPage'
import SkillsCompetencyPage from './onboarding-pages/SkillsCompetencyPage'
import ERSPGuidePage from './onboarding-pages/ERSPGuidePage'
import FormsApplicationsPage from './onboarding-pages/FormsApplicationsPage'
import TaxFormsPage from './onboarding-pages/TaxFormsPage'
import OfferLetterPage from './onboarding-pages/OfferLetterPage'
import CompletedPage from './onboarding-pages/CompletedPage'
import { useOnboardingTimer } from '@/hooks/useOnboardingTimer'

import { useSaveProgress, loadProgress as loadLocalProgress } from '@/hooks/useOnboardingProgress'

import { getCaregiverByToken, updateCaregiverStatus, saveProgress, loadProgress, saveTimeLog } from '@/lib/caregiver'
import { supabase } from '@/lib/supabase'


export default function OnboardingPortal() {
    const { token } = useParams()
    const { isIdle, getHoursWorked, isActiveTab, setPopupOpen } = useOnboardingTimer(token)

    const [caregiver, setCaregiver] = useState(null)
    const [loading, setLoading] = useState(true)
    const [steps, setSteps] = useState([])
    const [activeStep, setActiveStep] = useState(1)
    const [formData, setFormData] = useState({
        personalInfo: {},
        competency: { checked: {}, lunch: '', dinner: '' },
        orientationQuiz: {
            currentSection: 0,
            currentSlide: 0,
            completedSections: [],
            quizAnswers: {},
            quizSubmitted: false,
            showQuiz: false,
            sectionStates: {},
            visitedSections: [0]
        },
        signatures: {},
        formsCompleted: {},
        hepBStatus: '',
        offerLetter: {},
        erspApplication: { popupOpened: false, popupClosed: false },
        erspGuide: { confirmed: false }
    })
    const [timeLogSaved, setTimeLogSaved] = useState(false);

    useSaveProgress(token, activeStep, steps, formData)

    useEffect(() => {
        const fetchCaregiver = async () => {
            const data = await getCaregiverByToken(token)
            setCaregiver(data)

            if (data) {
                const roleSteps = stepsByRole[data.role]

                if (data.status === 'completed') {
                    setSteps(roleSteps.map(step => ({ ...step, status: 'completed' })))
                    setActiveStep(roleSteps[roleSteps.length - 1].id)
                    setLoading(false)
                    return
                }

                setSteps(roleSteps)

                const dbProgress = await loadProgress(data.id)
                if (dbProgress) {
                    setActiveStep(dbProgress.active_step)
                    setFormData(prev => ({ ...prev, ...dbProgress.form_data }))
                    setSteps(roleSteps.map(step => ({
                        ...step,
                        status: dbProgress.completed_steps.includes(step.id)
                            ? 'completed'
                            : step.id === dbProgress.active_step
                                ? 'active'
                                : 'locked'
                    })))
                } else {
                    localStorage.removeItem(`onboarding_${data.token}`)
                    setSteps(roleSteps)
                    setActiveStep(1)
                }
            }

            setLoading(false)
        }
        fetchCaregiver()
    }, [token])


    // update status to in_progress
    useEffect(() => {
        if (!caregiver) {
            return
        }
        if (caregiver.status === "completed") {
            return;
        }
        updateCaregiverStatus(caregiver.id, 'in_progress')
        console.log(`${caregiver.name} is now in progress.`)
    }, [caregiver?.id])

    useEffect(() => {
        if (!caregiver) return
        const key = `livi_session_start_${token}`
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, new Date().toISOString())
        }
    }, [caregiver?.id])


    // mark last step completed
    useEffect(() => {
        if (!steps.length) {
            return;
        }
        const lastStep = steps[steps.length - 1]
        if (activeStep === lastStep.id) {
            setSteps(prev => prev.map(step =>
                step.id === lastStep.id ? { ...step, status: 'completed' } : step
            ))
            updateCaregiverStatus(caregiver.id, 'completed')

            const saveLog = async () => {
                const { data } = await supabase
                    .from('caregiver_time_logs')
                    .select('id')
                    .eq('caregiver_id', caregiver.id)
                    .eq('completed', true)
                    .maybeSingle()

                if (!data) {
                    const actualStart = localStorage.getItem(`livi_session_start_${token}`)
                    saveTimeLog(caregiver.id, getHoursWorked(), actualStart);
                }
            }

            saveLog();
        }
    }, [activeStep])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!caregiver) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-8">
                    <h1 className="text-2xl font-bold mb-2">Link not found</h1>
                    <p className="text-muted-foreground">
                        This onboarding link is invalid or has expired. Please contact Livi Home Care for a new link.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        📞 980-416-6127 &nbsp;|&nbsp; ✉️ office@livihomecare.com
                    </p>
                </div>
            </div>
        )
    }

    const role = caregiver.role;
    const currentStepNumber = steps.findIndex(s => s.id === activeStep) + 1
    const totalSteps = steps.length
    const stepLabel = `Step ${currentStepNumber} of ${totalSteps}`

    const resetFormData = () => {
        localStorage.removeItem(`onboarding_${token}`)
        localStorage.removeItem(`livi_time_${token}`)
        setFormData({
            personalInfo: {},
            competency: { checked: {}, lunch: '', dinner: '' },
            orientationQuiz: {
                currentSection: 0,
                currentSlide: 0,
                completedSections: [],
                quizAnswers: {},
            },
            signatures: {},
            hepBStatus: '',
            offerLetter: {},
            erspApplication: { popupOpened: false, popupClosed: false, confirmed: false },
        })
        setActiveStep(1)
        setSteps(stepsByRole[caregiver.role])
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const updateFormData = (key, data) => {
        setFormData(prev => ({ ...prev, [key]: data }))
    }

    const handleNext = async () => {
        const updatedSteps = steps.map(step => {
            if (step.id === activeStep) return { ...step, status: 'completed' }
            if (step.id === activeStep + 1) return { ...step, status: 'active' }
            return step
        })

        const completedStepIds = updatedSteps
            .filter(s => s.status === 'completed')
            .map(s => s.id)

        setSteps(updatedSteps)
        setActiveStep(prev => prev + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })

        await saveProgress(caregiver.id, activeStep + 1, completedStepIds, formData)
    }

    const renderStep = () => {
        const step = steps.find(s => s.id === activeStep)
        if (!step) return null

        switch (step.stepName) {
            case 'Welcome':
                return <WelcomePage caregiver={caregiver} onNext={handleNext} welcomeSteps={welcomeSteps[role]} />
            case 'Upload Documents':
                return <UploadDocumentsPage stepLabel={stepLabel} onNext={handleNext} role={caregiver.role} caregiver={caregiver} />
            case 'Personal Information':
                return <PersonalInformationPage stepLabel={stepLabel} onNext={handleNext} initialData={formData.personalInfo} onChange={(data) => updateFormData('personalInfo', data)} />
            case 'Enrollment Profile / Enrollment':
                return <ERSPApplicationPage stepLabel={stepLabel} onNext={handleNext} setPopupOpen={setPopupOpen} initialData={formData.erspApplication} onChange={(data) => updateFormData('erspApplication', data)} />
            case 'New Hire Orientation':
                return <NewHireOrientationPage stepLabel={stepLabel} onNext={handleNext} initialData={formData.orientationQuiz} onChange={async (data) => {
                    updateFormData('orientationQuiz', data)
                    await saveProgress(caregiver.id, activeStep, steps.filter(s => s.status === 'completed').map(s => s.id), { ...formData, orientationQuiz: data })
                }} />
            case 'Competency Checklist':
                return <SkillsCompetencyPage stepLabel={stepLabel} onNext={handleNext} initialData={formData.competency} onChange={async (data) => {
                    updateFormData('compentency', data)
                    await saveProgress(
                        caregiver.id,
                        activeStep,
                        steps.filter(s => s.status === 'completed').map(s => s.id),
                        { ...formData, competency: data }
                    )
                }} />
            case 'How to Use eRSP':
                return <ERSPGuidePage stepLabel={stepLabel} onNext={handleNext} initialData={formData.erspGuide} onChange={(data) => updateFormData('erspGuide', data)} />
            case 'Forms & Agreements':
                return <FormsApplicationsPage stepLabel={stepLabel} caregiver={caregiver} onNext={handleNext} initialData={{ signatures: formData.signatures, hepBStatus: formData.hepBStatus, completed: formData.formsCompleted }} onChange={async (data) => {
                    updateFormData('signatures', data.signatures)
                    updateFormData('formsCompleted', data.completed)
                    await saveProgress(
                        caregiver.id,
                        activeStep,
                        steps.filter(s => s.status === 'completed').map(s => s.id),
                        { ...formData, signatures: data.signatures, formsCompleted: data.completed }
                    )
                }} onHepBChange={(status) => updateFormData('hepBStatus', status)} />
            case 'Tax Forms':
            case 'Tax Forms (W-9)':
                return <TaxFormsPage stepLabel={stepLabel} onNext={handleNext} role={role} caregiver={caregiver} />
            case 'Offer Letter':
                return <OfferLetterPage stepLabel={stepLabel} caregiver={caregiver} onNext={handleNext} initialData={formData.offerLetter} onChange={async (data) => {
                    updateFormData('offerLetter', data)
                    await saveProgress(
                        caregiver.id,
                        activeStep,
                        steps.filter(s => s.status === 'completed').map(s => s.id),
                        { ...formData, offerLetter: data }
                    )
                }} />
            case 'Completed!':
                return <CompletedPage stepLabel={stepLabel} caregiver={caregiver} getHoursWorked={getHoursWorked} updateCaregiverStatus={updateCaregiverStatus} />
            default:
                return null
        }
    }
    const isCompleted = caregiver?.status === 'completed' ||
        steps.every(s => s.status === 'completed')
    return (
        <SidebarProvider>
            <SidebarComponent
                steps={steps}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                handleNext={handleNext}
                resetFormData={resetFormData}
                caregiver={caregiver}
                isIdle={isIdle}
                getHoursWorked={getHoursWorked}
                isCompleted={isCompleted}
            />
            <SidebarInset className="overflow-y-auto">
                {renderStep()}
            </SidebarInset>
        </SidebarProvider>
    )
}