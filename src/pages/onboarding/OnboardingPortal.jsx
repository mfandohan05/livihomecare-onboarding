import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getCaregiverByToken } from '@/data/mockEmployeeData'
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


export default function OnboardingPortal() {
    const { token } = useParams();
    const caregiver = getCaregiverByToken(token);
    const role = caregiver.role;

    if (!caregiver) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-8">
                    <h1 className="text-2xl font-bold mb-2">Link not found</h1>
                    <p className="text-muted-foreground">
                        This onboarding link is invalid or has expired. Please contact Livi Home Care for a new link.
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        📞 828-540-0112 &nbsp;|&nbsp; ✉️ office@livihomecare.com
                    </p>
                </div>
            </div>
        )
    }

    const [steps, setSteps] = useState(stepsByRole[caregiver.role]);
    const [activeStep, setActiveStep] = useState(1)

    useEffect(() => {
        caregiver.status = 'in_progress'
        console.log(`${caregiver.name} is now in progress.`);
    }, [])

    useEffect(() => {
        const lastStep = steps[steps.length - 1];
        if (activeStep === lastStep.id) {
            setSteps(prev => prev.map(step =>
                step.id === lastStep.id ? { ...step, status: 'completed' } : step
            ))
        }
    }, [activeStep])

    const handleNext = () => {
        setSteps(prev => prev.map(step => {
            if (step.id === activeStep) return { ...step, status: 'completed' }
            if (step.id === activeStep + 1) return { ...step, status: 'active' }
            return step
        }))
        setActiveStep(prev => prev + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const currentStepNumber = steps.findIndex(s => s.id === activeStep) + 1;
    const totalSteps = steps.length;
    const stepLabel = `Step ${currentStepNumber} of ${totalSteps}`
    const renderStep = () => {
        const step = steps.find(s => s.id === activeStep)
        if (!step) {
            return null
        } 

        switch (step.stepName) {
            case 'Welcome':
                return <WelcomePage caregiver={caregiver} onNext={handleNext} welcomeSteps={welcomeSteps[role]}/>
            case 'Upload Documents':
                return <UploadDocumentsPage stepLabel={stepLabel} onNext={handleNext} />
            case 'Personal Information':
                return <PersonalInformationPage stepLabel={stepLabel} onNext={handleNext} />
            case 'eRSP Enrollment':
                return <ERSPApplicationPage stepLabel={stepLabel} onNext={handleNext} />
            case 'New Hire Orientation':
                return <NewHireOrientationPage stepLabel={stepLabel} onNext={handleNext} />
            case 'Skills Competency':
                return <SkillsCompetencyPage stepLabel={stepLabel} onNext={handleNext} />
            case 'Guide to eRSP':
                return <ERSPGuidePage stepLabel={stepLabel} onNext={handleNext} />
            case 'Forms & Agreements':
                return <FormsApplicationsPage stepLabel={stepLabel} caregiver={caregiver} onNext={handleNext} />
            case 'Tax Forms':
            case 'Tax Forms (W-9)':
                return <TaxFormsPage stepLabel={stepLabel} onNext={handleNext} />
            case 'Offer Letter':
                return <OfferLetterPage stepLabel={stepLabel} caregiver={caregiver} onNext={handleNext} />
            case 'Completed!':
                return <CompletedPage stepLabel={stepLabel} caregiver={caregiver} />
            default:
                return null
        }
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
                caregiver={caregiver}
            />
            <SidebarInset className="overflow-y-auto">
                {renderStep()}
            </SidebarInset>
        </SidebarProvider>
    )
}