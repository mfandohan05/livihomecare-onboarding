import { CircleHelp } from 'lucide-react'

// Always-visible Help button for caregiver pages. It opens the FAQ in a NEW TAB so
// the caregiver never loses their place or unsaved work on the page they are on.
export default function CaregiverHelpButton() {
    return (
        <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Help and FAQ (opens in a new tab)"
            className="fixed right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--primary-color)] px-5 text-base font-semibold text-white shadow-lg ring-2 ring-white transition-colors hover:bg-[var(--hover-color)] bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:right-6"
        >
            <CircleHelp aria-hidden="true" className="size-5" />
            <span className="sm:hidden">Need help?</span>
            <span className="hidden sm:inline">Help</span>
        </a>
    )
}
