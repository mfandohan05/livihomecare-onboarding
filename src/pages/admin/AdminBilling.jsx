import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useCompany } from '@/context/CompanyContext'

const STATUS_LABELS = {
    none: 'No subscription',
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    unpaid: 'Unpaid',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    paused: 'Paused',
}

const statusStyle = (status) => {
    if (status === 'active' || status === 'trialing') return 'bg-[#E8F0D0] text-[#577C09] border-[#577C09]/20'
    if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'bg-amber-50 text-amber-700 border-amber-200'
    if (status === 'canceled' || status === 'incomplete_expired') return 'bg-red-50 text-red-700 border-red-200'
    return 'bg-muted text-muted-foreground border-border'
}

const formatDate = (iso) => {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AdminBilling() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { companyName, refreshSubscription } = useCompany()
    const [isOwner, setIsOwner] = useState(true)
    const [checkingRole, setCheckingRole] = useState(true)
    const [loading, setLoading] = useState(true)
    const [billing, setBilling] = useState(null)
    const [working, setWorking] = useState(false)

    const loadStatus = useCallback(async () => {
        const { data, error } = await supabase.functions.invoke('billing-get-status')
        if (error || data?.error) {
            toast.error('Could not load billing details')
        } else {
            setBilling(data)
        }
        setLoading(false)
        return data
    }, [])

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { navigate('/admin/login'); return }

            const { data } = await supabase
                .from('admin_users')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (data?.role !== 'superadmin') {
                setIsOwner(false)
                setLoading(false)
            }
            setCheckingRole(false)
        }
        checkRole()
    }, [navigate])

    useEffect(() => {
        if (checkingRole || !isOwner) return

        const checkout = searchParams.get('checkout')
        let cancelled = false

        const run = async () => {
            if (checkout === 'cancelled') {
                toast.info('Checkout was cancelled')
                setSearchParams({}, { replace: true })
            }

            const data = await loadStatus()

            if (checkout === 'success') {
                setSearchParams({}, { replace: true })
                if (data?.status === 'active' || data?.status === 'trialing') {
                    toast.success('Subscription started')
                    await refreshSubscription()
                    navigate('/admin/dashboard', { replace: true })
                    return
                }
                toast.success('Payment received. Confirming your subscription...')
                for (let i = 0; i < 6 && !cancelled; i++) {
                    await new Promise((r) => setTimeout(r, 2000))
                    const next = await loadStatus()
                    if (next?.status === 'active' || next?.status === 'trialing') {
                        await refreshSubscription()
                        navigate('/admin/dashboard', { replace: true })
                        break
                    }
                }
            }
        }
        run()

        return () => { cancelled = true }
    }, [checkingRole, isOwner])

    const goToStripe = async (functionName, errorMessage) => {
        setWorking(true)
        const { data, error } = await supabase.functions.invoke(functionName)
        if (error || data?.error || !data?.url) {
            toast.error(data?.error || errorMessage)
            setWorking(false)
            return
        }
        window.location.href = data.url
    }

    if (checkingRole) return null

    if (!isOwner) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Subscription required</h1>
                    <p className="text-sm text-muted-foreground mt-1">{companyName || 'Your organization'} does not have an active subscription.</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-6 max-w-2xl">
                    <p className="text-sm">Ask your organization's account owner (the superadmin) to sign in and subscribe. Access is restored as soon as the subscription is active.</p>
                </div>
            </div>
        )
    }

    const status = billing?.status || 'none'
    const isSubscribed = status === 'active' || status === 'trialing' || status === 'past_due' || status === 'unpaid'
    const periodEnd = formatDate(billing?.currentPeriodEnd)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Manage</h1>
                <p className="text-sm text-muted-foreground mt-1">Billing for {companyName || 'your program'}</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-6 space-y-6 max-w-2xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--secondary-bg)] text-[var(--primary-color)] flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium">RSOnboard subscription</p>
                        <p className="text-sm text-muted-foreground">Billed monthly. Pricing is set for your organization.</p>
                    </div>
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle(status)}`}>
                            {STATUS_LABELS[status] || status}
                        </span>
                    )}
                </div>

                {!loading && periodEnd && isSubscribed && (
                    <p className="text-sm text-muted-foreground">Current period ends {periodEnd}</p>
                )}

                {!loading && status === 'past_due' && (
                    <p className="text-sm text-amber-700">Your last payment failed. Update your payment method in Stripe to keep your subscription active.</p>
                )}

                {!loading && (
                    <div className="flex flex-wrap gap-3">
                        {isSubscribed || billing?.hasCustomer ? (
                            <Button
                                disabled={working}
                                onClick={() => goToStripe('billing-create-portal-session', 'Could not open billing portal')}
                                className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white"
                            >
                                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                Manage billing in Stripe
                            </Button>
                        ) : null}
                        {!isSubscribed && (
                            <Button
                                disabled={working}
                                onClick={() => goToStripe('billing-create-checkout-session', 'Could not start checkout')}
                                variant={billing?.hasCustomer ? 'outline' : 'default'}
                                className={billing?.hasCustomer ? '' : 'bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white'}
                            >
                                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                Subscribe
                            </Button>
                        )}
                    </div>
                )}

                {!loading && status !== 'active' && status !== 'trialing' && (
                    <p className="text-sm text-muted-foreground">Your admin tools are locked until your subscription is active. Everything unlocks as soon as payment is confirmed.</p>
                )}

                <p className="text-xs text-muted-foreground">Payments are processed by Stripe. Invoices, receipts, payment methods and cancellation are managed on Stripe's secure pages.</p>
            </div>
        </div>
    )
}
