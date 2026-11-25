import { Link } from 'react-router-dom'
import LegalLayout, { Section, List } from '@/components/legal/LegalLayout'

const CONTACT_EMAIL = 'mlftechnologiesllc@gmail.com'

const TOC = [
    { id: 'acceptance', title: 'Acceptance of these terms' },
    { id: 'service', title: 'The Service' },
    { id: 'accounts', title: 'Accounts and sign-in' },
    { id: 'employees', title: 'Terms for employees' },
    { id: 'customers', title: 'Terms for employers' },
    { id: 'acceptable-use', title: 'Acceptable use' },
    { id: 'electronic', title: 'Electronic signatures and records' },
    { id: 'messages', title: 'Emails and text messages' },
    { id: 'third-party', title: 'Third-party services' },
    { id: 'ip', title: 'Intellectual property' },
    { id: 'privacy', title: 'Privacy' },
    { id: 'disclaimers', title: 'Disclaimers' },
    { id: 'liability', title: 'Limitation of liability' },
    { id: 'indemnity', title: 'Indemnification' },
    { id: 'termination', title: 'Suspension and termination' },
    { id: 'law', title: 'Governing law' },
    { id: 'changes', title: 'Changes to these terms' },
    { id: 'contact', title: 'Contact us' },
]

export default function TermsOfService() {
    return (
        <LegalLayout
            title="Terms of Service"
            updated="November 23, 2026"
            intro="These terms govern your use of Ready, Set, Onboard!, including our website, the employee onboarding portal and the administrator tools. Please read them carefully."
            toc={TOC}
        >
            <Section id="acceptance" title="Acceptance of these terms">
                <p>
                    Ready, Set, Onboard! (the “Service”) is operated by MLF Technologies LLC (“we”, “us”). By accessing or using the Service you agree to these Terms of Service and to our <Link to="/privacy" className="font-semibold underline">Privacy Policy</Link>. If you do not agree, do not use the Service. If you use the Service on behalf of an organization, you confirm you have authority to bind it.
                </p>
            </Section>

            <Section id="service" title="The Service">
                <p>
                    The Service is employee onboarding software for home care agencies and other employers (“Customers”). It lets a Customer invite new hires, collect documents and personal information, deliver orientation and training, prepare and sign forms such as the I-9, W-4, W-9 and offer letters, and track compliance.
                </p>
                <p>
                    The Service helps organize paperwork. It is not legal, tax, employment or immigration advice, and the Customer, not us, is responsible for the content of its forms and policies and for its compliance with applicable law.
                </p>
            </Section>

            <Section id="accounts" title="Accounts and sign-in">
                <List items={[
                    'Employees access the Service through a personal invitation from their employer. Invitation links are private and expire; do not share yours.',
                    'You may sign in with an email and password or, where offered, with your Google account. Signing in with Google is subject to Google’s own terms, and we receive only the basic profile details described in the Privacy Policy.',
                    'You must provide accurate information, keep your credentials confidential, and tell us promptly if you suspect unauthorized use. You are responsible for activity under your account.',
                    'Administrator accounts are for authorized staff of the Customer only and must not be shared.',
                ]} />
            </Section>

            <Section id="employees" title="Terms for employees">
                <List items={[
                    'You agree that the information and documents you provide are true, accurate and your own, and that you will keep them current. Knowingly providing false information, including false identity or work-authorization documents, may have legal consequences and may end your employment opportunity.',
                    'Your employer, not us, decides what is collected, how it is used for employment purposes, and how long it is kept. Your employment relationship is solely between you and your employer.',
                    'Time spent in onboarding may be recorded for your employer’s use. How, and whether, it is paid is determined by your employer.',
                    'Using the Service does not create an employment relationship with us.',
                ]} />
            </Section>

            <Section id="customers" title="Terms for employers">
                <List items={[
                    'You are responsible for your administrators’ use of the Service, for the lawful basis and notices needed to collect employee data, and for the accuracy and legality of your forms, templates, policies and orientation content.',
                    'You are responsible for your own legal retention and deletion obligations, including for Form I-9 and payroll records, and for exporting records you need to keep.',
                    'You must handle information you view or download, including Social Security numbers and bank details, securely and only for legitimate employment purposes.',
                    'You must obtain required consent before sending text messages to employees, and honor opt-outs.',
                    'You will not use the Service to make decisions that unlawfully discriminate, and you remain solely responsible for your hiring decisions.',
                    'Fees, term and any service levels are set out in your order form or separate agreement with us. If those conflict with these terms, the agreement with us controls.',
                ]} />
            </Section>

            <Section id="acceptable-use" title="Acceptable use">
                <p>You agree not to:</p>
                <List items={[
                    'Access records that are not yours or that you are not authorized to view, or attempt to bypass access controls.',
                    'Probe, scan or test the Service’s security without our written permission, or interfere with its operation, including by automated or excessive requests.',
                    'Upload malware, unlawful content or anything you lack the right to share.',
                    'Impersonate another person or misrepresent your identity or affiliation.',
                    'Copy, reverse engineer, resell or build a competing product from the Service, except as the law allows.',
                    'Use the Service to harass others or to send unsolicited messages.',
                ]} />
            </Section>

            <Section id="electronic" title="Electronic signatures and records">
                <p>
                    You agree to do business electronically. When you sign a form or agreement in the Service by typing or drawing your signature, you intend that signature to be legally binding to the same extent as a handwritten one under the federal E-SIGN Act and applicable state electronic-signature laws. You agree that electronic copies of documents and our records of your signing, including date and time, may be used as evidence. You may ask your employer for a paper copy of any document you signed.
                </p>
            </Section>

            <Section id="messages" title="Emails and text messages">
                <p>
                    The Service sends emails such as invitations, verification codes, reminders and notices. If you give your mobile number and consent, your employer may send you text messages through the Service. Message frequency varies, and message and data rates may apply. Reply STOP to opt out or START to opt back in. Consent to texts is not a condition of employment unless your employer states otherwise.
                </p>
            </Section>

            <Section id="third-party" title="Third-party services">
                <p>
                    The Service relies on third parties such as Google, Supabase, Vercel, Resend, Twilio, Mapbox and Formspree. We are not responsible for third-party services, and your use of them may be governed by their own terms. Links to other sites are provided for convenience only.
                </p>
            </Section>

            <Section id="ip" title="Intellectual property">
                <p>
                    We and our licensors own the Service, including its software, design, text and trademarks. We grant you a limited, non-exclusive, non-transferable, revocable right to use the Service as intended. Customers keep ownership of the content they and their employees submit, and grant us a limited license to host, process and display it solely to provide the Service. If you send us feedback, we may use it without obligation to you.
                </p>
            </Section>

            <Section id="privacy" title="Privacy">
                <p>
                    Our <Link to="/privacy" className="font-semibold underline">Privacy Policy</Link> describes what we collect and how we use it, including data we receive through Google sign-in. It is part of these terms.
                </p>
            </Section>

            <Section id="disclaimers" title="Disclaimers">
                <p>
                    The Service is provided “as is” and “as available”. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, title and non-infringement. We do not warrant that the Service will be uninterrupted, error-free or free of harmful components, or that forms generated by the Service meet every legal requirement for a given employer or jurisdiction.
                </p>
            </Section>

            <Section id="liability" title="Limitation of liability">
                <p>
                    To the fullest extent permitted by law, we will not be liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill, arising from or related to the Service. Our total liability for any claim relating to the Service will not exceed the greater of the amount you paid us for the Service in the twelve months before the claim or one hundred U.S. dollars. Some jurisdictions do not allow certain limitations, so some of this may not apply to you.
                </p>
            </Section>

            <Section id="indemnity" title="Indemnification">
                <p>
                    Customers will defend and indemnify us against third-party claims arising from the Customer’s content, its use of the Service in violation of these terms or law, or its employment decisions and practices.
                </p>
            </Section>

            <Section id="termination" title="Suspension and termination">
                <p>
                    You may stop using the Service at any time. We may suspend or end access if you breach these terms, if needed to protect the Service or other users, or if required by law. Provisions that by their nature should survive termination will survive, including ownership, disclaimers, limitation of liability and indemnification.
                </p>
            </Section>

            <Section id="law" title="Governing law">
                <p>
                    These terms are governed by the laws of the State of North Carolina, without regard to conflict-of-law rules. You agree to the exclusive jurisdiction of the state and federal courts located in North Carolina for any dispute, except where the law requires otherwise.
                </p>
            </Section>

            <Section id="changes" title="Changes to these terms">
                <p>
                    We may update these terms. We will post the new version here with a new “Last updated” date and, for material changes, notify Customers or users. Continued use after changes take effect means you accept them.
                </p>
            </Section>

            <Section id="contact" title="Contact us">
                <p>
                    MLF Technologies LLC<br />
                    Email: <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
            </Section>
        </LegalLayout>
    )
}
