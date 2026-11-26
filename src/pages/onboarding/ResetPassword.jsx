import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import AuthCard from '@/components/onboarding/AuthCard'
import { GoogleIcon, OrDivider } from '@/components/onboarding/SsoButtons'
import { MAX_PASSWORD_LENGTH, meetsPasswordRules } from '@/lib/passwordPolicy'
import PasswordRequirements from '@/components/onboarding/PasswordRequirements'

const SWITCH_KEY = 'rs_google_switch'
const SWITCH_PARAM = 'switch'

const readSwitch = () => {
    try {
        return JSON.parse(sessionStorage.getItem(SWITCH_KEY))
    } catch {
        return null
    }
}

const launchGoogle = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${window.location.origin}/reset-password?${SWITCH_PARAM}=google`,
        queryParams: { prompt: 'select_account' },
    },
})

const urlError = () => {
    const params = new URLSearchParams(window.location.search + '&' + window.location.hash.replace(/^#/, ''))
    return params.get('error_description') || params.get('error')
}

export default function ResetPassword() {
    const navigate = useNavigate()
    const [status, setStatus] = useState('checking')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState(null)
    const [confirmError, setConfirmError] = useState(null)
    const [switchError, setSwitchError] = useState(null)
    const [signInEmail, setSignInEmail] = useState(null)
    const [identities, setIdentities] = useState([])
    const started = useRef(false)

    const hasGoogle = identities.some(i => i.provider === 'google')
    const googleOnly = hasGoogle && !identities.some(i => i.provider === 'email')

    const clearErrors = () => {
        setError(null)
        setConfirmError(null)
    }

    useEffect(() => {
        if (status !== 'ready') return
        supabase.auth.getUser().then(({ data }) => setIdentities(data?.user?.identities ?? []))
    }, [status])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const tokenHash = params.get('token_hash')

        if (params.get(SWITCH_PARAM) === 'google') {
            if (started.current) return
            started.current = true

            const finishSwitch = async () => {
                const pending = readSwitch()
                const providerError = urlError()
                const { data: { session } } = await supabase.auth.getSession()
                window.history.replaceState(null, '', window.location.pathname)

                if (!pending) {
                    setStatus('invalid')
                    return
                }
                if (providerError || !session) {
                    setSwitchError('Google sign-in was cancelled or did not complete.')
                    setStatus('switch_failed')
                    return
                }

                const { data, error: invokeError } = await supabase.functions.invoke('caregiver-finish-google-switch', {
                    body: pending,
                })

                if (invokeError || !data?.success) {
                    await supabase.auth.signOut({ scope: 'local' })
                    if (data?.expired) {
                        sessionStorage.removeItem(SWITCH_KEY)
                        setStatus('invalid')
                        return
                    }
                    setSwitchError(data?.error || 'Could not switch your Google account. Please try again.')
                    setStatus('switch_failed')
                    return
                }

                sessionStorage.removeItem(SWITCH_KEY)
                toast.success(data.unchanged
                    ? 'You\'re signed in with Google.'
                    : 'Your Google account was updated. Use it to sign in from now on.')
                navigate(data.status === 'completed' ? '/my-profile' : '/onboard', { replace: true })
            }

            finishSwitch()
            return
        }

        if (tokenHash) {
            if (started.current) return
            started.current = true

            supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ data, error: verifyError }) => {
                window.history.replaceState(null, '', window.location.pathname)
                setStatus(!verifyError && data?.session ? 'ready' : 'invalid')
            })
            return
        }

        const arrivedViaLegacyLink = /type=recovery/.test(window.location.hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') setStatus('ready')
        })

        const timer = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setStatus(prev => prev === 'checking'
                ? (session && arrivedViaLegacyLink ? 'ready' : 'invalid')
                : prev)
        }, arrivedViaLegacyLink ? 2500 : 0)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [navigate])

    const handleUseGoogle = async () => {
        clearErrors()
        setGoogleLoading(true)

        const { data, error: invokeError } = await supabase.functions.invoke('caregiver-start-google-switch')
        if (invokeError || !data?.success) {
            setGoogleLoading(false)
            setError(data?.error || 'Could not continue with Google. Please try again.')
            return
        }

        sessionStorage.setItem(SWITCH_KEY, JSON.stringify({ caregiverId: data.caregiverId, proof: data.proof }))
        const { error: oauthError } = await launchGoogle()
        if (oauthError) {
            setGoogleLoading(false)
            setError('Could not continue with Google. Please try again.')
        }
    }

    const handleRetryGoogle = async () => {
        setGoogleLoading(true)
        const { error: oauthError } = await launchGoogle()
        if (oauthError) {
            setGoogleLoading(false)
            setSwitchError('Could not continue with Google. Please try again.')
        }
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
        const { data: updated, error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) {
            setLoading(false)
            setError(updateError.code === 'weak_password'
                ? 'Please meet all of the password requirements.'
                : updateError.message || 'Could not update your password. Please try again.'
            )
            return
        }

        setSignInEmail(updated?.user?.email ?? null)
        await supabase.auth.signOut()
        setLoading(false)
        setStatus('done')
    }

    if (status === 'checking') {
        return (
            <AuthCard title="Verifying your link" subtitle="One moment while we check your reset link...">
                <div className="flex justify-center py-2">
                    <div className="h-6 w-6 rounded-full border-2 border-muted border-t-[var(--rsonboard-navy)] animate-spin" />
                </div>
            </AuthCard>
        )
    }

    if (status === 'invalid') {
        return (
            <AuthCard title="Link expired" subtitle="This password reset link is invalid, has already been used, or has expired.">
                <div className="space-y-3">
                    <Button
                        onClick={() => navigate('/forgot-password', { replace: true })}
                        className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white"
                    >
                        Send a new link
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/sign-in', { replace: true })}
                        className="w-full"
                    >
                        Back to sign in
                    </Button>
                </div>
            </AuthCard>
        )
    }

    if (status === 'switch_failed') {
        return (
            <AuthCard title="Google account not changed" subtitle={switchError}>
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={googleLoading}
                        onClick={handleRetryGoogle}
                        className="w-full h-10 gap-2"
                    >
                        <GoogleIcon />
                        {googleLoading ? 'Redirecting...' : 'Choose a Google account'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            sessionStorage.removeItem(SWITCH_KEY)
                            navigate('/sign-in', { replace: true })
                        }}
                        className="w-full"
                    >
                        Back to sign in
                    </Button>
                </div>
            </AuthCard>
        )
    }

    if (status === 'done') {
        return (
            <AuthCard
                title={googleOnly ? 'Password set' : 'Password updated'}
                subtitle={googleOnly
                    ? 'You can now sign in with your email and password, or keep using Google.'
                    : 'Your password has been changed. Sign in with your new password to continue.'}
            >
                <div className="space-y-4">
                    {signInEmail && (
                        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                            <p className="text-muted-foreground">Sign in with</p>
                            <p className="font-medium break-all">{signInEmail}</p>
                        </div>
                    )}
                    <Button
                        onClick={() => navigate('/sign-in', { replace: true })}
                        className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white"
                    >
                        Sign in
                    </Button>
                </div>
            </AuthCard>
        )
    }

    return (
        <AuthCard
            title={googleOnly ? 'Set a password' : 'Choose a new password'}
            subtitle={googleOnly
                ? 'You can keep signing in with Google. A password lets you sign in with your email too.'
                : 'Enter a new password for your account'}
        >
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
                        placeholder="Enter your new password"
                        className="focus-visible:border-[var(--rsonboard-navy)] focus-visible:ring-[var(--rsonboard-navy)]/40"
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
                        placeholder="Re-enter your new password"
                        className="focus-visible:border-[var(--rsonboard-navy)] focus-visible:ring-[var(--rsonboard-navy)]/40"
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
                    disabled={loading || googleLoading}
                    className="w-full bg-[var(--rsonboard-navy)] hover:bg-[var(--rsonboard-navy-hover)] text-white focus-visible:ring-[var(--rsonboard-navy)]/40"
                >
                    {loading ? 'Saving...' : googleOnly ? 'Set password' : 'Update password'}
                </Button>
            </form>

            <div className="my-4">
                <OrDivider />
            </div>

            <Button
                type="button"
                variant="outline"
                disabled={loading || googleLoading}
                onClick={handleUseGoogle}
                className="w-full h-10 gap-2"
            >
                <GoogleIcon />
                {googleLoading ? 'Redirecting...' : hasGoogle ? 'Use a different Google account' : 'Sign in with Google instead'}
            </Button>
            <p className="mt-2 text-xs text-center text-muted-foreground">
                {hasGoogle
                    ? 'Pick any Google account. It will replace the one you sign in with now.'
                    : 'Your account will switch to Google sign-in instead of a password.'}
            </p>
        </AuthCard>
    )
}
