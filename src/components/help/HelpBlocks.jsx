import { Link } from 'react-router-dom'
import { Image as ImageIcon, Info, Lightbulb, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fillPlaceholders } from '@/lib/help/placeholders'

// Renders the structured content blocks used by both the caregiver FAQ and the
// admin guide (see the header of src/content/help/caregiverFaq.js).

const INLINE = /(\*\*[^*]+\*\*|\[\[[a-z]+:[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/g

// [[red: Expired]] -> a colored status chip. Colors match the status badges in the admin app.
const CHIPS = {
  darkred: 'bg-red-100 text-red-950 border-red-300',
  red: 'bg-red-50 text-red-800 border-red-200',
  orange: 'bg-orange-50 text-orange-900 border-orange-300',
  yellow: 'bg-yellow-50 text-yellow-900 border-yellow-300',
  green: 'bg-green-50 text-green-900 border-green-300',
  blue: 'bg-blue-50 text-blue-900 border-blue-300',
  amber: 'bg-amber-50 text-amber-900 border-amber-300',
  gray: 'bg-muted text-foreground border-border',
}

export function InlineText({ text, company }) {
  const filled = fillPlaceholders(text, company)
  const parts = filled.split(INLINE).filter(Boolean)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={i} className="font-semibold text-foreground">{bold[1]}</strong>
    const chip = part.match(/^\[\[([a-z]+):\s*([^\]]+)\]\]$/)
    if (chip) {
      return <span key={i} className={cn('inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', CHIPS[chip[1]] || CHIPS.gray)}>{chip[2]}</span>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const external = /^https?:/.test(link[2])
      const cls = 'font-medium text-[var(--primary-color)] underline underline-offset-2 hover:text-[var(--hover-color)]'
      if (link[2].startsWith('/')) return <Link key={i} to={link[2]} className={cls}>{link[1]}</Link>
      return (
        <a
          key={i}
          href={link[2]}
          className={cls}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link[1]}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const CALLOUTS = {
  note: { Icon: Info, label: 'Note', cls: 'border-[var(--primary-color)]/25 bg-[var(--secondary-bg)]', iconCls: 'text-[var(--primary-color)]' },
  tip: { Icon: Lightbulb, label: 'Tip', cls: 'border-teal-700/30 bg-teal-50', iconCls: 'text-teal-700' },
  warning: { Icon: TriangleAlert, label: 'Warning', cls: 'border-amber-800/40 bg-amber-50', iconCls: 'text-amber-800' },
}

export function Callout({ kind, children }) {
  const { Icon, label, cls, iconCls } = CALLOUTS[kind]
  return (
    <div role="note" className={cn('my-3 flex gap-3 rounded-lg border p-3 text-sm leading-relaxed', cls)}>
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', iconCls)} />
      <div>
        <span className="sr-only">{label}: </span>
        {children}
      </div>
    </div>
  )
}

// Drop a real image into public/help/ and set `src` (e.g. "/help/dashboard.png") in the
// content file to replace the placeholder. Until then a labelled box is shown.
export function ScreenshotPlaceholder({ label, src, alt }) {
  if (src) {
    return (
      <figure className="my-2">
        <img src={src} alt={alt || label} loading="lazy" className="w-full rounded-lg border border-border" />
        <figcaption className="mt-1 text-xs text-muted-foreground">{label}</figcaption>
      </figure>
    )
  }
  return (
    <div
      role="img"
      aria-label={`Screenshot placeholder: ${label}`}
      className="my-2 flex min-h-36 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[var(--primary-color)]/30 bg-[var(--secondary-bg)] p-4 text-center"
    >
      <ImageIcon aria-hidden="true" className="size-6 text-[var(--primary-color)]" />
      <p className="text-sm font-semibold text-[var(--primary-color)]">Screenshot: {label}</p>
      <p className="text-xs text-muted-foreground">Add an image to public/help/ and set its path in the content file.</p>
    </div>
  )
}

export default function HelpBlocks({ blocks, company }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        if (typeof block === 'string') {
          return <p key={i}><InlineText text={block} company={company} /></p>
        }
        if (block.ul) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
              {block.ul.map((item, j) => <li key={j}><InlineText text={item} company={company} /></li>)}
            </ul>
          )
        }
        if (block.ol) {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[var(--primary-color)]">
              {block.ol.map((item, j) => <li key={j}><InlineText text={item} company={company} /></li>)}
            </ol>
          )
        }
        if (block.table) {
          return (
            <div key={i} className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead className="bg-muted/60">
                  <tr>{block.table.head.map((h, j) => <th key={j} scope="col" className="px-3 py-2 font-semibold text-foreground">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {block.table.rows.map((row, r) => (
                    <tr key={r} className="border-t border-border align-top">
                      {row.map((cell, c) => <td key={c} className="px-3 py-2"><InlineText text={cell} company={company} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.screenshot) return <ScreenshotPlaceholder key={i} {...block.screenshot} />
        const kind = ['note', 'tip', 'warning'].find((k) => block[k])
        if (kind) {
          return <Callout key={i} kind={kind}><InlineText text={block[kind]} company={company} /></Callout>
        }
        return null
      })}
    </div>
  )
}
