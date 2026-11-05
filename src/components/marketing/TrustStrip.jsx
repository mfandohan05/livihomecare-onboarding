import { Lock, ScrollText, Building2 } from 'lucide-react'

const ITEMS = [
    { icon: Lock, tile: 'teal', title: 'Encrypted sensitive data', body: 'SSNs and banking details are handled with encryption.' },
    { icon: ScrollText, tile: 'amber', title: 'Audit logs', body: 'A record of what happened and who did it, ready when you need it.' },
    { icon: Building2, tile: 'coral', title: 'Multi-company support', body: 'Run more than one agency with separate branding and settings.' },
]

export default function TrustStrip() {
    return (
        <section aria-labelledby="trust-heading" className="lr-surface">
            <div className="lr-container py-12 lg:py-16">
                <h2 id="trust-heading" className="lr-h3 mb-8">Built for sensitive paperwork</h2>
                <ul className="grid gap-8 md:grid-cols-3">
                    {ITEMS.map(({ icon: Icon, tile, title, body }) => (
                        <li key={title} className="flex items-start gap-4">
                            <span className={`lr-tile lr-tile-${tile} shrink-0`}><Icon className="size-6" aria-hidden="true" /></span>
                            <div>
                                <h3 className="font-semibold text-[var(--lr-navy)]">{title}</h3>
                                <p className="lr-muted mt-1">{body}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
