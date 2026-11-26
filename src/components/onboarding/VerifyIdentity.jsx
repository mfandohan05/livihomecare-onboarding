import { useEffect, useState } from 'react'
import { sendVerificationCode, verifyVerificationCode } from '@/lib/caregiver'
import LoginShell from '@/components/auth/LoginShell'

export default function VerifyIdentity({ token, firstName, companyName, maskedEmail, imported, onVerified }) {
    const [codeSent, setCodeSent] = useState(false)
    const [code, setCode] = useState('')
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (cooldown <= 0) return
        const id = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(id)
    }, [cooldown])

    const handleSend = async () => {
        setSending(true)
        setError(null)
        const result = await sendVerificationCode(token)
        setSending(false)

        if (!result?.success) {
            if (result?.retryAfter) setCooldown(result.retryAfter)
            setError(result?.error || 'We could not send the code. Please try again.')
            return
        }

        setCode('')
        setCodeSent(true)
        setCooldown(30)
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setVerifying(true)
        setError(null)
        const result = await verifyVerificationCode(token, code)
        setVerifying(false)

        if (!result?.success) {
            setError(result?.error || 'Could not verify the code. Please try again.')
            if (result?.attemptsRemaining === 0) {
                setCodeSent(false)
                setCode('')
            }
            return
        }

        onVerified(result.proof)
    }

    return (
        <LoginShell
            backTo={null}
            title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
            subtitle={`Verify your identity to ${imported ? 'set up your account' : 'start your onboarding'}${companyName ? ` with ${companyName}` : ''}.`}
        >
            {!codeSent ? (
                <div className="space-y-5">
                    <div>
                        <p className="text-sm font-semibold text-[var(--lr-navy)]">Email</p>
                        <p className="mt-1 break-all font-medium text-[var(--lr-text)]">{maskedEmail}</p>
                        <p className="lr-muted mt-1 text-sm">We'll email a 6-digit code to this address.</p>
                    </div>

                    {error && <p role="alert" className="lr-error">{error}</p>}

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || cooldown > 0}
                        className="lr-btn lr-btn-primary w-full"
                    >
                        {sending ? 'Sending...' : cooldown > 0 ? `Send me a code (${cooldown}s)` : 'Send me a code'}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-5">
                    <div>
                        <label htmlFor="code" className="text-sm font-semibold text-[var(--lr-navy)]">Verification code</label>
                        <input
                            id="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.replace(/\D/g, ''))
                                setError(null)
                            }}
                            placeholder="123456"
                            className="lr-input text-center tracking-[0.4em]"
                            autoFocus
                            required
                        />
                        <p className="lr-muted mt-2 text-sm">We sent a code to {maskedEmail}. It expires in 5 minutes.</p>
                    </div>

                    {error && <p role="alert" className="lr-error">{error}</p>}

                    <button
                        type="submit"
                        disabled={verifying || code.length !== 6}
                        className="lr-btn lr-btn-primary w-full"
                    >
                        {verifying ? 'Verifying...' : 'Verify'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || cooldown > 0}
                        className="mx-auto block text-sm font-medium text-[var(--lr-text-2)] hover:text-[var(--lr-navy)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[var(--lr-text-2)]"
                    >
                        {sending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </button>
                </form>
            )}
        </LoginShell>
    )
}
