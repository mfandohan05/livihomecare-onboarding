import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, Loader2, Menu, SearchX } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import AdminHelpNav from '@/components/help/AdminHelpNav'
import ArticleView from '@/components/help/ArticleView'
import { InlineText } from '@/components/help/HelpBlocks'
import { useCompany } from '@/context/CompanyContext'
import { blocksToText, searchEntries } from '@/lib/help/search'
import { fillPlaceholders } from '@/lib/help/placeholders'

// Admin How-To Guide (/admin/help and /admin/help/:articleId). Rendered inside
// AdminLayoutWrapper, so it sits behind the same admin sign-in and company scoping
// as every other admin page. The content module is imported on demand, so it is
// not part of the bundle a caregiver or signed-out visitor downloads.
export default function AdminHelp() {
    const { articleId } = useParams()
    const { companyName } = useCompany()
    const company = useMemo(() => ({ name: companyName }), [companyName])
    const [help, setHelp] = useState(null)
    const [query, setQuery] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => {
        let cancelled = false
        import('@/content/help/admin').then((m) => { if (!cancelled) setHelp(m.adminHelp) })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const previous = document.title
        document.title = 'How-To Guide'
        return () => { document.title = previous }
    }, [])

    // New article: start at the top. (The drawer closes itself when a link is chosen.)
    useEffect(() => {
        window.scrollTo({ top: 0 })
    }, [articleId])

    const index = useMemo(() => {
        if (!help) return null
        const articles = help.categories.flatMap((c) => c.articles.map((a) => ({ ...a, category: c })))
        const byId = Object.fromEntries(articles.map((a) => [a.id, a]))
        const entries = articles.map((a) => ({
            key: a.id,
            text: fillPlaceholders([
                a.title, a.summary, a.category.title,
                blocksToText(a.whenToUse), (a.steps || []).join(' '), blocksToText(a.details),
                blocksToText(a.seeing),
                (a.problems || []).map((p) => `${p.q} ${blocksToText(p.a)}`).join(' '),
            ].join(' '), company),
        }))
        return { articles, byId, entries }
    }, [help, company])

    if (!help || !index) {
        return (
            <div className="flex items-center justify-center py-24" role="status">
                <Loader2 aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading the guide</span>
            </div>
        )
    }

    const matches = searchEntries(index.entries, query)
    const results = matches ? index.articles.filter((a) => matches.has(a.id)) : null
    const article = articleId ? index.byId[articleId] : null

    const nav = (
        <AdminHelpNav
            help={help}
            query={query}
            onQueryChange={setQuery}
            onNavigate={() => { setQuery(''); setDrawerOpen(false) }}
        />
    )

    let main
    if (results) {
        main = (
            <div>
                <h1 className="text-2xl font-bold text-[var(--primary-color)]">Search results</h1>
                <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    {results.length} {results.length === 1 ? 'article' : 'articles'} for “{query}”
                </p>
                {results.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-border bg-white p-8 text-center">
                        <SearchX aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
                        <p className="font-semibold">No articles found.</p>
                        <p className="mt-1 text-sm text-muted-foreground">Try a different word, or browse the list.</p>
                    </div>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {results.map((a) => (
                            <li key={a.id}>
                                <Link
                                    to={`/admin/help/${a.id}`}
                                    onClick={() => setQuery('')}
                                    className="block rounded-xl border border-border bg-white p-4 hover:border-[var(--primary-color)]/40"
                                >
                                    <p className="text-xs font-medium text-muted-foreground">{a.category.title}</p>
                                    <p className="font-semibold text-[var(--primary-color)]">{a.title}</p>
                                    <p className="text-sm text-foreground/80">{a.summary}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        )
    } else if (articleId && !article) {
        main = (
            <div className="rounded-xl border border-border bg-white p-8 text-center">
                <h1 className="text-xl font-bold">Article not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">It may have been moved or renamed.</p>
                <Link to="/admin/help" className="mt-3 inline-block font-medium text-[var(--primary-color)] underline underline-offset-2">Back to the guide</Link>
            </div>
        )
    } else if (article) {
        main = (
            <ArticleView
                key={article.id}
                article={article}
                category={article.category}
                articlesById={index.byId}
                company={company}
            />
        )
    } else {
        const popular = index.articles.filter((a) => a.popular)
        main = (
            <div className="space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--primary-color)]">{help.title}</h1>
                    <p className="mt-2 text-base text-foreground/80">{help.intro}</p>
                </header>
                <section aria-labelledby="start-here">
                    <h2 id="start-here" className="mb-3 text-lg font-semibold text-[var(--primary-color)]">Start here</h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {popular.map((a) => (
                            <li key={a.id}>
                                <Link to={`/admin/help/${a.id}`} className="flex h-full flex-col rounded-xl border border-border bg-white p-4 hover:border-[var(--primary-color)]/40">
                                    <span className="font-semibold text-[var(--primary-color)]">{a.title}</span>
                                    <span className="mt-1 flex-1 text-sm text-foreground/80"><InlineText text={a.summary} company={company} /></span>
                                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary-color)]">Read <ArrowRight aria-hidden="true" className="size-3.5" /></span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
                <section aria-labelledby="all-topics" className="space-y-4">
                    <h2 id="all-topics" className="text-lg font-semibold text-[var(--primary-color)]">All topics</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {help.categories.map((c) => (
                            <div key={c.id} className="rounded-xl border border-border bg-white p-4">
                                <h3 className="mb-2 font-semibold">{c.title}</h3>
                                <ul className="space-y-1">
                                    {c.articles.map((a) => (
                                        <li key={a.id}>
                                            <Link to={`/admin/help/${a.id}`} className="text-sm font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)]">{a.title}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                <Link to="/admin/help" className="inline-flex items-center gap-2 font-semibold text-[var(--primary-color)]">
                    <BookOpen aria-hidden="true" className="size-5" /> How-To Guide
                </Link>
                <Button variant="outline" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog">
                    <Menu aria-hidden="true" /> Browse articles
                </Button>
            </div>

            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-4">
                    <SheetHeader className="p-0 pb-3">
                        <SheetTitle>How-To Guide</SheetTitle>
                        <SheetDescription className="sr-only">Search and browse help articles</SheetDescription>
                    </SheetHeader>
                    {nav}
                </SheetContent>
            </Sheet>

            <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
                <aside className="hidden lg:block">
                    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                        <Link to="/admin/help" className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--primary-color)]">
                            <BookOpen aria-hidden="true" className="size-5" /> How-To Guide
                        </Link>
                        {nav}
                    </div>
                </aside>
                <main className="min-w-0">{main}</main>
            </div>
        </div>
    )
}
