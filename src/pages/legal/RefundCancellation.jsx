import LegalLayout from '@/components/legal/LegalLayout'
import Section from '@/components/legal/Section'
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/siteConfig'

export default function RefundCancellation() {
    return (
        <LegalLayout title="Refund & Cancellation Policy" updated="November 24, 2026">
            <Section title="Billing">
                <p>{PRODUCT_NAME} is billed as a monthly subscription. Payments are processed by Stripe. Pricing is set for each client organization and agreed with {COMPANY_NAME} before the subscription starts. Your subscription renews each month on the same day it started until you cancel.</p>
            </Section>
            <Section title="How to cancel">
                <p>You can cancel your subscription at any time. There is no minimum term. To cancel, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from your organization's administrator email address and tell us which organization is cancelling. We will confirm the cancellation by email.</p>
            </Section>
            <Section title="What happens after cancellation">
                <p>When you cancel, you keep access to {PRODUCT_NAME} through the end of the period you have already paid for. Your subscription will not renew after that period.</p>
                <p>After access ends, you can ask us to export or delete your organization's data by emailing us. We do not set a fixed retention period; we keep the data while your subscription is active and handle deletion requests after that.</p>
            </Section>
            <Section title="Refunds">
                <p>Subscription fees are charged monthly in advance and are not refunded for a partial month, including when you cancel part-way through a billing period. If you believe you were charged in error, email us within 30 days of the charge and we will review it and correct any mistake, including refunding the incorrect amount.</p>
            </Section>
            <Section title="Custom agreements">
                <p>If you and {COMPANY_NAME} have signed a written agreement that covers billing, cancellation or refunds, that agreement overrides this page where they differ.</p>
            </Section>
            <Section title="Contact">
                <p>Questions about billing or cancellation: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            </Section>
        </LegalLayout>
    )
}
