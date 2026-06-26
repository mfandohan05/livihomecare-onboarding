import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Users, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { job_label } from '@/lib/labelUtils'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
    })
    const [recentCaregivers, setRecentCaregivers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { data: caregivers } = await supabase
                .from('caregivers')
                .select('*')
                .order('created_at', { ascending: false })

            if (caregivers) {
                setStats({
                    total: caregivers.length,
                    pending: caregivers.filter(c => c.status === 'pending').length,
                    inProgress: caregivers.filter(c => c.status === 'in_progress').length,
                    completed: caregivers.filter(c => c.status === 'completed').length,
                    cancelled: caregivers.filter(c => c.status === 'cancelled').length,
                })
                const nonCancelledCaregivers = caregivers.filter(c => c.status !== 'cancelled')
                setRecentCaregivers(nonCancelledCaregivers.slice(0, 5))
            }

            setLoading(false)
        }
        fetchData()
    }, [])

    const statusColor = (status) => {
        if (status === 'completed') return 'text-[#577C09] bg-[#E8F0D0]'
        if (status === 'in_progress') return 'text-amber-700 bg-amber-50'
        return 'text-muted-foreground bg-muted'
    }

    const statusLabel = (status) => {
        if (status === 'completed') return 'Completed'
        if (status === 'in_progress') return 'In Progress'
        return 'Pending'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your employees and onboarding</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Employees Enrolled', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-muted-foreground bg-muted' },
                    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-[#577C09] bg-[#E8F0D0]' },
                    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-600 bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-border p-6">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-border">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-semibold">Recent Employees</h2>
                    <button
                        onClick={() => navigate('/admin/employees')}
                        className="text-sm text-[#577C09] hover:underline"
                    >
                        View all
                    </button>
                </div>
                <div className="divide-y divide-border">
                    {recentCaregivers.length === 0 ? (
                        <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                            No caregivers yet. Add your first caregiver to get started.
                        </div>
                    ) : (
                        recentCaregivers.map((caregiver) => (
                            <div
                                key={caregiver.id}
                                onClick={() => navigate(`/admin/employees/${caregiver.id}`)}
                                className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#577C09] flex items-center justify-center text-white text-sm font-medium">
                                        {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{caregiver.name}</p>
                                        <p className="text-xs text-muted-foreground"><span className='capitalize'>{job_label(caregiver.role)}</span> · {(caregiver.email).toLowerCase()}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(caregiver.status)}`}>
                                    {statusLabel(caregiver.status)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}