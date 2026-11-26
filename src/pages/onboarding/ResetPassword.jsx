import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/ui/password-input'
import LoginShell, { LoginLoading } from '@/components/auth/LoginShell'
import { MAX_PASSWORD_LENGTH, meetsPasswordRules } from '@/lib/passwordPolicy'
import PasswordRequirements from '@/components/onboarding/PasswordRequirements'

// Landing page for the link in Supabase's standard password-reset email. The
// link signs the user into a short-lived recovery session, which is what
// authorizes updateUser({ password }).
export default function ResetPassword() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('checking')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [confirmError, setConfirmError] = useState(null)
    const arrivedViaRecoveryLink = useRef(/type=recovery/.test(window.location.hash + window.location.search))

    const clearErrors = () => {
        setError(null)
        setConfirmError(null)
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setStatus('ready')
        })

        const timer = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setStatus(prev => prev === 'checking'
                ? (session && arrivedViaRecoveryLink.current ? 'ready' : 'invalid')
                : prev)
        }, 2500)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        clearErrors()

        if (!meetsPasswordRules(password)) {
            setError('Please meet all of the password requirements.')
            return
        }
        if (password !== confirm) {
            setConfirmError('Passwords do not match.')
            return
        }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) {
            setLoading(false)
            setError(updateError.code === 'weak_password'
                ? 'Please meet all of the password requirements.'
                : updateError.message || 'Could not update your password. Please try again.'
            )
            return
        }

        await supabase.auth.signOut()
        navigate('/sign-in', { replace: true })
    }

    if (status === 'checking') {
        return <LoginLoading />
    }

    if (status === 'invalid') {
        return (
            <LoginShell backTo="/sign-in" title="Link expired" subtitle="This password reset link is invalid or has expired.">
                <Link to="/sign-in" replace className="lr-btn lr-btn-primary w-full">
                    Request a new link
                </Link>
            </LoginShell>
        )
    }

    return (
        <LoginShell backTo="/sign-in" title="Choose a new password" subtitle="Enter a new password for your account.">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="password" className="text-sm font-semibold text-[var(--lr-navy)]">New password</label>
                    <PasswordInput
                        as="input"
                        id="password"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            clearErrors()
                        }}
                        placeholder="Enter your new password"
                        className="lr-input"
                        required
                    />
                    <div className="pt-3">
                        <PasswordRequirements password={password} />
                    </div>
                </div>
                <div>
                    <label htmlFor="confirm" className="text-sm font-semibold text-[var(--lr-navy)]">Confirm new password</label>
                    <PasswordInput
                        as="input"
                        id="confirm"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={confirm}
                        onChange={(e) => {
                            setConfirm(e.target.value)
                            clearErrors()
                        }}
                        placeholder="Re-enter your new password"
                        className="lr-input"
                        aria-invalid={!!confirmError}
                        aria-describedby={confirmError ? 'confirm-error' : undefined}
                        required
                    />
                    {confirmError && (
                        <p id="confirm-error" className="lr-error">{confirmError}</p>
                    )}
                </div>

                {error && <p role="alert" className="lr-error">{error}</p>}

                <button type="submit" disabled={loading} className="lr-btn lr-btn-primary w-full">
                    {loading ? 'Saving...' : 'Update password'}
                </button>
            </form>
        </LoginShell>
    )
}
