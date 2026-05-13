import OnboardingPortal from './pages/onboarding/OnboardingPortal'
import AdminLogin from './pages/admin/AdminLogin';
import AdminRoute from './components/admin/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/onboard/:token' element={<OnboardingPortal />} />
        <Route path='/admin/login' element={<AdminLogin />} />
        <Route path='/admin/*' element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
