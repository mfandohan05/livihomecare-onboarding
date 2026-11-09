import { Search, Star } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Sidebar content: global search, "Popular / Start here", then every category and
// article. Used inline on desktop and inside a drawer on phones/tablets.
export default function AdminHelpNav({ help, query, onQueryChange, onNavigate }) {
    const popular = help.categories.flatMap((c) => c.articles).filter((a) => a.popular)

    const linkCls = ({ isActive }) =>
        cn(
            'block rounded-md px-3 py-1.5 text-sm transition-colors',
            isActive
                ? 'bg-[var(--secondary-bg)] font-semibold text-[var(--primary-color)]'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground',
        )

    return (
        <nav aria-label="How-To Guide" className="space-y-6">
            <div role="search">
                <label htmlFor="admin-help-search" className="sr-only">Search the guide</label>
                <div className="relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="admin-help-search"
                        type="search"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="Search the guide"
                        autoComplete="off"
                        className="h-10 bg-white pl-9"
                    />
                </div>
            </div>

            <div>
                <h2 className="mb-1 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
                    <Star aria-hidden="true" className="size-3.5" /> Popular / Start here
                </h2>
                <ul>
                    {popular.map((a) => (
                        <li key={a.id}>
                            <NavLink to={`/admin/help/${a.id}`} className={linkCls} onClick={onNavigate}>{a.title}</NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            {help.categories.map((category) => (
                <div key={category.id}>
                    <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category.title}</h2>
                    <ul>
                        {category.articles.map((a) => (
                            <li key={a.id}>
                                <NavLink to={`/admin/help/${a.id}`} className={linkCls} onClick={onNavigate}>{a.title}</NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    )
}
