import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'

const MIN_PASSWORD_LENGTH = 8

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
    const arrivedViaRecoveryLink = useRef(/type=recovery/.test(window.location.hash + window.location.search))

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
        setError(null)

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
            return
        }
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) {
            setLoading(false)
            setError(updateError.message || 'Could not update your password. Please try again.')
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
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <Input
                        id="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
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
