import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PasswordInput } from '@/components/ui/password-input'
import LoginShell from '@/components/auth/LoginShell'

export default function AdminLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        setError('Invalid email or password')
        setLoading(false)
        return
    }

    const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle()


    if (adminError || !adminUser) {
        await supabase.auth.signOut()
        setError('You do not have admin access')
        setLoading(false)
        return
    }

    navigate('/admin/dashboard')
}

    return (
        <LoginShell title="Administrator login" subtitle="Sign in to manage your employees.">
            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label htmlFor="email" className="text-sm font-semibold text-[var(--lr-navy)]">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@readysetonboard.com"
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
