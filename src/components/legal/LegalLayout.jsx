import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'
import '@/components/marketing/marketing.css'

export function Section({ id, title, children }) {
    return (
        <section id={id} aria-labelledby={`${id}-heading`} className="mt-12">
            <h2 id={`${id}-heading`} className="lr-h3 text-2xl">{title}</h2>
            <div className="mt-4 space-y-4 text-[var(--lr-text)]">{children}</div>
        </section>
    )
}

export function Sub({ title, children }) {
    return (
        <div>
            <h3 className="text-lg font-semibold text-[var(--lr-navy)]">{title}</h3>
            <div className="mt-2 space-y-3">{children}</div>
        </div>
    )
}

export function List({ items }) {
    return (
        <ul className="list-disc space-y-2 pl-6">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    )
}

export function DataTable({ head, rows }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-[var(--lr-line)]">
            <table className="w-full min-w-[640px] border-collapse text-left text-[0.9375rem]">
                <thead className="bg-[var(--lr-surface)] text-[var(--lr-navy)]">
                    <tr>
                        {head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-t border-[var(--lr-line)] align-top">
                            {row.map((cell, j) => (
                                <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-semibold text-[var(--lr-navy)]' : ''}`}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default function LegalLayout({ title, updated, intro, toc, children }) {
    useEffect(() => {
        const previous = document.title
        document.title = `${title} | Ready, Set, Onboard!`
        return () => { document.title = previous }
    }, [title])

    return (
        <div className="landing-root lr-page-enter min-h-screen">
            <Nav />
            <main id="main" className="lr-container py-12 lg:py-20">
                <div className="mx-auto max-w-3xl">
                    <p className="lr-caption">
                        <Link to="/" className="font-medium underline">Home</Link> / {title}
                    </p>
                    <h1 className="lr-h2 mt-4">{title}</h1>
                    <p className="lr-caption mt-3">Last updated: {updated}</p>
                    <p className="lr-lead mt-6">{intro}</p>

                    <nav aria-label="On this page" className="mt-8 rounded-2xl bg-[var(--lr-surface)] p-5">
                        <p className="text-sm font-semibold text-[var(--lr-navy)]">On this page</p>
                        <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-[0.9375rem] sm:grid-cols-2">
                            {toc.map((t) => (
                                <li key={t.id}><a href={`#${t.id}`} className="underline-offset-2 hover:underline">{t.title}</a></li>
                            ))}
                        </ol>
                    </nav>

                    {children}
                </div>
            </main>
            <Footer />
        </div>
    )
}
