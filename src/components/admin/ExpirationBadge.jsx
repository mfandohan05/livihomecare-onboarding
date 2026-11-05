import { Clock, CircleAlert, TriangleAlert, OctagonAlert } from 'lucide-react'
import { getExpirationStatus } from '@/lib/documentExpiration'

const TONES = {
  expired: { classes: 'bg-red-900 text-white border-red-950', Icon: OctagonAlert },
  critical: { classes: 'bg-red-100 text-red-900 border-red-300', Icon: TriangleAlert },
  warning: { classes: 'bg-orange-100 text-orange-900 border-orange-300', Icon: CircleAlert },
  notice: { classes: 'bg-yellow-100 text-yellow-900 border-yellow-300', Icon: Clock },
}

const BASE = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap'

export function ExpirationBadge({ expirationDate, today }) {
  const status = getExpirationStatus(expirationDate, today)
  if (!status || status.level === 'none') return null
  const { classes, Icon } = TONES[status.level]
  return (
    <span className={`${BASE} ${classes}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {status.label}
    </span>
  )
}

export function ExpirationSummaryBadge({ summary }) {
  if (!summary || !summary.worst || summary.worst.level === 'none') return null
  const { classes, Icon } = TONES[summary.worst.level]
  const expired = summary.worst.level === 'expired'
  const text = expired ? `${summary.expiredCount} expired` : `${summary.expiringCount} expiring`
  const plural = (count) => `${count} document${count === 1 ? '' : 's'}`
  const detail = expired
    ? `${plural(summary.expiredCount)} expired${summary.expiringCount > 0 ? `, ${summary.expiringCount} expiring soon` : ''}`
    : `${plural(summary.expiringCount)} expiring soon, soonest: ${summary.worst.label.toLowerCase()}`
  return (
    <span className={`${BASE} ${classes}`} title={detail} aria-label={detail}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {text}
    </span>
  )
}
