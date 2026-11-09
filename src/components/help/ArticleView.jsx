import { Link } from 'react-router-dom'
import { ArrowRight, Construction } from 'lucide-react'
import HelpBlocks, { InlineText } from './HelpBlocks'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

function Section({ id, title, children }) {
    return (
        <section aria-labelledby={id} className="rounded-xl border border-border bg-white p-5 sm:p-6">
            <h2 id={id} className="mb-3 text-lg font-semibold text-[var(--primary-color)]">{title}</h2>
            {children}
        </section>
    )
}

export default function ArticleView({ article, category, articlesById, company }) {
    const related = (article.related || []).map((id) => articlesById[id]).filter(Boolean)

    return (
        <article className="space-y-5">
            <header>
                <p className="text-sm font-medium text-muted-foreground">{category.title}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--primary-color)]">{article.title}</h1>
                <p className="mt-2 text-base text-foreground/80"><InlineText text={article.summary} company={company} /></p>
            </header>

            {article.stub && (
                <div role="status" className="flex gap-3 rounded-lg border border-amber-800/40 bg-amber-50 p-4 text-sm">
                    <Construction aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-800" />
                    <p>This article is still being written. Check back soon.</p>
                </div>
            )}

            {article.whenToUse && (
                <Section id="when-to-use" title="When to use this">
                    <HelpBlocks blocks={article.whenToUse} company={company} />
                </Section>
            )}

            {article.steps && (
                <Section id="steps" title="Step by step">
                    <HelpBlocks blocks={[{ ol: article.steps }]} company={company} />
                </Section>
            )}

            {article.details && (
                <Section id="details" title="Good to know">
                    <HelpBlocks blocks={article.details} company={company} />
                </Section>
            )}

            {article.seeing && (
                <Section id="what-you-should-see" title="What you should see">
                    <HelpBlocks blocks={article.seeing} company={company} />
                </Section>
            )}

            {article.problems && (
                <Section id="common-problems" title="Common problems">
                    <Accordion type="multiple" className="-my-2">
                        {article.problems.map((p, i) => (
                            <AccordionItem key={i} value={`p${i}`}>
                                <AccordionTrigger><InlineText text={p.q} company={company} /></AccordionTrigger>
                                <AccordionContent><HelpBlocks blocks={p.a} company={company} /></AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Section>
            )}

            {related.length > 0 && (
                <Section id="related" title="Related articles">
                    <ul className="space-y-1">
                        {related.map((r) => (
                            <li key={r.id}>
                                <Link to={`/admin/help/${r.id}`} className="inline-flex items-center gap-1.5 font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)]">
                                    {r.title}<ArrowRight aria-hidden="true" className="size-3.5" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

        </article>
    )
}
