import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    getCaregiverByToken,
    getMyCaregiver,
    getVerificationProof,
    setVerificationProof,
    clearVerificationProof,
    linkSsoAccount,
    hasSsoIntent,
    clearSsoIntent,
} from '@/lib/caregiver'
import CreateAccountForm from '@/components/onboarding/CreateAccountForm'
import VerifyIdentity from '@/components/onboarding/VerifyIdentity'
import { Button } from '@/components/ui/button'
import OnboardingPortal from './OnboardingPortal'

const SSO_PROVIDERS = ['google']

const linkRequests = new Map()

function linkSsoOnce(token, proof) {
    const key = `${token}:${proof}`
    if (!linkRequests.has(key)) {
        linkRequests.set(key, linkSsoAccount(token, proof).finally(() => linkRequests.delete(key)))
    }
    return linkRequests.get(key)
}

async function resolveSignup(token, res) {
    const info = {
        firstName: res.firstName,
        companyName: res.companyName,
        maskedEmail: res.maskedEmail,
        imported: res.imported === true,
    }
    const proof = getVerificationProof(token)
    if (!proof) return { status: 'verify', ...info }

    if (!hasSsoIntent(token)) return { status: 'signup', proof, ...info }

    const { data: { session } } = await supabase.auth.getSession()
    const isSsoSession = !!session?.user?.identities?.some(i => SSO_PROVIDERS.includes(i.provider))
    if (!isSsoSession) {
        clearSsoIntent(token)
        return { status: 'signup', proof, ...info }
    }

    const link = await linkSsoOnce(token, proof)
    clearSsoIntent(token)
    if (link?.success || link?.alreadyExists) return { status: 'retry' }

    if (link?.verificationRequired) {
        clearVerificationProof(token)
        await supabase.auth.signOut()
        return { status: 'verify', ...info }
    }

    await supabase.auth.signOut()
    return { status: 'signup', proof, initialError: link?.error || 'Could not link your account. Please try again.', ...info }
}

// Entry point for both routes into onboarding:
//   /onboard/:token  the emailed link — resolved server-side; it never grants
//                    access by itself once the caregiver has an account
//   /onboard         reached after signing in; the record is derived from the
//                    session, never from anything the client supplies
export default function OnboardingGate() {
    const { token } = useParams()
    const [searchParams] = useSearchParams()
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
                else if (res.state === 'ok') {
                    clearVerificationProof(token)
                    next = { status: 'ready', caregiver: res.caregiver, viewer: res.viewer }
                }
                else if (res.state === 'needs_signup') next = await resolveSignup(token, res)
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

            if (cancelled) return
            if (next.status === 'retry') {
                setAttempt(a => a + 1)
                return
            }
            setResult(next)
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
        case 'verify':
            return (
                <VerifyIdentity
                    token={token}
                    firstName={result.firstName}
                    companyName={result.companyName}
                    maskedEmail={result.maskedEmail}
                    imported={result.imported}
                    onVerified={(proof) => {
                        setVerificationProof(token, proof)
                        refresh()
                    }}
                />
            )
        case 'signup':
            return (
                <CreateAccountForm
                    token={token}
                    proof={result.proof}
                    firstName={result.firstName}
                    maskedEmail={result.maskedEmail}
                    imported={result.imported}
                    initialError={result.initialError}
                    onCreated={refresh}
                    onExistingAccount={refresh}
                    onVerificationExpired={refresh}
                />
            )
        case 'ready':
            if (
                result.viewer !== 'admin' &&
                result.caregiver.status === 'completed' &&
                (!searchParams.has('certificate') || result.caregiver.source === 'imported')
            ) {
                return <Navigate to="/my-profile" replace />
            }
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
