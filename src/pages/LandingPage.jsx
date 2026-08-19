import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Building2 } from 'lucide-react'
import { APP_VERSION } from '@/version'

export default function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-lg text-center">
                <img src="/logo.png" alt="RSOnboard logo" className="w-20 h-20 object-contain mx-auto mb-4" />
                <h1 className="text-3xl font-semibold">RSOnboard</h1>
                <p className="text-sm text-muted-foreground mt-1">v{APP_VERSION}</p>

                <p className="text-muted-foreground mt-6 leading-relaxed">
                    Bringing new home care caregivers on board — onboarding paperwork, tax forms, offer letters, and
                    orientation, all in one place, so agencies can spend less time on admin and more time on care.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="bg-white border border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-[var(--primary-color)] hover:shadow-sm transition-all cursor-pointer"
                    >
                        <Building2 className="w-8 h-8 text-[var(--primary-color)]" />
                        <div>
                            <p className="font-medium">Admin</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Sign in to your company's admin portal</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/studio/login')}
                        className="bg-white border border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-[var(--primary-color)] hover:shadow-sm transition-all cursor-pointer"
                    >
                        <ShieldCheck className="w-8 h-8 text-[var(--primary-color)]" />
                        <div>
                            <p className="font-medium">Studio</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Platform administration sign in</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
