import { useEffect, useMemo, useState } from 'react'
import { Mail, Phone, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import HelpBlocks, { InlineText } from '@/components/help/HelpBlocks'
import { caregiverFaq, stillNeedHelp } from '@/content/help/caregiverFaq'
import { useCaregiverCompany } from '@/hooks/useCaregiverCompany'
import { blocksToText, searchEntries } from '@/lib/help/search'
import { fillPlaceholders } from '@/lib/help/placeholders'
import companyLogo from '@/assets/logo.png'

// Public page: static content only, so signed-out visitors can read it. The only
// per-company part is the contact block, filled in when the visitor is a signed-in caregiver.
export default function CaregiverFaq() {
    const { company } = useCaregiverCompany()
    const [query, setQuery] = useState('')
    const [openItems, setOpenItems] = useState([])

    useEffect(() => {
        const previous = document.title
        document.title = 'Help & FAQ'
        return () => { document.title = previous }
    }, [])

    // Searchable text per question (placeholders filled so company names are searchable too).
    const entries = useMemo(
        () => caregiverFaq.categories.flatMap((c) => c.items.map((item) => ({
            key: item.id,
            text: fillPlaceholders(
                `${item.question} ${(item.keywords || []).join(' ')} ${blocksToText(item.answer)} ${c.title}`,
                company,
            ),
        }))),
        [company],
    )

    const matches = useMemo(() => searchEntries(entries, query), [entries, query])
    const visibleCategories = caregiverFaq.categories
        .map((c) => ({ ...c, items: matches ? c.items.filter((i) => matches.has(i.id)) : c.items }))
        .filter((c) => c.items.length > 0)
    const resultCount = visibleCategories.reduce((n, c) => n + c.items.length, 0)

    // Deep links: /help#category-id scrolls to a section; /help#question-id opens that question.
    useEffect(() => {
        const goToHash = () => {
            const id = decodeURIComponent(window.location.hash.slice(1))
            if (!id) return
            const isQuestion = caregiverFaq.categories.some((c) => c.items.some((i) => i.id === id))
            setQuery('')
            if (isQuestion) setOpenItems((prev) => (prev.includes(id) ? prev : [...prev, id]))
            // Wait for the filtered list to re-render before scrolling.
            setTimeout(() => {
                const el = document.getElementById(id)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    if (isQuestion) el.querySelector('button')?.focus({ preventScroll: true })
                }
            }, 50)
        }
        goToHash()
        window.addEventListener('hashchange', goToHash)
        return () => window.removeEventListener('hashchange', goToHash)
    }, [])

    const contactName = company?.name?.trim()
    const phone = company?.phone?.trim()
    const email = company?.email?.trim()

    return (
        <div className="min-h-screen bg-muted/30 pb-16">
            <header className="border-b border-border bg-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
                    <img src={companyLogo} alt="Ready, Set, Onboard!" className="w-[140px]" />
                    <a
                        href="/onboard"
                        onClick={(e) => {
                            // Opened from a page in this tab: go back there. Opened in a new tab: go to the app.
                            if (window.history.length > 1) { e.preventDefault(); window.history.back() }
                        }}
                        className="text-sm font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)]"
                    >
                        Back
                    </a>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 pt-8">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--primary-color)]">{caregiverFaq.title}</h1>
                <p className="mt-2 text-base text-muted-foreground">{caregiverFaq.intro}</p>

                <div className="mt-6" role="search">
                    <label htmlFor="faq-search" className="sr-only">Search questions</label>
                    <div className="relative">
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="faq-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search, for example “password” or “upload”"
                            autoComplete="off"
                            className="h-12 bg-white pl-11 text-base"
                        />
                    </div>
                    <p className="mt-2 min-h-5 text-sm text-muted-foreground" aria-live="polite">
                        {matches ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}` : ''}
                    </p>
                </div>

                {!matches && (
                    <nav aria-label="Topics" className="mb-8 mt-2">
                        <ul className="flex flex-wrap gap-2">
                            {caregiverFaq.categories.map((c) => (
                                <li key={c.id}>
                                    <a
                                        href={`#${c.id}`}
                                        className="inline-block rounded-full border border-[var(--primary-color)]/20 bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--primary-color)] hover:bg-[var(--secondary-bg)]"
                                    >
                                        {c.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                {visibleCategories.length === 0 && (
                    <div className="rounded-xl border border-border bg-white p-8 text-center">
                        <SearchX aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="font-semibold">No answers found for “{query}”.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try a different word, or{' '}
                            <button type="button" className="font-medium text-[var(--primary-color)] underline underline-offset-2" onClick={() => setQuery('')}>
                                clear the search
                            </button>
                            . You can also contact your employer using the details below.
                        </p>
                    </div>
                )}

                <div className="space-y-8">
                    {visibleCategories.map((category) => (
                        <section key={category.id} id={category.id} aria-labelledby={`${category.id}-heading`} className="scroll-mt-6">
                            <h2 id={`${category.id}-heading`} className="text-xl font-semibold text-[var(--primary-color)]">
                                {category.title}
                            </h2>
                            <p className="mb-2 text-sm text-muted-foreground">{category.summary}</p>
                            <Accordion
                                type="multiple"
                                value={openItems}
                                onValueChange={(next) =>
                                    // Only this category's items change; keep the others as they were.
                                    setOpenItems((prev) => [
                                        ...prev.filter((id) => !category.items.some((i) => i.id === id)),
                                        ...next,
                                    ])
                                }
                                className="rounded-xl border border-border bg-white px-4 sm:px-5"
                            >
                                {category.items.map((item) => (
                                    <AccordionItem key={item.id} value={item.id} id={item.id} className="scroll-mt-6">
                                        <AccordionTrigger>
                                            <InlineText text={item.question} company={company} />
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <HelpBlocks blocks={item.answer} company={company} />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </section>
                    ))}
                </div>

                <section aria-labelledby="still-need-help" className="mt-10 rounded-xl border border-teal-700/30 bg-teal-50 p-5 sm:p-6">
                    <h2 id="still-need-help" className="text-xl font-semibold text-[var(--primary-color)]">{stillNeedHelp.title}</h2>
                    <p className="mt-1 text-[15px]">
                        <InlineText text={contactName ? stillNeedHelp.withContact : stillNeedHelp.generic} company={company} />
                    </p>
                    {(phone || email) && (
                        <ul className="mt-4 space-y-2 text-[15px]">
                            {phone && (
                                <li className="flex items-center gap-2">
                                    <Phone aria-hidden="true" className="size-4 text-teal-700" />
                                    <a className="font-medium text-[var(--primary-color)] underline underline-offset-2" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
                                </li>
                            )}
                            {email && (
                                <li className="flex items-center gap-2">
                                    <Mail aria-hidden="true" className="size-4 text-teal-700" />
                                    <a className="font-medium text-[var(--primary-color)] underline underline-offset-2 break-all" href={`mailto:${email}`}>{email}</a>
                                </li>
                            )}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    )
}
