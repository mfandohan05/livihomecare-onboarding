import { Clock3, FileCheck2, ShieldCheck } from 'lucide-react'

const BENEFITS = [
    { icon: Clock3, tile: 'amber', title: 'Save time', body: 'Information entered once flows into every form that needs it. No re-keying, no chasing signatures.' },
    { icon: FileCheck2, tile: 'teal', title: 'Fewer paperwork errors', body: 'Guided steps and pre-filled forms mean fewer missing fields and fewer do-overs.' },
    { icon: ShieldCheck, tile: 'coral', title: 'Be audit-ready', body: 'Signed forms, documents, expiration dates and an activity log live in one place.' },
]

export default function Benefits() {
    return (
        <section aria-labelledby="benefits-heading" className="lr-surface lr-section">
            <div className="lr-container">
                <h2 id="benefits-heading" className="lr-h2 max-w-2xl">Less paperwork. More time for care.</h2>
                <ul className="mt-12 grid gap-5 md:grid-cols-3">
                    {BENEFITS.map(({ icon: Icon, tile, title, body }) => (
                        <li key={title} className="lr-card p-7">
                            <span className={`lr-tile lr-tile-${tile}`}><Icon className="size-6" aria-hidden="true" /></span>
                            <h3 className="lr-h3 mt-5">{title}</h3>
                            <p className="lr-muted mt-2">{body}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
