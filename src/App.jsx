import OnboardingPortal from './pages/onboarding/OnboardingPortal'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/onboard/:token' element={<OnboardingPortal />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
