import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyCachedBranding } from './lib/branding'
import './index.css'
import App from './App.jsx'

applyCachedBranding()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
