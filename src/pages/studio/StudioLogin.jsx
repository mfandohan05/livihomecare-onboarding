import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import companyLogo from '@/assets/logo.png'

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
        <div className="studio-theme min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </button>

                <div className="flex justify-center mb-8">
                    <img src={companyLogo} alt="Ready, Set, Onboard!" className="w-[200px]" />
                </div>

                <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl font-semibold mb-1">Studio</h1>
                    <p className="text-sm text-muted-foreground mb-6">Platform administration sign in</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
