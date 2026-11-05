import { Check, CheckCircle2, Clock3, AlertCircle, PenLine } from 'lucide-react'

function FormsMock() {
    const fields = [
        ['First name and middle initial', 'Maria T.'],
        ['Last name', 'Santos'],
        ['Address', '214 Maple Court'],
        ['Filing status', 'Single'],
    ]
    return (
        <figure className="lr-mock p-6 sm:p-7" role="img" aria-label="Illustration of a W-4 tax form with the employee's details already filled in.">
            <div aria-hidden="true">
                <div className="flex items-baseline justify-between gap-3 border-b-2 border-[var(--lr-navy)] pb-2">
                    <p className="text-lg font-bold text-[var(--lr-navy)]">Form W-4</p>
                    <p className="lr-caption">Filled from the employee's answers</p>
                </div>
                <dl className="mt-5 space-y-4">
                    {fields.map(([k, v]) => (
                        <div key={k}>
                            <dt className="lr-caption">{k}</dt>
                            <dd className="mt-1 border-b border-[var(--lr-line)] pb-1.5"><span className="lr-field-hl">{v}</span></dd>
                        </div>
                    ))}
                </dl>
            </div>
        </figure>
    )
}

function SignMock() {
    return (
        <figure className="lr-mock p-6 sm:p-7" role="img" aria-label="Illustration of an offer letter with an employee signature marked Signed and an administrator counter-signature marked To counter-sign.">
            <div aria-hidden="true">
                <p className="text-lg font-bold text-[var(--lr-navy)]">Offer letter</p>
                <div className="mt-4 space-y-2">
                    <div className="h-2 w-full rounded-full bg-[var(--lr-navy-tint)]" />
                    <div className="h-2 w-11/12 rounded-full bg-[var(--lr-navy-tint)]" />
                    <div className="h-2 w-3/4 rounded-full bg-[var(--lr-navy-tint)]" />
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                        <p className="lr-caption">Employee</p>
                        <svg viewBox="0 0 160 44" className="h-11 w-36 text-[var(--lr-navy)]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 30c8-22 14-24 15-15s-9 20-3 20 10-15 16-15-4 14 2 14 9-12 17-12-3 11 3 11c8 0 12-6 22-9 10-3 16 1 30 1" /></svg>
                        <div className="border-t border-[var(--lr-navy)]/40 pt-2"><span className="lr-chip lr-chip-teal"><CheckCircle2 aria-hidden="true" />Signed</span></div>
                    </div>
                    <div>
                        <p className="lr-caption">Administrator</p>
                        <div className="flex h-11 items-center"><span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--lr-navy)] px-4 text-sm font-semibold text-white"><PenLine className="size-4" />Counter-sign</span></div>
                        <div className="border-t border-[var(--lr-navy)]/40 pt-2"><span className="lr-chip lr-chip-amber"><Clock3 aria-hidden="true" />To counter-sign</span></div>
                    </div>
                </div>
            </div>
        </figure>
    )
}

function DocsMock() {
    const docs = [
        ['Driver license', 'teal', 'Valid', CheckCircle2],
        ['CPR certification', 'amber', 'Expiring soon', Clock3],
        ['TB test results', 'coral', 'Expired', AlertCircle],
    ]
    return (
        <figure className="lr-mock" role="img" aria-label="Illustration of a document list with statuses Valid, Expiring soon and Expired.">
            <div aria-hidden="true">
                <div className="border-b border-[var(--lr-line)] px-5 py-4"><p className="text-base font-semibold text-[var(--lr-navy)]">Documents</p></div>
                <ul>
                    {docs.map(([name, chip, label, Icon]) => (
                        <li key={name} className="flex items-center justify-between gap-3 border-b border-[var(--lr-line)] px-5 py-4 last:border-b-0">
                            <span className="text-sm font-semibold text-[var(--lr-navy)]">{name}</span>
                            <span className={`lr-chip lr-chip-${chip}`}><Icon aria-hidden="true" />{label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </figure>
    )
}

const SHOWCASES = [
    {
        id: 'forms', stage: 'var(--lr-teal-tint)', Mock: FormsMock,
        title: 'Forms that fill themselves in',
        body: 'An employee answers each question once. We carry their answers into every form that needs them, so there is no re-typing and no missing fields.',
        points: ['I-9, W-4, W-9 and state withholding', 'Offer letters', 'Per-company form templates'],
    },
    {
        id: 'signatures', stage: 'var(--lr-amber-tint)', Mock: SignMock,
        title: 'Signed by the employee, counter-signed by you',
        body: 'Employees sign electronically on any device. Your administrator counter-signs from the dashboard, and both signatures stay with the document.',
        points: ['E-signatures on any device', 'Admin counter-signing', 'Signed copies kept with the record'],
    },
    {
        id: 'documents', stage: 'var(--lr-coral-tint)', Mock: DocsMock,
        title: 'Know what is expiring before it becomes a problem',
        body: 'Collect licenses, certifications and test results as uploads, with expiration dates tracked for you.',
        points: ['Document uploads', 'Expiration tracking', 'Orientation modules, quizzes and competency checklists'],
    },
]

export default function Showcases() {
    return (
        <section id="features" aria-labelledby="features-heading" className="lr-section">
            <div className="lr-container">
                <h2 id="features-heading" className="lr-h2 max-w-3xl">Everything a new hire needs to finish, and everything you need to see.</h2>
                <div className="mt-14 space-y-20 lg:mt-20 lg:space-y-28">
                    {SHOWCASES.map(({ id, stage, Mock, title, body, points }, i) => (
                        <article key={id} className="lr-reveal grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                            <div className={i % 2 ? 'lg:order-2' : ''}>
                                <h3 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--lr-navy)] sm:text-[2rem]">{title}</h3>
                                <p className="lr-lead mt-4">{body}</p>
                                <ul className="mt-6 space-y-3">
                                    {points.map((p) => (
                                        <li key={p} className="flex items-start gap-3">
                                            <Check className="mt-1 size-5 shrink-0 text-[var(--lr-navy)]" aria-hidden="true" />
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-[28px] p-5 sm:p-10" style={{ background: stage }}>
                                <Mock />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
