import { CircleHelp } from 'lucide-react'

// Small contextual link for the main admin screens. Opens the matching How-To
// article in a new tab so any open dialog or unsaved work stays where it is.
export default function HowDoesThisWork({ article, className = '' }) {
    return (
        <a
            href={`/admin/help/${article}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)] ${className}`}
        >
            <CircleHelp aria-hidden="true" className="size-4" />
            How does this work?
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    )
}
