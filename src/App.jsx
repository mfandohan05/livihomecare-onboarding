import OnboardingPortal from './pages/onboarding/OnboardingPortal'
import AdminLogin from './pages/admin/AdminLogin';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCaregivers from './pages/admin/AdminCaregivers';
import AdminCaregiverDetail from './pages/admin/AdminCaregiverDetail';
import AdminCaregiverMap from './pages/admin/AdminCaregiverMap';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogs from './pages/admin/AdminLogs';
import StudioLogin from './pages/studio/StudioLogin';
import PlatformAdminRoute from './components/studio/PlatformAdminRoute';
import StudioLayout from './components/studio/StudioLayout';
import StudioCompanies from './pages/studio/StudioCompanies';
import StudioCompanyEditor from './pages/studio/StudioCompanyEditor';
import StudioRoleLabels from './pages/studio/StudioRoleLabels';
import StudioOnboardingSteps from './pages/studio/StudioOnboardingSteps';
import StudioCompanyForms from './pages/studio/StudioCompanyForms';
import StudioCompanyFormEditor from './pages/studio/StudioCompanyFormEditor';
import StudioOfferLetterTemplates from './pages/studio/StudioOfferLetterTemplates';
import StudioOfferLetterTemplateEditor from './pages/studio/StudioOfferLetterTemplateEditor';
import StudioOrientationSections from './pages/studio/StudioOrientationSections';
import StudioOrientationSectionEditor from './pages/studio/StudioOrientationSectionEditor';
import StudioOrientationPreview from './pages/studio/StudioOrientationPreview';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/sonner';
import { Navigate } from 'react-router-dom';

import { Outlet } from 'react-router-dom'
import { CompanyProvider } from './context/CompanyContext';

function AdminLayoutWrapper() {
    return (
        <AdminRoute>
            <CompanyProvider>
                <AdminLayout>
                    <Outlet />
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

function App() {
    return (
        <BrowserRouter>
            <Toaster position="bottom-center" />
            <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path='/onboard/:token' element={<OnboardingPortal />} />
                <Route path='/admin/login' element={<AdminLogin />} />
                <Route path='/admin' element={<AdminLayoutWrapper />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="employees" element={<AdminCaregivers />} />
                    <Route path="employees/:id" element={<AdminCaregiverDetail />} />
                    <Route path="map" element={<AdminCaregiverMap />} />
                    <Route path="logs" element={<AdminLogs />} />
                </Route>
                <Route path='/studio/login' element={<StudioLogin />} />
                <Route path='/studio' element={<StudioLayoutWrapper />}>
                    <Route index element={<Navigate to="/studio/companies" replace />} />
                    <Route path="companies" element={<StudioCompanies />} />
                    <Route path="companies/:id" element={<StudioCompanyEditor />} />
                    <Route path="companies/:id/roles" element={<StudioRoleLabels />} />
                    <Route path="companies/:id/steps" element={<StudioOnboardingSteps />} />
                    <Route path="companies/:id/forms" element={<StudioCompanyForms />} />
                    <Route path="companies/:id/forms/:formId" element={<StudioCompanyFormEditor />} />
                    <Route path="companies/:id/offer-letters" element={<StudioOfferLetterTemplates />} />
                    <Route path="companies/:id/offer-letters/:templateId" element={<StudioOfferLetterTemplateEditor />} />
                    <Route path="companies/:id/orientation" element={<StudioOrientationSections />} />
                    <Route path="companies/:id/orientation/:sectionId" element={<StudioOrientationSectionEditor />} />
                    <Route path="companies/:id/orientation/:sectionId/preview" element={<StudioOrientationPreview />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App;
