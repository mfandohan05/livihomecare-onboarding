import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import Footer from '@/components/marketing/Footer'
import { PRODUCT_LINE } from '@/lib/siteConfig'
import '@/components/marketing/marketing.css'

export default function LegalLayout({ title, updated, children }) {
    return (
        <div className="landing-root lr-page-enter min-h-screen">
            <header className="border-b border-[var(--lr-line)] bg-white">
                <div className="lr-container flex h-[72px] items-center justify-between gap-3">
                    <Link to="/" aria-label="Ready, Set, Onboard! home">
                        <img src={logo} alt="Ready, Set, Onboard!" width="498" height="226" className="h-11 w-auto" />
                    </Link>
                    <Link to="/" className="lr-btn lr-btn-tonal lr-btn-sm">Back to home</Link>
                </div>
            </header>
            <main id="main" className="lr-container max-w-3xl py-12 lg:py-16">
                <p className="lr-caption font-medium">{PRODUCT_LINE}</p>
                <h1 className="lr-h2 mt-3">{title}</h1>
                <p className="lr-caption mt-2">Last updated: {updated}</p>
                <div className="mt-8 grid gap-8 [&_a]:font-semibold [&_a]:text-[var(--lr-navy)] [&_a]:underline [&_h2]:text-[var(--lr-navy)] [&_li]:mt-1 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    )
}
