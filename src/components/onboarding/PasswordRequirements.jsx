import { Check, X } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/passwordPolicy'

export default function PasswordRequirements({ password }) {
    const results = PASSWORD_RULES.map((rule) => ({ rule, met: rule.test(password) }))

    if (password && results.every((r) => r.met)) {
        return (
            <p className="flex items-center gap-2 text-sm text-green-700">
                <Check className="size-4" /> Password meets all requirements
            </p>
        )
    }

    return (
        <ul className="space-y-1" aria-live="polite">
            {results.map(({ rule, met }) => {
                return (
                    <li key={rule.id} className={`flex items-center gap-2 text-sm ${met ? 'text-green-700' : 'text-muted-foreground'}`}>
                        {met ? (
                            <Check className="size-4" />
                        ) : (
                            <X className="size-4" />
                        )}
                        {rule.label}
                        <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
                    </li>
                )
            })}
        </ul>
    )
}
