import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import companyLogo from '@/assets/logo.png'
import { useCompletedCaregiver } from '@/hooks/useCompletedCaregiver'
import { clearActiveCompany } from '@/lib/caregiver'

const links = [
    { to: '/my-profile', label: 'My Profile' },
    { to: '/my-training', label: 'My Training' },
    { to: '/my-documents', label: 'My Documents' },
]

export function CaregiverGate({ state }) {
    if (state.status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }
    if (state.status === 'signin') return <Navigate to="/sign-in" replace />
    if (state.status === 'onboarding') return <Navigate to="/onboard" replace />
    if (state.status === 'choose') return <Navigate to="/choose-company" replace />
    if (state.status === 'norecord') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md px-8">
                    <h1 className="text-2xl font-bold mb-2">No employee record found</h1>
                    <p className="text-muted-foreground">
                        This account isn't linked to an employee. If you think this is a mistake, please contact your employer.
                    </p>
                </div>
            </div>
        )
    }
    return null
}

export default function CaregiverShell() {
    const navigate = useNavigate()
    const state = useCompletedCaregiver()

    const handleSignOut = async () => {
        clearActiveCompany()
        await supabase.auth.signOut()
        navigate('/sign-in', { replace: true })
    }

    if (state.status !== 'ready') return <CaregiverGate state={state} />

    return (
        <div className="min-h-screen bg-muted/30 px-4 py-10">
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                    <img src={companyLogo} alt="Ready, Set, Onboard!" className="w-[200px]" />
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <nav className="flex items-center gap-1 flex-wrap">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-[var(--secondary-bg)] text-[var(--primary-color)]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        {state.hasMultipleCompanies && (
                            <Button variant="ghost" size="sm" onClick={() => navigate('/choose-company')}>Switch company</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleSignOut}>Sign out</Button>
                    </div>
                </div>
                <Outlet context={state} />
            </div>
        </div>
    )
}
