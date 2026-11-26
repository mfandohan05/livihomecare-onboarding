import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/ui/password-input'
import LoginShell from '@/components/auth/LoginShell'

export default function StudioLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
            setError('Invalid email or password')
            setLoading(false)
            return
        }

        const { data: whoami, error: whoamiError } = await supabase.functions.invoke('studio-whoami', {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
        })

        if (whoamiError || !whoami?.ok) {
            await supabase.auth.signOut()
            setError('You do not have Studio access')
            setLoading(false)
            return
        }

        navigate('/studio/companies')
    }

    return (
        <LoginShell title="Studio login" subtitle="Sign in to platform administration.">
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-[var(--lr-navy)]">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="lr-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="text-sm font-semibold text-[var(--lr-navy)]">Password</label>
                    <PasswordInput
                        as="input"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="lr-input"
                        required
                    />
                </div>

                {error && <p role="alert" className="lr-error">{error}</p>}

                <button type="submit" disabled={loading} className="lr-btn lr-btn-primary w-full">
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </LoginShell>
    )
}
