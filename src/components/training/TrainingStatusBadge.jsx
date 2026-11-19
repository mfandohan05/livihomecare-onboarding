import { Circle, CircleDashed, CircleCheck, Clock, OctagonAlert } from 'lucide-react'
import { getTrainingStatus } from '@/lib/training'

const BASE = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap'

const PROGRESS = {
    not_started: { label: 'Not Started', classes: 'bg-muted text-muted-foreground border-border', Icon: CircleDashed },
    in_progress: { label: 'In Progress', classes: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Circle },
    passed: { label: 'Passed', classes: 'bg-[#E8F0D0] text-[#577C09] border-[#C9DB9B]', Icon: CircleCheck },
}

const DUE = {
    due_soon: { classes: 'bg-yellow-100 text-yellow-900 border-yellow-300', Icon: Clock },
    overdue: { classes: 'bg-red-900 text-white border-red-950', Icon: OctagonAlert },
}

export default function TrainingStatusBadge({ row }) {
    const { progress, due } = getTrainingStatus(row)
    const { label, classes, Icon } = PROGRESS[progress]
    const dueTone = due ? DUE[due.level] : null

    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className={`${BASE} ${classes}`}>
                <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                {label}
            </span>
            {dueTone && (
                <span className={`${BASE} ${dueTone.classes}`}>
                    <dueTone.Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                    {due.label}
                </span>
            )}
        </span>
    )
}
