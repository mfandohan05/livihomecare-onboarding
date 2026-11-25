import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createCaregiverAccount, clearVerificationProof, markSsoIntent, clearSsoIntent } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import AuthCard from './AuthCard'
import { MAX_PASSWORD_LENGTH, meetsPasswordRules } from '@/lib/passwordPolicy'
import PasswordRequirements from './PasswordRequirements'
import SsoButtons, { OrDivider } from './SsoButtons'

export default function CreateAccountForm({ token, proof, firstName, maskedEmail, imported, initialError, onCreated, onExistingAccount, onVerificationExpired }) {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(initialError || null)
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
        const result = await createCaregiverAccount(token, password, proof)

        if (!result?.success) {
            setLoading(false)
            if (result?.verificationRequired) {
                clearVerificationProof(token)
                onVerificationExpired()
                return
            }
            if (result?.alreadyExists) {
                onExistingAccount()
                return
            }
            setError(result?.error || 'Could not create your account. Please try again.')
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email: result.email, password })
        if (signInError) {
            setLoading(false)
            setError('Your account was created, but we could not sign you in. Please use the sign in page.')
            return
        }

        onCreated()
    }

    return (
        <AuthCard
            title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
            subtitle={imported
                ? "Create your account to manage your profile, documents and trainings. You'll use it to sign back in any time."
                : "Create your account to begin onboarding. You'll use it to sign back in any time."}
        >
            <SsoButtons
                redirectTo={`${window.location.origin}/onboard/${token}`}
                disabled={loading}
                onStart={() => markSsoIntent(token)}
                onError={(message) => {
                    clearSsoIntent(token)
                    setError(message)
                }}
            />
            <div className="my-4">
                <OrDivider />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="text" value={maskedEmail} disabled readOnly />
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
