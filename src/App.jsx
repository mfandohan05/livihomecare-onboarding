import { useEffect } from 'react'
import Landing from './pages/marketing/Landing'
import Login from './pages/Login'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsOfService from './pages/legal/TermsOfService'
import NotFound from './pages/NotFound'
import OnboardingGate from './pages/onboarding/OnboardingGate'
import CaregiverSignIn from './pages/onboarding/CaregiverSignIn'
import MyDocuments from './pages/onboarding/MyDocuments'
import ResetPassword from './pages/onboarding/ResetPassword'
import CaregiverLayout from './components/help/CaregiverLayout'
import CaregiverFaq from './pages/help/CaregiverFaq'
import AdminLogin from './pages/admin/AdminLogin';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCaregivers from './pages/admin/AdminCaregivers';
import AdminCaregiverDetail from './pages/admin/AdminCaregiverDetail';
import AdminCaregiverMap from './pages/admin/AdminCaregiverMap';
import AdminLayout from './components/admin/AdminLayout';
import BillingGate from './components/admin/BillingGate';
import RefundCancellation from './pages/legal/RefundCancellation';
import AdminLogs from './pages/admin/AdminLogs';
import AdminReports from './pages/admin/AdminReports';
import AdminHelp from './pages/admin/AdminHelp';
import AdminBilling from './pages/admin/AdminBilling';
import StudioLogin from './pages/studio/StudioLogin';
import PlatformAdminRoute from './components/studio/PlatformAdminRoute';
import StudioLayout from './components/studio/StudioLayout';
import StudioCompanies from './pages/studio/StudioCompanies';
import StudioCompanyEditor from './pages/studio/StudioCompanyEditor';
import StudioCompanyAdmins from './pages/studio/StudioCompanyAdmins';
import StudioRoleLabels from './pages/studio/StudioRoleLabels';
import StudioOnboardingSteps from './pages/studio/StudioOnboardingSteps';
import StudioCompanyForms from './pages/studio/StudioCompanyForms';
import StudioCompanyFormEditor from './pages/studio/StudioCompanyFormEditor';
import StudioOfferLetterTemplates from './pages/studio/StudioOfferLetterTemplates';
import StudioOfferLetterTemplateEditor from './pages/studio/StudioOfferLetterTemplateEditor';
import StudioOrientationSections from './pages/studio/StudioOrientationSections';
import StudioOrientationSectionEditor from './pages/studio/StudioOrientationSectionEditor';
import StudioOrientationPreview from './pages/studio/StudioOrientationPreview';
import { StudioTrainings, StudioTrainingEditor } from './pages/studio/StudioTrainings';
import { AdminTrainings, AdminTrainingEditor } from './pages/admin/AdminTrainings';
import MyProfile from './pages/onboarding/MyProfile';
import MyTraining from './pages/onboarding/MyTraining';
import TrainingPlayer from './pages/onboarding/TrainingPlayer';
import CaregiverShell from './components/training/CaregiverShell';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from './components/ui/sonner';
import ErrorDialogProvider from './components/global/ErrorDialogProvider';
import { Navigate } from 'react-router-dom';

import { Outlet } from 'react-router-dom'
import { CompanyProvider } from './context/CompanyContext';

function AdminLayoutWrapper() {
    return (
        <AdminRoute>
            <CompanyProvider>
                <AdminLayout>
                    <BillingGate>
                        <Outlet />
                    </BillingGate>
                </AdminLayout>
            </CompanyProvider>
        </AdminRoute>
    )
}

function StudioLayoutWrapper() {
    return (
        <PlatformAdminRoute>
            <StudioLayout>
                <Outlet />
            </StudioLayout>
        </PlatformAdminRoute>
    )
}

// Public pages only: start at the top when moving between them (e.g. landing page -> /login).
// App routes (/admin, /studio, /onboard) are left alone, and same-page #anchors don't change pathname.
const PUBLIC_PATHS = ['/', '/login', '/admin/login', '/sign-in', '/studio/login', '/privacy', '/terms', '/refund-cancellation']
function ScrollToTopOnPublicNav() {
    const { pathname } = useLocation()
    useEffect(() => {
        if (PUBLIC_PATHS.includes(pathname)) window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTopOnPublicNav />
            <Toaster position="bottom-center" />
            <ErrorDialogProvider />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund-cancellation" element={<RefundCancellation />} />
                {/* Public, static help content: no sign-in needed */}
                <Route path='/help' element={<CaregiverFaq />} />
                {/* Every caregiver route lives under CaregiverLayout, which adds the Help button */}
                <Route element={<CaregiverLayout />}>
                    <Route path='/onboard' element={<OnboardingGate />} />
                    <Route path='/onboard/:token' element={<OnboardingGate />} />
                    <Route path='/sign-in' element={<CaregiverSignIn />} />
                    <Route element={<CaregiverShell />}>
                        <Route path='/my-documents' element={<MyDocuments />} />
                        <Route path='/my-profile' element={<MyProfile />} />
                        <Route path='/my-training' element={<MyTraining />} />
                        <Route path='/my-training/:trainingId' element={<TrainingPlayer />} />
                    </Route>
                    <Route path='/reset-password' element={<ResetPassword />} />
                </Route>
                <Route path='/admin/login' element={<AdminLogin />} />
                <Route path='/admin' element={<AdminLayoutWrapper />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="employees" element={<AdminCaregivers />} />
                    <Route path="employees/:id" element={<AdminCaregiverDetail />} />
                    <Route path="map" element={<AdminCaregiverMap />} />
                    <Route path="training" element={<AdminTrainings />} />
                    <Route path="training/:trainingId" element={<AdminTrainingEditor />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="billing" element={<AdminBilling />} />
                    <Route path="help" element={<AdminHelp />} />
                    <Route path="help/:articleId" element={<AdminHelp />} />
                </Route>
                <Route path='/studio/login' element={<StudioLogin />} />
                <Route path='/studio' element={<StudioLayoutWrapper />}>
                    <Route index element={<Navigate to="/studio/companies" replace />} />
                    <Route path="companies" element={<StudioCompanies />} />
                    <Route path="companies/:id" element={<StudioCompanyEditor />} />
                    <Route path="companies/:id/admins" element={<StudioCompanyAdmins />} />
                    <Route path="companies/:id/roles" element={<StudioRoleLabels />} />
                    <Route path="companies/:id/steps" element={<StudioOnboardingSteps />} />
                    <Route path="companies/:id/forms" element={<StudioCompanyForms />} />
                    <Route path="companies/:id/forms/:formId" element={<StudioCompanyFormEditor />} />
                    <Route path="companies/:id/offer-letters" element={<StudioOfferLetterTemplates />} />
                    <Route path="companies/:id/offer-letters/:templateId" element={<StudioOfferLetterTemplateEditor />} />
                    <Route path="companies/:id/orientation" element={<StudioOrientationSections />} />
                    <Route path="companies/:id/orientation/:sectionId" element={<StudioOrientationSectionEditor />} />
                    <Route path="companies/:id/orientation/:sectionId/preview" element={<StudioOrientationPreview />} />
                    <Route path="companies/:id/training" element={<StudioTrainings />} />
                    <Route path="companies/:id/training/:trainingId" element={<StudioTrainingEditor />} />
                </Route>
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App;
