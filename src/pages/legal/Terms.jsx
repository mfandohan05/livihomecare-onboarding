import { Link } from 'react-router-dom'
import LegalLayout from '@/components/legal/LegalLayout'
import Section from '@/components/legal/Section'
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/siteConfig'

export default function Terms() {
    return (
        <LegalLayout title="Terms of Service" updated="November 24, 2026">
            <Section title="1. Who we are">
                <p>{PRODUCT_NAME} is a caregiver onboarding platform for home care organizations. It is operated by {COMPANY_NAME}, a North Carolina limited liability company ("{COMPANY_NAME}", "we", "us"). {COMPANY_NAME} is the company you contract with when you subscribe to {PRODUCT_NAME}.</p>
                <p>These terms apply to organizations that subscribe to {PRODUCT_NAME} ("clients") and to the people who use it on a client's behalf, including client administrators and the new hires and employees a client invites to complete onboarding.</p>
            </Section>
            <Section title="2. The service">
                <p>{PRODUCT_NAME} lets a client invite employees through a secure link, collect their personal information, tax and payroll forms, documents and signatures, deliver orientation and quizzes, track skills sign-offs and document expiration dates, and review progress from an admin dashboard.</p>
            </Section>
            <Section title="3. Accounts and acceptable use">
                <p>Client administrators sign in with their own credentials and are responsible for keeping them secure and for what is done under their account. Employees reach their onboarding through the link their employer sends them.</p>
                <p>You agree to use {PRODUCT_NAME} only for lawful purposes, to provide accurate information, and not to attempt to access data that belongs to another client or to disrupt the service.</p>
            </Section>
            <Section title="4. Subscriptions and billing">
                <p>{PRODUCT_NAME} is billed as a monthly subscription. Payments are processed by Stripe. Pricing is set for each client and agreed with us before the subscription starts. We do not store card numbers; they are handled by Stripe.</p>
                <p>Details on cancellation and refunds are in our <Link to="/refund-cancellation">Refund &amp; Cancellation Policy</Link>.</p>
            </Section>
            <Section title="5. Cancellation">
                <p>Clients can cancel at any time. After cancellation, access continues through the end of the period already paid for. Subscription fees are not refunded for a partial month; see the <Link to="/refund-cancellation">Refund &amp; Cancellation Policy</Link> for details.</p>
            </Section>
            <Section title="6. Client data">
                <p>Clients own the information they and their employees enter into {PRODUCT_NAME}. We process that information only to provide the service. Each client is responsible for its own obligations as an employer, including tax, employment and recordkeeping rules; {PRODUCT_NAME} does not provide legal or tax advice. How we handle personal information is described in our <Link to="/privacy">Privacy Policy</Link>.</p>
            </Section>
            <Section title="7. Custom agreements">
                <p>If a client and {COMPANY_NAME} have signed a written agreement, that agreement overrides these terms wherever the two conflict.</p>
            </Section>
            <Section title="8. Disclaimers and limits of liability">
                <p>{PRODUCT_NAME} is provided "as is" and "as available". To the extent allowed by law, {COMPANY_NAME} is not liable for indirect or consequential damages arising from use of the service.</p>
            </Section>
            <Section title="9. Changes to these terms">
                <p>We may update these terms from time to time. The "Last updated" date at the top of this page shows when they last changed. If we make a material change, we will notify clients by email at the address on their account.</p>
            </Section>
            <Section title="10. Governing law">
                <p>These terms are governed by the laws of the State of North Carolina.</p>
            </Section>
            <Section title="11. Contact">
                <p>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            </Section>
        </LegalLayout>
    )
}
