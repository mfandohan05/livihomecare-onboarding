export function statusColor(status, source) {
    if (source === 'imported' && status === 'completed') return 'text-sky-700 bg-sky-50'
    if (status === 'completed') return 'text-[#577C09] bg-[#E8F0D0]'
    if (status === 'in_progress') return 'text-amber-700 bg-amber-50'
    if (status === 'cancelled') return 'text-red-700 bg-red-50'
    return 'text-muted-foreground bg-muted'
}
