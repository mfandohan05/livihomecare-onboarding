import { CircleHelp } from 'lucide-react'
import { stepHelpTopics } from '@/content/help/caregiverFaq'

export default function NeedHelpLink({ stepName, className = '' }) {
    const topic = stepHelpTopics[stepName]
    if (!topic) return null
    return (
        <a
            href={`/help#${topic}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)] ${className}`}
        >
            <CircleHelp aria-hidden="true" className="size-4" />
            Need help with this step?
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    )
}
