import { Link2, ListChecks, GraduationCap, ClipboardCheck, Palette, LayoutDashboard } from 'lucide-react'

const TILES = [
    { icon: Link2, tile: 'teal', title: 'Secure onboarding links', body: 'Each employee gets a unique link. No account to create before they can start.' },
    { icon: ListChecks, tile: 'amber', title: 'Guided portal', body: 'A step-by-step checklist shows new hires exactly what is left.' },
    { icon: GraduationCap, tile: 'navy', title: 'Orientation and quizzes', body: 'Deliver orientation modules and check understanding with quizzes.' },
    { icon: ClipboardCheck, tile: 'coral', title: 'Competency checklists', body: 'Track skills sign-offs for each employee in one place.' },
    { icon: Palette, tile: 'teal', title: 'Your branding and roles', body: 'Company branding and role-based steps, so each hire sees what applies to them.' },
    { icon: LayoutDashboard, tile: 'navy', title: 'Progress and time tracking', body: 'See who is stuck, who is done, and how long each step takes.' },
]

export default function Features() {
    return (
        <section aria-labelledby="more-heading" className="lr-surface lr-section">
            <div className="lr-container">
                <h2 id="more-heading" className="lr-h2 max-w-2xl">And the details that make it work every day.</h2>
                <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {TILES.map(({ icon: Icon, tile, title, body }) => (
                        <li key={title} className="lr-card lr-lift p-7">
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
