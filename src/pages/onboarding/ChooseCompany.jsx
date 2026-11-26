import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { clearActiveCompany, getMyCaregiverContext, setActiveCompany } from '@/lib/caregiver'
import AuthCard from '@/components/onboarding/AuthCard'
import { Button } from '@/components/ui/button'

export default function ChooseCompany() {
    const navigate = useNavigate()
    const [state, setState] = useState({ status: 'loading' })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                if (!cancelled) setState({ status: 'signin' })
                return
            }

            clearActiveCompany()
            const { caregiver, companies } = await getMyCaregiverContext()
            if (cancelled) return

            if (companies.length > 1) {
                setState({ status: 'choose', companies })
                return
            }
            if (caregiver) {
                navigate(caregiver.status === 'completed' ? '/my-profile' : '/onboard', { replace: true })
                return
            }
            setState({ status: 'norecord' })
        }

        load()
        return () => { cancelled = true }
    }, [navigate])

    const choose = (company) => {
        setActiveCompany(company.companyId)
        navigate(company.status === 'completed' ? '/my-profile' : '/onboard', { replace: true })
    }

    const signOut = async () => {
        clearActiveCompany()
        await supabase.auth.signOut()
        navigate('/sign-in', { replace: true })
    }

    if (state.status === 'signin') return <Navigate to="/sign-in" replace />

    if (state.status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (state.status === 'norecord') {
        return (
            <AuthCard title="No onboarding found" subtitle="This account isn't linked to an employee onboarding. If you think this is a mistake, please contact your employer.">
                <Button variant="outline" className="w-full" onClick={signOut}>Sign out</Button>
            </AuthCard>
        )
    }

    return (
        <AuthCard title="Choose a company" subtitle="Your account is linked to more than one employer. Which one do you want to continue with?">
            <div className="space-y-2">
                {state.companies.map((company) => (
                    <button
                        key={company.companyId}
                        type="button"
                        onClick={() => choose(company)}
                        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
                    >
                        <div>
                            <p className="font-medium">{company.companyName || 'Unnamed company'}</p>
                            <p className="text-xs text-muted-foreground">
                                {company.status === 'completed' ? 'Onboarding complete' : 'Onboarding in progress'}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={signOut}>Sign out</Button>
        </AuthCard>
    )
}
