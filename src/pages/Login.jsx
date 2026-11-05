import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, UserRound, ChevronRight } from 'lucide-react'
import logo from '@/assets/logo.png'
import { APP_VERSION } from '@/version'
import '@/components/marketing/marketing.css'

const OPTIONS = [
    {
        to: '/admin/login', icon: Building2, tile: 'navy', title: 'Administrator login',
        body: "Sign in to your company's admin portal to manage your employees.",
    },
    {
        // Employees normally arrive through the secure link they were sent; /sign-in is for returning to an account they already created.
        to: '/sign-in', icon: UserRound, tile: 'teal', title: 'Employee login',
        body: 'Continue your onboarding. First time here? Use the secure link your employer emailed or texted you.',
    },
]

export default function Login() {
    return (
        <div className="landing-root lr-page-enter lr-surface flex min-h-screen flex-col">
            <header className="lr-container flex h-[72px] items-center">
                <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--lr-text-2)] hover:bg-white hover:text-[var(--lr-navy)]">
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
                </Link>
            </header>

            <main className="lr-container flex flex-1 flex-col items-center justify-center pb-16 pt-4 text-center">
                <img src={logo} alt="Ready, Set, Onboard!" width="498" height="226" className="h-20 w-auto" />
                <h1 className="lr-h2 mt-6 max-w-xl">Sign in to Ready, Set, Onboard!</h1>
                <p className="lr-lead mt-3 max-w-md">Choose how you would like to sign in.</p>

                <ul className="mt-10 grid w-full max-w-3xl gap-5 text-left sm:grid-cols-2">
                    {OPTIONS.map(({ to, icon: Icon, tile, title, body }) => (
                        <li key={to}>
                            <Link to={to} className="lr-card lr-lift group flex h-full flex-col p-7">
                                <span className={`lr-tile lr-tile-${tile}`}><Icon className="size-6" aria-hidden="true" /></span>
                                <h2 className="lr-h3 mt-5">{title}</h2>
                                <p className="lr-muted mt-2 flex-1 text-[0.9375rem]">{body}</p>
                                <span className="mt-5 inline-flex items-center gap-1 font-semibold text-[var(--lr-navy)]">
                                    Continue <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <p className="lr-caption mt-8">
                    <Link to="/studio/login" className="underline underline-offset-4 hover:text-[var(--lr-navy)]">Platform admin (Studio)</Link>
                    <span aria-hidden="true"> &middot; </span>v{APP_VERSION}
                </p>
            </main>
        </div>
    )
}
