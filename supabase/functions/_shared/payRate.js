// Pay rates are always shown with two decimals ($16.00, never $16 or $16.5).
// Returns '' for a missing or invalid rate so callers can fall back to a blank or a dash.
export function formatPayRate(value) {
    if (value === null || value === undefined || value === '') return ''
    const amount = Number(value)
    return Number.isFinite(amount) ? amount.toFixed(2) : ''
}
