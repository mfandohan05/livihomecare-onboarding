import { useEffect, useState } from 'react'
import { sendVerificationCode, verifyVerificationCode } from '@/lib/caregiver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthCard from './AuthCard'

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
        <AuthCard
            title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
            subtitle={`Verify your identity to ${imported ? 'set up your account' : 'start your onboarding'}${companyName ? ` with ${companyName}` : ''}.`}
        >
            {!codeSent ? (
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Email</Label>
                        <p className="text-sm font-medium break-all">{maskedEmail}</p>
                        <p className="text-sm text-muted-foreground">
                            We'll email a 6-digit code to this address.
                        </p>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || cooldown > 0}
                        className="w-full bg-[#0A2E73] hover:bg-[#14449C] text-white focus-visible:ring-[#08265D]/40"
                    >
                        {sending ? 'Sending...' : cooldown > 0 ? `Send me a code (${cooldown}s)` : 'Send me a code'}
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="code">Verification code</Label>
                        <Input
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
                            className="text-center tracking-[0.4em] focus-visible:border-[#08265D] focus-visible:ring-[#08265D]/40"
                            autoFocus
                            required
                        />
                        <p className="text-sm text-muted-foreground">
                            We sent a code to {maskedEmail}. It expires in 5 minutes.
                        </p>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="submit"
                        disabled={verifying || code.length !== 6}
                        className="w-full bg-[#0A2E73] hover:bg-[#14449C] text-white focus-visible:ring-[#08265D]/40"
                    >
                        {verifying ? 'Verifying...' : 'Verify'}
                    </Button>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || cooldown > 0}
                        className="block mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:hover:text-muted-foreground"
                    >
                        {sending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                    </button>
                </form>
            )}
        </AuthCard>
    )
}
