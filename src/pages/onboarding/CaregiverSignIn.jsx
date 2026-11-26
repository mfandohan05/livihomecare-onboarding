import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getMyCaregiver, usesGoogleSignIn } from '@/lib/caregiver'
import { PasswordInput } from '@/components/ui/password-input'
import LoginShell from '@/components/auth/LoginShell'
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
            const caregiver = await getMyCaregiver()
            if (cancelled) return

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

        // The record is derived server-side from this session — nothing about
        // which caregiver to load is ever supplied by the client.
        const caregiver = await getMyCaregiver()
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
        <LoginShell title="Employee login" subtitle="Sign in to continue your onboarding.">
            <SsoButtons
                redirectTo={`${window.location.origin}/sign-in?sso=1`}
                disabled={loading}
                onError={setError}
                buttonClassName="h-12 rounded-full border-[#677fa5] bg-white text-base font-semibold text-[var(--lr-navy)] hover:border-[var(--lr-navy)] hover:bg-[var(--lr-navy-tint)] hover:text-[var(--lr-navy)]"
            />
            <div className="my-5">
                <OrDivider />
            </div>
            <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-[var(--lr-navy)]">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="lr-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-semibold text-[var(--lr-navy)]">Password</label>
                    <PasswordInput
                        as="input"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="lr-input"
                        required
                    />
                </div>

                {error && <p role="alert" className="lr-error">{error}</p>}
                {notice && <p role="status" className="lr-muted text-sm">{notice}</p>}

                <button type="submit" disabled={loading} className="lr-btn lr-btn-primary w-full">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="mx-auto block text-sm font-medium text-[var(--lr-text-2)] hover:text-[var(--lr-navy)]"
                >
                    Forgot password?
                </button>
            </form>
        </LoginShell>
    )
}
