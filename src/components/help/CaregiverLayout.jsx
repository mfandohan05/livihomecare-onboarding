import { Outlet } from 'react-router-dom'
import CaregiverHelpButton from './CaregiverHelpButton'

// Shared layout for every caregiver-facing route (onboarding, account creation,
// sign-in, password reset, My Documents). Adding a route inside this layout in
// App.jsx is all it takes to get the Help button — no page needs to add it.
export default function CaregiverLayout() {
    return (
        <>
            <Outlet />
            <CaregiverHelpButton />
        </>
    )
}
