const STEPS = [
    { title: 'Add an employee', body: 'Enter their details and role in the admin dashboard.' },
    { title: 'They get a secure link', body: 'The link arrives by email or text. There is nothing to install.' },
    { title: 'They complete onboarding', body: 'Forms are pre-filled. They upload documents, finish orientation and sign.' },
    { title: 'You review and approve', body: 'Check the submission, counter-sign, and they are ready to work.' },
]

export default function HowItWorks() {
    return (
        <section id="how-it-works" aria-labelledby="how-heading" className="lr-section">
            <div className="lr-container">
                <h2 id="how-heading" className="lr-h2 max-w-2xl">From new hire to ready in four steps.</h2>
                <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {STEPS.map((s, i) => (
                        <li key={s.title} className="relative">
                            {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute left-16 right-0 top-6 hidden h-px bg-[var(--lr-line)] lg:block" />}
                            <span aria-hidden="true" className="relative grid size-12 place-items-center rounded-full bg-[var(--lr-teal-tint)] text-xl font-bold text-[var(--lr-navy)]">{i + 1}</span>
                            <h3 className="lr-h3 mt-5"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
                            <p className="lr-muted mt-2">{s.body}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}
