export default function Section({ title, children }) {
    return (
        <section>
            <h2 className="lr-h3">{title}</h2>
            <div className="lr-muted mt-3 grid gap-3">{children}</div>
        </section>
    )
}
