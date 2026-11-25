import { Navigate, useLocation } from 'react-router-dom'
import { useCompany } from '@/context/CompanyContext'

export default function BillingGate({ children }) {
    const { loading, hasAccess } = useCompany()
    const { pathname } = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!hasAccess && pathname !== '/admin/billing') {
        return <Navigate to="/admin/billing" replace />
    }

    return children
}
