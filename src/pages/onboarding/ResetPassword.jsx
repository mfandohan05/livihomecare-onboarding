import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'
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
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (status === 'invalid') {
        return (
            <AuthCard title="Link expired" subtitle="This password reset link is invalid or has expired.">
                <Button
                    onClick={() => navigate('/sign-in', { replace: true })}
                    className="w-full bg-[#0A2E73] hover:bg-[#14449C] text-white"
                >
                    Back to sign in
                </Button>
            </AuthCard>
        )
    }

    return (
        <AuthCard title="Choose a new password" subtitle="Enter a new password for your account">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="password">New password</Label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            clearErrors()
                        }}
                        placeholder={`Enter your new password`}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
                    <div className="pt-1">
                        <PasswordRequirements password={password} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <PasswordInput
                        id="confirm"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={confirm}
                        onChange={(e) => {
                            setConfirm(e.target.value)
                            clearErrors()
                        }}
                        placeholder={`Re-enter your new password`}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        aria-invalid={!!confirmError}
                        aria-describedby={confirmError ? 'confirm-error' : undefined}
                        required
                    />
                    {confirmError && (
                        <p id="confirm-error" className="text-sm text-red-500">{confirmError}</p>
                    )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0A2E73] hover:bg-[#14449C] text-white focus-visible:ring-[#08265D]/40"
                >
                    {loading ? 'Saving...' : 'Update password'}
                </Button>
            </form>
        </AuthCard>
    )
}
