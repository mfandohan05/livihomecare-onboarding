import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createCaregiverAccount } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from './AuthCard'

const MIN_PASSWORD_LENGTH = 8

export default function CreateAccountForm({ token, name, email, onCreated, onExistingAccount }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

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
        const result = await createCaregiverAccount(token, password)

        if (!result?.success) {
            setLoading(false)
            if (result?.alreadyExists) {
                onExistingAccount()
                return
            }
            setError(result?.error || 'Could not create your account. Please try again.')
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
            setLoading(false)
            setError('Your account was created, but we could not sign you in. Please use the sign in page.')
            return
        }

        onCreated()
    }

    return (
        <AuthCard
            title={name ? `Welcome, ${name.split(' ')[0]}` : 'Welcome'}
            subtitle="Create your account to begin onboarding. You'll use it to sign back in any time."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled readOnly />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
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
                    <Label htmlFor="confirm">Confirm password</Label>
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
                    {loading ? 'Creating account...' : 'Create account & continue'}
                </Button>
            </form>
        </AuthCard>
    )
}
