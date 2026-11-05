import Nav from '@/components/marketing/Nav'
import Hero from '@/components/marketing/Hero'
import TrustStrip from '@/components/marketing/TrustStrip'
import Showcases from '@/components/marketing/Showcases'
import Features from '@/components/marketing/Features'
import HowItWorks from '@/components/marketing/HowItWorks'
import Benefits from '@/components/marketing/Benefits'
import Contact from '@/components/marketing/Contact'
import Footer from '@/components/marketing/Footer'
import '@/components/marketing/marketing.css'

// Public marketing page. Intentionally has no Supabase calls, auth checks, or CompanyProvider dependency.
export default function Landing() {
    return (
        <div className="landing-root lr-page-enter min-h-screen">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:font-semibold focus:text-[var(--lr-navy)]">
                Skip to content
            </a>
            <Nav />
            <main id="main">
                <Hero />
                <TrustStrip />
                <Showcases />
                <Features />
                <HowItWorks />
                <Benefits />
                <Contact />
            </main>
            <Footer />
        </div>
    )
}
