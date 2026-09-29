import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCaregiverByToken, getMyCaregiver } from '@/lib/caregiver'
import CreateAccountForm from '@/components/onboarding/CreateAccountForm'
import { Button } from '@/components/ui/button'
import OnboardingPortal from './OnboardingPortal'

// Entry point for both routes into onboarding:
//   /onboard/:token  the emailed link — resolved server-side; it never grants
//                    access by itself once the caregiver has an account
//   /onboard         reached after signing in; the record is derived from the
//                    session, never from anything the client supplies
export default function OnboardingGate() {
    const { token } = useParams()
    const [result, setResult] = useState({ status: 'loading' })
    const [attempt, setAttempt] = useState(0)

    const refresh = () => {
        setResult({ status: 'loading' })
        setAttempt(a => a + 1)
    }

    useEffect(() => {
        let cancelled = false

        const resolve = async () => {
            let next

            if (token) {
                const res = await getCaregiverByToken(token)
                if (!res) next = { status: 'invalid' }
                else if (res.state === 'ok') next = { status: 'ready', caregiver: res.caregiver, viewer: res.viewer }
                else if (res.state === 'needs_signup') next = { status: 'signup', name: res.name, email: res.email }
                else if (res.state === 'needs_signin') next = { status: 'signin' }
                else {
                    // Unrecognized response (e.g. an out-of-date function deployment) — never guess.
                    console.error('Unexpected get-caregiver-by-token response', res)
                    next = { status: 'invalid' }
                }
            } else {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    next = { status: 'signin' }
                } else {
                    const caregiver = await getMyCaregiver()
                    next = caregiver
                        ? { status: 'ready', caregiver, viewer: 'caregiver' }
                        : { status: 'norecord' }
                }
            }

            if (!cancelled) setResult(next)
        }

        resolve()
        return () => { cancelled = true }
    }, [token, attempt])

    switch (result.status) {
        case 'loading':
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            )
        case 'signin':
            return <Navigate to="/sign-in" replace />
        case 'signup':
            return (
                <CreateAccountForm
                    token={token}
                    name={result.name}
                    email={result.email}
                    onCreated={refresh}
                    onExistingAccount={refresh}
                />
            )
        case 'ready':
            return <OnboardingPortal key={result.caregiver.id} initialCaregiver={result.caregiver} viewer={result.viewer} />
        case 'norecord':
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md px-8">
                        <h1 className="text-2xl font-bold mb-2">No onboarding found</h1>
                        <p className="text-muted-foreground">
                            This account isn't linked to an employee onboarding. If you think this is a mistake, please contact your employer.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={async () => { await supabase.auth.signOut(); refresh() }}
                        >
                            Sign out
                        </Button>
                    </div>
                </div>
            )
        default:
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md px-8">
                        <h1 className="text-2xl font-bold mb-2">Link not found</h1>
                        <p className="text-muted-foreground">
                            This onboarding link is invalid or has expired. Please contact Livi Home Care for a new link.
                        </p>
                        <p className="text-sm text-muted-foreground mt-4">
                            📞 980-416-6127 &nbsp;|&nbsp; ✉️ office@livihomecare.com
                        </p>
                    </div>
                </div>
            )
    }
}
