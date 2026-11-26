import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createCaregiverAccount, clearVerificationProof, markSsoIntent, clearSsoIntent } from '@/lib/caregiver'
import { PasswordInput } from '@/components/ui/password-input'
import LoginShell from '@/components/auth/LoginShell'
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
        <LoginShell
            backTo={null}
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
            <div className="my-5">
                <OrDivider />
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-[var(--lr-navy)]">Email</label>
                    <input id="email" type="text" value={maskedEmail} disabled readOnly className="lr-input" />
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-semibold text-[var(--lr-navy)]">Password</label>
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
                        placeholder="Enter your password"
                        className="lr-input"
                        required
                    />
                    <div className="pt-3">
                        <PasswordRequirements password={password} />
                    </div>
                </div>
                <div>
                    <label htmlFor="confirm" className="text-sm font-semibold text-[var(--lr-navy)]">Confirm password</label>
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
                        placeholder="Re-enter your password"
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
                    {loading ? 'Creating account...' : 'Create account & continue'}
                </button>
            </form>
        </LoginShell>
    )
}
