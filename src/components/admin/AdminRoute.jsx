import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AdminRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session) {
                setLoading(false)
                return
            }

            const { data: adminUser } = await supabase
                .from('admin_users')
                .select('id')
                .eq('id', session.user.id)
                .single()

            setIsAdmin(!!adminUser)
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

    if (!isAdmin) return <Navigate to="/admin/login" />
    return children
}