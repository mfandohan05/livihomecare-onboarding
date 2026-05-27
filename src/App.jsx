import OnboardingPortal from './pages/onboarding/OnboardingPortal'
import AdminLogin from './pages/admin/AdminLogin';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCaregivers from './pages/admin/AdminCaregivers';
import AdminCaregiverDetail from './pages/admin/AdminCaregiverDetail';
import AdminCaregiverMap from './pages/admin/AdminCaregiverMap';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogs from './pages/admin/AdminLogs';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/sonner';
import { Navigate } from 'react-router-dom';

import { Outlet } from 'react-router-dom'

function AdminLayoutWrapper() {
    return (
        <AdminRoute>
            <AdminLayout>
                <Outlet />
            </AdminLayout>
        </AdminRoute>
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
            </Routes>
        </BrowserRouter>
    )
}

export default App;
