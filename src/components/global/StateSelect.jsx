import { US_STATES } from '@/lib/formUtils'
import { cn } from '@/lib/utils'

export default function StateSelect({ id, name, value, onChange, required, className }) {
    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={cn(
                "h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm appearance-none cursor-pointer",
                className
            )}
        >
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    )
}