import { Link } from 'react-router-dom'
import LegalLayout, { Section } from '@/components/legal/LegalLayout'
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/siteConfig'

const TOC = [
    { id: 'billing', title: 'Billing' },
    { id: 'how-to-cancel', title: 'How to cancel' },
    { id: 'after-cancellation', title: 'What happens after cancellation' },
    { id: 'refunds', title: 'Refunds' },
    { id: 'custom-agreements', title: 'Custom agreements' },
    { id: 'contact', title: 'Contact' },
]

export default function RefundCancellation() {
    return (
        <LegalLayout
            title="Refund & Cancellation Policy"
            updated="November 24, 2026"
            intro={`This page explains how ${PRODUCT_NAME} subscriptions are billed, how to cancel, and how refunds work.`}
            toc={TOC}
        >
            <Section id="billing" title="Billing">
                <p>{PRODUCT_NAME} is billed as a monthly subscription. Payments are processed by Stripe. Pricing is set for each client organization and agreed with {COMPANY_NAME} before the subscription starts. Your subscription renews each month on the same day it started until you cancel.</p>
            </Section>
            <Section id="how-to-cancel" title="How to cancel">
                <p>You can cancel your subscription at any time. There is no minimum term. Your organization's administrator can cancel in the app under Manage, which opens Stripe's secure billing page. You can also email <a className="font-semibold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and tell us which organization is cancelling. We will confirm by email.</p>
            </Section>
            <Section id="after-cancellation" title="What happens after cancellation">
                <p>When you cancel, you keep access to {PRODUCT_NAME} through the end of the period you have already paid for. Your subscription will not renew after that period, and administrator access is limited to the billing page until you subscribe again.</p>
                <p>After access ends, you can ask us to export or delete your organization's data by emailing us. We do not set a fixed retention period beyond what our <Link to="/privacy" className="font-semibold underline">Privacy Policy</Link> describes.</p>
            </Section>
            <Section id="refunds" title="Refunds">
                <p>Subscription fees are charged monthly in advance and are not refunded for a partial month, including when you cancel part-way through a billing period. If you believe you were charged in error, email us within 30 days of the charge and we will review it and correct any mistake, including refunding the incorrect amount.</p>
            </Section>
            <Section id="custom-agreements" title="Custom agreements">
                <p>If you and {COMPANY_NAME} have signed a written agreement that covers billing, cancellation or refunds, that agreement overrides this page where they differ.</p>
            </Section>
            <Section id="contact" title="Contact">
                <p>Questions about billing or cancellation: <a className="font-semibold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            </Section>
        </LegalLayout>
    )
}
