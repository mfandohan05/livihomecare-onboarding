import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPassword() {
    const location = useLocation()
    const [email, setEmail] = useState(location.state?.email ?? '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sentTo, setSentTo] = useState(null)
    const [cooldown, setCooldown] = useState(0)

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const requestReset = async (address) => {
        setLoading(true)
        setError(null)

        const { data, error: invokeError } = await supabase.functions.invoke('request-password-reset', {
            body: { email: address },
        })

        setLoading(false)

        if (invokeError || !data?.success) {
            setError(data?.error || 'We could not send the reset email. Please try again.')
            return
        }

        setSentTo(address)
        setCooldown(RESEND_COOLDOWN_SECONDS)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        requestReset(email.trim())
    }

    if (sentTo) {
        return (
            <AuthCard title="Check your email" subtitle={`If an account exists for ${sentTo}, we sent a link to reset your password.`}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The link can only be used once. If you don't see the email in a few minutes, check your spam or junk folder.
                    </p>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading || cooldown > 0}
                        onClick={() => requestReset(sentTo)}
                        className="w-full"
                    >
                        {loading ? 'Sending...' : cooldown > 0 ? `Resend email (${cooldown}s)` : 'Resend email'}
                    </Button>

                    <Button
                        asChild
                        className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white"
                    >
                        <Link to="/sign-in" replace>Back to sign in</Link>
                    </Button>

                    <button
                        type="button"
                        onClick={() => {
                            setSentTo(null)
                            setError(null)
                        }}
                        className="block mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Use a different email
                    </button>
                </div>
            </AuthCard>
        )
    }

    return (
        <AuthCard title="Forgot your password?" subtitle="Enter the email you sign in with and we'll send you a link to reset it.">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setError(null)
                        }}
                        className="focus-visible:border-[var(--rsonboard-navy)] focus-visible:ring-[var(--rsonboard-navy)]/40"
                        autoFocus
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white focus-visible:ring-[var(--rsonboard-navy)]/40"
                >
                    {loading ? 'Sending...' : 'Send reset link'}
                </Button>

                <Link
                    to="/sign-in"
                    className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Back to sign in
                </Link>
            </form>
        </AuthCard>
    )
}
