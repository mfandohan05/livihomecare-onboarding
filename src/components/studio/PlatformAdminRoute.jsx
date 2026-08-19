import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function PlatformAdminRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase.functions.invoke('studio-whoami', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            })

            setIsPlatformAdmin(!error && !!data?.ok)
            setLoading(false)
        }
        checkAuth()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!isPlatformAdmin) return <Navigate to="/studio/login" />
    return children
}
