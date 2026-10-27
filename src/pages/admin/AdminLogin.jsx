import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import companyLogo from '@/assets/logo.png'
import '@/components/marketing/marketing.css'

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
        <div className="landing-root lr-page-enter lr-surface min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--lr-text-2)] hover:text-[var(--lr-navy)]">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to sign in
                </Link>

                <div className="mb-6 flex justify-center">
                    <img src={companyLogo} alt="Ready, Set, Onboard!" width="498" height="226" className="h-16 w-auto" />
                </div>

                <main className="lr-card p-7 sm:p-9">
                    <h1 className="lr-h3 text-2xl">Administrator login</h1>
                    <p className="lr-muted mt-1 mb-6 text-[0.9375rem]">Sign in to manage your employees.</p>

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
                            <input
                                id="password"
                                type="password"
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
                </main>
            </div>
        </div>
    )
}
