import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { clearActiveCompany, getMyCaregiverContext, usesGoogleSignIn } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'
import SsoButtons, { OrDivider } from '@/components/onboarding/SsoButtons'

export default function CaregiverSignIn() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [notice, setNotice] = useState(null)

    useEffect(() => {
        if (!searchParams.has('sso')) return
        let cancelled = false

        const finishSsoSignIn = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session || cancelled) return

            setLoading(true)
            clearActiveCompany()
            const { caregiver, companies } = await getMyCaregiverContext()
            if (cancelled) return

            if (companies.length > 1) {
                navigate('/choose-company', { replace: true })
                return
            }

            if (!caregiver) {
                await supabase.auth.signOut()
                setError('No employee onboarding is linked to this account. Use the link in your invitation email to get started.')
                setLoading(false)
                return
            }

            navigate(caregiver.status === 'completed' ? '/my-profile' : '/onboard', { replace: true })
        }

        finishSsoSignIn()
        return () => { cancelled = true }
    }, [searchParams, navigate])

    const handleSignIn = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setNotice(null)

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
            const googleUser = await usesGoogleSignIn(email)
            setError(googleUser
                ? 'It looks like you signed up with Google. Please sign in again using Google.'
                : 'Invalid email or password')
            setLoading(false)
            return
        }

        clearActiveCompany()
        const { caregiver, companies } = await getMyCaregiverContext()
        if (companies.length > 1) {
            navigate('/choose-company', { replace: true })
            return
        }
        if (!caregiver) {
            await supabase.auth.signOut()
            setError('No employee onboarding is linked to this account.')
            setLoading(false)
            return
        }

        navigate(caregiver.status === 'completed' ? '/my-profile' : '/onboard', { replace: true })
    }

    const handleForgotPassword = async () => {
        setError(null)
        setNotice(null)
        if (!email) {
            setError('Enter your email above, then choose "Forgot password?".')
            return
        }

        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        // Same message whether or not the address has an account.
        setNotice('If an account exists for that email, we sent a link to reset your password.')
    }

    return (
        <AuthCard title="Employee Sign In" subtitle="Sign in to continue your onboarding">
            <SsoButtons
                redirectTo={`${window.location.origin}/sign-in?sso=1`}
                disabled={loading}
                onError={setError}
            />
            <div className="my-4">
                <OrDivider />
            </div>
            <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus-visible:border-[var(--rsonboard-navy)] focus-visible:ring-[var(--rsonboard-navy)]/40"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="focus-visible:border-[var(--rsonboard-navy)] focus-visible:ring-[var(--rsonboard-navy)]/40"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white focus-visible:ring-[var(--rsonboard-navy)]/40"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>

                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="block mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Forgot password?
                </button>
            </form>
        </AuthCard>
    )
}
