import { Outlet } from 'react-router-dom'
import CaregiverHelpButton from './CaregiverHelpButton'

export default function CaregiverLayout() {
    return (
        <>
            <Outlet />
            <CaregiverHelpButton />
        </>
    )
}
