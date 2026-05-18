import OnboardingPortal from './pages/onboarding/OnboardingPortal'
import AdminLogin from './pages/admin/AdminLogin';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCaregivers from './pages/admin/AdminCaregivers';
import AdminCaregiverDetail from './pages/admin/AdminCaregiverDetail';
import AdminCaregiverMap from './pages/admin/AdminCaregiverMap';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/sonner';
import { Navigate } from 'react-router-dom';


function App() {


  return (
    <BrowserRouter>
      <Toaster position="bottom-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path='/onboard/:token' element={<OnboardingPortal />} />
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route path='/admin/dashboard' element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/employees" element={
          <AdminRoute>
            <AdminCaregivers />
          </AdminRoute>
        } />
        <Route path="/admin/employees/:id" element={
          <AdminRoute>
            <AdminCaregiverDetail />
          </AdminRoute>
        } />
        <Route path="/admin/map" element={
          <AdminRoute>
            <AdminCaregiverMap />
          </AdminRoute>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default App;
