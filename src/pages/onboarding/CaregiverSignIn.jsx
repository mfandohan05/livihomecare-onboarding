import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getMyCaregiver } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'

export default function CaregiverSignIn() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [notice, setNotice] = useState(null)

    const handleSignIn = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setNotice(null)

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
            setError('Invalid email or password')
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

        navigate('/onboard', { replace: true })
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
            <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0A2E73] hover:bg-[#14449C] text-white focus-visible:ring-[#08265D]/40"
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
