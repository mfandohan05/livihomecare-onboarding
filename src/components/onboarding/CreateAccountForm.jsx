import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createCaregiverAccount } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import AuthCard from './AuthCard'
import { MAX_PASSWORD_LENGTH, meetsPasswordRules } from '@/lib/passwordPolicy'
import PasswordRequirements from './PasswordRequirements'

export default function CreateAccountForm({ token, name, email, onCreated, onExistingAccount }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [confirmError, setConfirmError] = useState(null)

    const clearErrors = () => {
        setError(null)
        setConfirmError(null)
    }

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
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            clearErrors()
                        }}
                        placeholder={`Enter your password`}
                        className="focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                        required
                    />
                    <div className="pt-1">
                        <PasswordRequirements password={password} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <PasswordInput
                        id="confirm"
                        autoComplete="new-password"
                        maxLength={MAX_PASSWORD_LENGTH}
                        value={confirm}
                        onChange={(e) => {
                            setConfirm(e.target.value)
                            clearErrors()
                        }}
                        placeholder={`Re-enter your password`}
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
                    {loading ? 'Creating account...' : 'Create account & continue'}
                </Button>
            </form>
        </AuthCard>
    )
}
