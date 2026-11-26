import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import companyLogo from '@/assets/logo.png'
import '@/components/marketing/marketing.css'

export default function LoginShell({ title, subtitle, children }) {
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
                    <h1 className="lr-h3 text-2xl">{title}</h1>
                    <p className="lr-muted mt-1 mb-6 text-[0.9375rem]">{subtitle}</p>
                    {children}
                </main>
            </div>
        </div>
    )
}
