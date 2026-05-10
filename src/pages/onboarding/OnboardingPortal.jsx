import { useState, useEffect } from 'react'
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
import { Heart, FolderUp, ClipboardList, GraduationCap, UserRound, ClipboardCheck, MonitorPlay, ScrollText, FileSignature, PartyPopper, FileText } from 'lucide-react'

const initialSteps = [
    { id: 1, stepName: "Welcome", logo: Heart, status: 'active' },
    { id: 2, stepName: "Upload Documents", logo: FolderUp, status: 'locked' },
    { id: 3, stepName: "Personal Information", logo: UserRound, status: 'locked' },
    { id: 4, stepName: "eRSP Enrollment", logo: ClipboardList, status: 'locked' },
    { id: 5, stepName: "New Hire Orientation", logo: GraduationCap, status: 'locked' },
    { id: 6, stepName: "Skills Competency", logo: ClipboardCheck, status: 'locked' },
    { id: 7, stepName: "Guide to eRSP", logo: MonitorPlay, status: 'locked' },
    { id: 8, stepName: "Forms & Agreements", logo: ScrollText, status: 'locked' },
    { id: 9, stepName: "Tax Forms", logo: FileText, status: 'locked' },
    { id: 10, stepName: "Offer Letter", logo: FileSignature, status: 'locked' },
    { id: 11, stepName: "Completed!", logo: PartyPopper, status: 'locked' },
];

const caregiver = {
    name: 'Maria Santos',
    email: 'msantos@livihomecare.com'
}

export default function OnboardingPortal() {
    const [steps, setSteps] = useState(initialSteps)
    const [activeStep, setActiveStep] = useState(1)



    const handleNext = () => {
        setSteps(prev => prev.map(step => {
            if (step.id === activeStep) return { ...step, status: 'completed' }
            if (step.id === activeStep + 1) return { ...step, status: 'active' }
            return step
        }))
        setActiveStep(prev => prev + 1)
    }

    useEffect(() => {
        if (activeStep === 11) {
            setSteps(prev => prev.map(step =>
                step.id === 11 ? { ...step, status: 'completed' } : step
            ))
        }
    }, [activeStep])

    return (
        <SidebarProvider>
            <SidebarComponent
                steps={steps}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                handleNext={handleNext}
            />
            <SidebarInset className="overflow-y-auto">
                {activeStep === 1 && <WelcomePage caregiver={caregiver} onNext={handleNext} />}
                {activeStep === 2 && <UploadDocumentsPage onNext={handleNext} />}
                {activeStep === 3 && <PersonalInformationPage onNext={handleNext} />}
                {activeStep === 4 && <ERSPApplicationPage onNext={handleNext} />}
                {activeStep === 5 && <NewHireOrientationPage onNext={handleNext} />}
                {activeStep === 6 && <SkillsCompetencyPage onNext={handleNext} />}
                {activeStep === 7 && <ERSPGuidePage onNext={handleNext} />}
                {activeStep === 8 && <FormsApplicationsPage caregiver={caregiver} onNext={handleNext} />}
                {activeStep === 9 && <TaxFormsPage onNext={handleNext} />}
                {activeStep === 10 && <OfferLetterPage caregiver={caregiver} onNext={handleNext} />}
                {activeStep === 11 && <CompletedPage caregiver={caregiver} onNext={handleNext} />}
            </SidebarInset>
        </SidebarProvider>
    )
}