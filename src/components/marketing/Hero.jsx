import { ArrowRight, CheckCircle2, Clock3, AlertCircle, Send, Loader, Search, Plus } from 'lucide-react'

// Status chips carry meaning: teal = approved/valid, amber = needs review, coral = needs attention, gray/navy = in progress.
const ROWS = [
    { name: 'Maria S.', role: 'Field staff', pct: 100, chip: 'teal', label: 'Approved', Icon: CheckCircle2 },
    { name: 'Priya N.', role: 'Office staff', pct: 90, chip: 'amber', label: 'Awaiting review', Icon: Clock3 },
    { name: 'James O.', role: 'Scheduler', pct: 60, chip: 'navy', label: 'In progress', Icon: Loader },
    { name: 'Alicia R.', role: 'Field staff', pct: 40, chip: 'coral', label: 'Needs attention', Icon: AlertCircle },
    { name: 'Daniel K.', role: 'Office staff', pct: 8, chip: 'gray', label: 'Link sent', Icon: Send },
]

function DashboardMock() {
    return (
        <figure className="lr-mock w-full" role="img" aria-label="Illustration of the admin dashboard listing employees with onboarding progress and a status for each, such as Approved, Awaiting review, In progress, Needs attention and Link sent.">
            <div aria-hidden="true">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--lr-line)] px-5 py-4">
                    <p className="text-base font-semibold text-[var(--lr-navy)]">Employees</p>
                    <div className="flex items-center gap-2">
                        <span className="hidden items-center gap-2 rounded-full bg-[var(--lr-surface)] px-3 py-1.5 text-sm text-[var(--lr-text-2)] sm:inline-flex"><Search className="size-3.5" />Search</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--lr-navy)] px-3 py-1.5 text-sm font-semibold text-white"><Plus className="size-3.5" />Add employee</span>
                    </div>
                </div>
                <ul>
                    {ROWS.map(({ name, role, pct, chip, label, Icon }) => (
                        <li key={name} className="border-b border-[var(--lr-line)] px-5 py-3.5 last:border-b-0">
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--lr-navy-tint)] text-sm font-semibold text-[var(--lr-navy)]">{name[0]}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[var(--lr-navy)]">{name}</p>
                                    <p className="hidden truncate text-xs text-[var(--lr-text-2)] sm:block">{role}</p>
                                </div>
                                <span className={`lr-chip lr-chip-${chip}`}><Icon aria-hidden="true" />{label}</span>
                            </div>
                            <div className="lr-progress mt-3"><i style={{ width: `${pct}%` }} /></div>
                        </li>
                    ))}
                </ul>
            </div>
        </figure>
    )
}

const COVERED = ['I-9', 'W-4', 'W-9', 'State withholding', 'Offer letters', 'E-signatures', 'Orientation and quizzes', 'Document expirations']
const DOTS = ['var(--lr-teal)', 'var(--lr-amber)', 'var(--lr-coral)']

export default function Hero() {
    return (
        <section id="top" aria-labelledby="hero-heading" className="lr-hero">
            <div className="lr-container pb-16 pt-12 md:pt-16 lg:pb-24 lg:pt-24">
                <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
                    <div>
                        <h1 id="hero-heading" className="lr-display">Get new hires onboarded faster. Stay compliant.</h1>
                        <p className="lr-lead mt-6 max-w-xl">
                            Send one secure link. Each new hire completes their tax forms, signatures, documents and orientation, and your team reviews instead of chasing paperwork.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <a href="#contact" className="lr-btn lr-btn-primary">Contact us <ArrowRight className="size-4" aria-hidden="true" /></a>
                            <a href="#features" className="lr-btn lr-btn-tonal">See features</a>
                        </div>
                    </div>
                    <DashboardMock />
                </div>

                <div className="mt-14 lg:mt-20">
                    <p className="lr-caption mb-3 font-medium">What's covered</p>
                    <ul className="flex flex-wrap gap-2">
                        {COVERED.map((c, i) => (
                            <li key={c} className="lr-chip" style={{ background: '#fff', border: '1px solid var(--lr-line)' }}>
                                <span className="lr-dot" style={{ background: DOTS[i % 3] }} aria-hidden="true" />{c}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
