import { Link } from 'react-router-dom'
import LegalLayout from '@/components/legal/LegalLayout'
import Section from '@/components/legal/Section'
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/siteConfig'

export default function Privacy() {
    return (
        <LegalLayout title="Privacy Policy" updated="November 24, 2026">
            <Section title="1. Who we are">
                <p>{PRODUCT_NAME} is a caregiver onboarding platform for home care organizations. It is operated by {COMPANY_NAME}, a North Carolina limited liability company. {COMPANY_NAME} is the company responsible for this policy.</p>
                <p>In most cases a home care organization (a "client") uses {PRODUCT_NAME} to onboard its own employees. The client decides what information it asks for, and {COMPANY_NAME} handles that information on the client's behalf to run the service.</p>
            </Section>
            <Section title="2. Information we collect">
                <p><strong>New hires and employees</strong> (entered by the employee, or by the client's admin):</p>
                <ul>
                    <li>Name, home address, phone numbers and email address.</li>
                    <li>Emergency contacts: names, addresses, phone numbers, email addresses and relationship.</li>
                    <li>Social Security number, date of birth and, where applicable, EIN.</li>
                    <li>Bank name, routing number, account number and account type, for direct deposit.</li>
                    <li>Tax and employment forms and the information on them, signatures, and signed offer letters and other documents.</li>
                    <li>Documents the employee uploads, and their expiration dates.</li>
                    <li>Onboarding progress, orientation and quiz activity, and the time spent on each onboarding step.</li>
                    <li>An approximate location (latitude and longitude) worked out from the home address the employee enters. It is not collected from a device's location sensor.</li>
                </ul>
                <p><strong>Client administrators:</strong> email address and sign-in credentials, and a record of actions taken in the admin dashboard (an audit log that includes the admin's email and the action).</p>
                <p><strong>Clients (organizations):</strong> company name, branding, support email and subscription status.</p>
                <p><strong>People who contact us:</strong> name, work email, company name, optional phone number and message submitted through the contact form on our website.</p>
            </Section>
            <Section title="3. How we use information">
                <ul>
                    <li>To provide {PRODUCT_NAME}: complete and generate onboarding forms and documents, track progress, and let a client's admins review submissions.</li>
                    <li>To send emails related to onboarding, such as invitations, completion notices, document copies and document expiration reminders.</li>
                    <li>To respond to inquiries and to bill clients.</li>
                    <li>To keep an audit log of activity in the service.</li>
                </ul>
            </Section>
            <Section title="4. Where information is stored and who processes it">
                <p>Our website is hosted on Vercel. Information is stored in our Supabase project, which provides the database, user sign-in, file storage and server functions for {PRODUCT_NAME}. Uploaded documents and generated PDFs are kept in Supabase file storage. Social Security numbers, dates of birth, EINs and bank details are encrypted before they are stored.</p>
                <p>We use these other service providers to run the service:</p>
                <ul>
                    <li><strong>Stripe</strong>, the payment processor for subscriptions. See the next section.</li>
                    <li><strong>Resend</strong>, to send emails.</li>
                    <li><strong>Mapbox</strong>, for address suggestions and to work out the approximate location from an address.</li>
                    <li><strong>Formspree</strong>, to deliver messages sent through our website contact form.</li>
                </ul>
            </Section>
            <Section title="5. Payments">
                <p>Subscription payments are processed by Stripe. We do not store card numbers. When a client subscribes, we create a Stripe customer record containing the client's company name and an admin's email address, and we keep the Stripe customer and subscription identifiers and the subscription status.</p>
                <p>Stripe handles payment details under its own privacy policy.</p>
            </Section>
            <Section title="6. Sharing">
                <p>We share information with the service providers listed above only as needed to run {PRODUCT_NAME}. A client's administrators can see the information that client's employees submit. We do not sell personal information.</p>
            </Section>
            <Section title="7. Retention and deletion">
                <p>We do not set a fixed retention period. We keep information while a client's subscription is active. A client or an employee can ask us to delete information by emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, and we will handle the request with the client concerned.</p>
            </Section>
            <Section title="8. Security">
                <p>Access to client data is restricted by sign-in, and sensitive fields are encrypted before storage as described above. No system can be guaranteed to be completely secure.</p>
            </Section>
            <Section title="9. Your choices">
                <p>Employees should contact their employer to correct or ask about the information in their onboarding. You can also ask us to access, correct or delete your information by emailing <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            </Section>
            <Section title="10. Children">
                <p>{PRODUCT_NAME} is intended for employees of home care organizations and is not directed at children.</p>
            </Section>
            <Section title="11. Changes to this policy">
                <p>We may update this policy. The "Last updated" date at the top shows when it last changed. See also our <Link to="/terms">Terms of Service</Link>.</p>
            </Section>
            <Section title="12. Contact">
                <p>{COMPANY_NAME}: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            </Section>
        </LegalLayout>
    )
}
