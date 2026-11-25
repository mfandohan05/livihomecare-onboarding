import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { SUPPORT_EMAIL } from '@/lib/siteConfig'

const INCLUDED = [
    'Secure onboarding links for each new hire',
    'Guided onboarding portal with a step-by-step checklist',
    'Pre-filled tax and payroll forms and e-signatures',
    'Offer letters, orientation modules and quizzes',
    'Competency checklists and document expiration tracking',
    'Company branding and role-based steps',
    'Admin dashboard with progress, time tracking and audit logs',
]

export default function Pricing() {
    return (
        <section id="pricing" aria-labelledby="pricing-heading" className="lr-section">
            <div className="lr-container grid gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                    <h2 id="pricing-heading" className="lr-h2">Pricing tailored to your organization.</h2>
                    <p className="lr-lead mt-5">
                        RSOnboard is a caregiver onboarding platform for home care organizations. It is billed as a monthly subscription, with pricing tailored to each organization. You can cancel anytime and keep access through the end of the period you have paid for.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a href="#contact" className="lr-btn lr-btn-primary">Request a quote</a>
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[var(--lr-navy)] underline">{SUPPORT_EMAIL}</a>
                    </div>
                    <p className="lr-caption mt-4">
                        See our <Link to="/refund-cancellation" className="underline">Refund &amp; Cancellation Policy</Link>.
                    </p>
                </div>
                <div className="lr-card p-7">
                    <h3 className="lr-h3">What a subscription includes</h3>
                    <ul className="mt-5 grid gap-3">
                        {INCLUDED.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                                <Check className="mt-1 size-4 shrink-0 text-[var(--lr-teal)]" aria-hidden="true" />
                                <span className="lr-muted">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
