import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronRight, Loader2, Send, Users, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import HowDoesThisWork from '@/components/help/HowDoesThisWork'
import EmployeePicker from '@/components/admin/EmployeePicker'
import {
    BROADCAST_STATUS,
    BROADCAST_STATUS_LABELS,
    HISTORY_PAGE_SIZE,
    MERGE_FIELDS,
    RECIPIENT_STATUS_LABELS,
    SKIP_REASON_LABELS,
    TEMPLATES,
    applyTemplate,
    countOnboarded,
    listBroadcastRecipients,
    listBroadcasts,
    loadBroadcastConfig,
    newIdempotencyKey,
    sendBroadcast,
} from '@/lib/broadcastData'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PREVIEW_NAME = 'Alex'

const STATUS_STYLES = {
    sending: 'bg-amber-50 text-amber-700',
    completed: 'bg-[#E8F0D0] text-[#577C09]',
    partial: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700',
    sent: 'bg-[#E8F0D0] text-[#577C09]',
    delivered: 'bg-[#E8F0D0] text-[#577C09]',
    skipped: 'bg-muted text-muted-foreground',
    queued: 'bg-muted text-muted-foreground',
}

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

const formatDate = (value) => new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

function SkipReasons({ reasons }) {
    const entries = Object.entries(reasons || {})
    if (entries.length === 0) return null
    return (
        <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
            {entries.map(([reason, n]) => (
                <li key={reason}>{SKIP_REASON_LABELS[reason] || reason}: {n}</li>
            ))}
        </ul>
    )
}

function CountsLine({ counts }) {
    const email = counts?.email
    if (!email) return <span className="text-muted-foreground">—</span>
    return (
        <span>
            {email.sent} sent
            {email.failed > 0 && <span className="text-red-600"> · {email.failed} failed</span>}
            {email.skipped > 0 && <span className="text-muted-foreground"> · {email.skipped} skipped</span>}
        </span>
    )
}

function BroadcastHistory({ companyId, refreshKey }) {
    const [page, setPage] = useState(1)
    const [state, setState] = useState({ loading: true, broadcasts: [], total: 0, error: null })
    const [openId, setOpenId] = useState(null)
    const [recipients, setRecipients] = useState({})

    useEffect(() => {
        if (!companyId) return
        let cancelled = false
        setState((s) => ({ ...s, loading: true }))
        listBroadcasts(companyId, page)
            .then(({ broadcasts, total }) => !cancelled && setState({ loading: false, broadcasts, total, error: null }))
            .catch((err) => !cancelled && setState({ loading: false, broadcasts: [], total: 0, error: err.message }))
        return () => { cancelled = true }
    }, [companyId, page, refreshKey])

    const toggle = async (id) => {
        if (openId === id) {
            setOpenId(null)
            return
        }
        setOpenId(id)
        if (recipients[id]?.rows) return
        setRecipients((r) => ({ ...r, [id]: { loading: true } }))
        try {
            const rows = await listBroadcastRecipients(companyId, id)
            setRecipients((r) => ({ ...r, [id]: { rows } }))
        } catch (err) {
            setRecipients((r) => ({ ...r, [id]: { error: err.message } }))
        }
    }

    const pageCount = Math.max(1, Math.ceil(state.total / HISTORY_PAGE_SIZE))

    return (
        <section className="bg-white rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Sent messages</h2>
            {state.error ? (
                <p className="text-sm text-red-500">{state.error}</p>
            ) : state.broadcasts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{state.loading ? 'Loading...' : 'No messages have been sent yet.'}</p>
            ) : (
                <div className={`border border-border rounded-lg divide-y ${state.loading ? 'opacity-60' : ''}`}>
                    {state.broadcasts.map((b) => {
                        const open = openId === b.id
                        const detail = recipients[b.id]
                        return (
                            <div key={b.id}>
                                <button
                                    type="button"
                                    onClick={() => toggle(b.id)}
                                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30"
                                >
                                    {open ? <ChevronDown className="w-4 h-4 mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />}
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium truncate">{b.subject || '(no subject)'}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {formatDate(b.created_at)} · {b.created_by_name || 'Admin'} · {b.counts?.recipients != null ? plural(b.counts.recipients, 'recipient') : '—'}
                                        </span>
                                        <span className="block text-xs mt-0.5"><CountsLine counts={b.counts} /></span>
                                    </span>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[b.status] || STATUS_STYLES.queued}`}>
                                        {BROADCAST_STATUS_LABELS[b.status] || b.status}
                                    </span>
                                </button>
                                {open && (
                                    <div className="px-4 pb-4 pl-11 space-y-3">
                                        <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-3">{b.body}</p>
                                        {detail?.loading && <p className="text-sm text-muted-foreground">Loading recipients...</p>}
                                        {detail?.error && <p className="text-sm text-red-500">{detail.error}</p>}
                                        {detail?.rows && (
                                            <div className="border border-border rounded-lg divide-y max-h-80 overflow-y-auto">
                                                {detail.rows.map((r) => (
                                                    <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate">{r.name}</span>
                                                            <span className="block text-xs text-muted-foreground truncate">
                                                                {r.status === 'skipped'
                                                                    ? SKIP_REASON_LABELS[r.skip_reason] || r.skip_reason
                                                                    : r.status === 'failed'
                                                                        ? r.error || 'Delivery failed'
                                                                        : r.email}
                                                            </span>
                                                        </span>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[r.status] || STATUS_STYLES.queued}`}>
                                                            {RECIPIENT_STATUS_LABELS[r.status] || r.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            {state.total > HISTORY_PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 mt-3 text-sm text-muted-foreground">
                    <Button variant="outline" size="sm" disabled={page <= 1 || state.loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <span>Page {page} of {pageCount}</span>
                    <Button variant="outline" size="sm" disabled={page >= pageCount || state.loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
            )}
        </section>
    )
}

export default function AdminBroadcast() {
    const { companyId, companyName } = useCompany()
    const [searchParams] = useSearchParams()
    const preselected = searchParams.get('employee')
    const hasPreselected = !!preselected && UUID_RE.test(preselected)

    const [config, setConfig] = useState(null)
    const [configError, setConfigError] = useState(null)
    const [onboardedCount, setOnboardedCount] = useState(null)
    const [roleOptions, setRoleOptions] = useState([])
    const [mode, setMode] = useState(hasPreselected ? 'choose' : 'all')
    const [selected, setSelected] = useState(() => new Set(hasPreselected ? [preselected] : []))
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState(null)
    const [historyKey, setHistoryKey] = useState(0)
    const bodyRef = useRef(null)
    const keyRef = useRef({ signature: null, key: null })

    useEffect(() => {
        loadBroadcastConfig().then(setConfig).catch((err) => setConfigError(err.message))
    }, [])

    useEffect(() => {
        if (!companyId) return
        countOnboarded(companyId).then(setOnboardedCount).catch(() => setOnboardedCount(null))
        supabase
            .from('role_labels')
            .select('role_key, display_label')
            .eq('company_id', companyId)
            .then(({ data }) => setRoleOptions(data || []))
    }, [companyId])

    const maxRecipients = config?.maxRecipients ?? 300
    const maxSubject = config?.maxSubject ?? 150
    const maxBody = config?.maxBody ?? 2000
    const recipientCount = mode === 'all' ? onboardedCount ?? 0 : selected.size
    const overLimit = recipientCount > maxRecipients
    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    const messageReady = trimmedSubject.length > 0 && trimmedSubject.length <= maxSubject && trimmedBody.length > 0 && trimmedBody.length <= maxBody
    const canSend = !!config && messageReady && recipientCount > 0 && !overLimit && !sending

    const previewVars = { first_name: PREVIEW_NAME, company_name: config?.companyName || companyName || 'your company' }

    const applyPreset = (template) => {
        if ((subject || body) && !window.confirm('Replace the current subject and message with this template?')) return
        setSubject(template.subject)
        setBody(template.body)
    }

    const insertField = (token) => {
        const el = bodyRef.current
        if (!el) {
            setBody((b) => b + token)
            return
        }
        const start = el.selectionStart ?? body.length
        const end = el.selectionEnd ?? body.length
        const next = body.slice(0, start) + token + body.slice(end)
        setBody(next)
        requestAnimationFrame(() => {
            el.focus()
            el.setSelectionRange(start + token.length, start + token.length)
        })
    }

    const idempotencyKeyFor = useCallback((signature) => {
        if (keyRef.current.signature !== signature) {
            keyRef.current = { signature, key: newIdempotencyKey() }
        }
        return keyRef.current.key
    }, [])

    const send = async () => {
        const ids = [...selected].sort()
        const recipientMode = mode === 'all' ? 'all' : ids.length === 1 ? 'single' : 'selected'
        const signature = JSON.stringify([recipientMode, ids, trimmedSubject, trimmedBody])
        const payload = {
            subject: trimmedSubject,
            body: trimmedBody,
            recipientMode,
            caregiverIds: mode === 'all' ? undefined : ids,
            idempotencyKey: idempotencyKeyFor(signature),
        }

        setSending(true)
        try {
            const data = await sendBroadcast(payload)
            setResult(data)
            setConfirmOpen(false)
            setHistoryKey((k) => k + 1)
            keyRef.current = { signature: null, key: null }
            if (data.duplicate) {
                toast.info('This message was already sent. Showing the original result.')
            } else if (data.status === 'failed') {
                toast.error('The message could not be delivered. See the details below.')
            } else {
                toast.success(`Message sent to ${plural(data.counts?.email?.sent ?? 0, 'employee')}`)
                setSubject('')
                setBody('')
                if (mode === 'choose') setSelected(new Set())
            }
        } catch (err) {
            toast.error(err.message)
            setConfirmOpen(false)
        } finally {
            setSending(false)
        }
    }

    const recipientLabel = mode === 'all'
        ? `all ${plural(onboardedCount ?? 0, 'completed employee')}`
        : plural(selected.size, 'employee')

    return (
        <div className="max-w-4xl">
            <AlertDialog open={confirmOpen} onOpenChange={(open) => !sending && setConfirmOpen(open)}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Send this email?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{trimmedSubject}" will be emailed to {recipientLabel}. Each person gets their own copy. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            onClick={send}
                            disabled={sending}
                            className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white disabled:opacity-50 w-full sm:w-auto"
                        >
                            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            {sending ? 'Sending...' : 'Send email'}
                        </Button>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Broadcast</h1>
                    <p className="text-muted-foreground">Email employees who have completed onboarding, for example to let them know a shift is available.</p>
                </div>
                <HowDoesThisWork article="broadcast" className="shrink-0" />
            </div>

            {configError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 mb-6 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {configError}
                </div>
            )}

            <section className="bg-white rounded-xl border border-border p-6 mb-6">
                <h2 className="font-semibold mb-4">1. Choose recipients</h2>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                    {[
                        { value: 'all', icon: Users, title: 'All completed employees', text: onboardedCount == null ? 'Counting...' : `${plural(onboardedCount, 'employee')} right now` },
                        { value: 'choose', icon: UserCheck, title: 'Choose employees', text: 'Pick one person or several' },
                    ].map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors ${mode === option.value
                                ? 'border-[var(--primary-color)] bg-[var(--secondary-bg)]'
                                : 'border-border hover:border-[var(--primary-color)]'}`}
                        >
                            <input
                                type="radio"
                                name="recipient-mode"
                                value={option.value}
                                checked={mode === option.value}
                                onChange={() => setMode(option.value)}
                                className="sr-only"
                            />
                            <option.icon className="w-5 h-5 mt-0.5 text-[var(--primary-color)] shrink-0" />
                            <span>
                                <span className="block text-sm font-medium">{option.title}</span>
                                <span className="block text-xs text-muted-foreground">{option.text}</span>
                            </span>
                        </label>
                    ))}
                </div>
                {mode === 'choose' && (
                    <EmployeePicker
                        companyId={companyId}
                        roleOptions={roleOptions}
                        selected={selected}
                        onChange={setSelected}
                        statusOptions={BROADCAST_STATUS}
                        defaultStatus="onboarded"
                        maxSelected={maxRecipients}
                        limitMessage={(max) => `A message can go to at most ${max.toLocaleString()} employees at once. Narrow the search and try again.`}
                    />
                )}
                {overLimit && (
                    <p className="mt-3 text-sm text-red-500">
                        A message can go to at most {maxRecipients.toLocaleString()} employees at once. {mode === 'all' ? 'Choose employees instead and send in more than one go.' : 'Remove some employees.'}
                    </p>
                )}
            </section>

            <section className="bg-white rounded-xl border border-border p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="font-semibold">2. Write the message</h2>
                    <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map((template) => (
                            <Button key={template.id} type="button" variant="outline" size="sm" onClick={() => applyPreset(template)}>
                                {template.label}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="broadcast-subject">Subject</Label>
                        <Input
                            id="broadcast-subject"
                            value={subject}
                            maxLength={maxSubject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Shift available this Saturday"
                            className="focus-visible:border-[var(--primary-color)] focus-visible:ring-[var(--primary-color)]/30"
                        />
                        <p className="text-xs text-muted-foreground text-right">{subject.length}/{maxSubject}</p>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label htmlFor="broadcast-body">Message</Label>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground">Insert:</span>
                                {MERGE_FIELDS.map((field) => (
                                    <button
                                        key={field.token}
                                        type="button"
                                        onClick={() => insertField(field.token)}
                                        className="rounded-md border border-border px-2 py-0.5 hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
                                    >
                                        {field.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Textarea
                            id="broadcast-body"
                            ref={bodyRef}
                            value={body}
                            maxLength={maxBody}
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            placeholder="Write your message..."
                            className="focus-visible:border-[var(--primary-color)] focus-visible:ring-[var(--primary-color)]/30"
                        />
                        <p className="text-xs text-muted-foreground text-right">{body.length}/{maxBody}</p>
                    </div>
                    {(trimmedSubject || trimmedBody) && (
                        <div>
                            <p className="text-xs font-medium mb-1.5">Preview <span className="text-muted-foreground font-normal">· shown for an employee named {PREVIEW_NAME}</span></p>
                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                                <p className="font-semibold mb-2">{applyTemplate(trimmedSubject, previewVars)}</p>
                                <p className="text-sm whitespace-pre-wrap">{applyTemplate(trimmedBody, previewVars)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-border p-6 mb-6">
                <p className="text-sm">
                    Sending to <span className="font-semibold">{mode === 'all' ? recipientLabel : plural(selected.size, 'selected employee')}</span>
                    <span className="text-muted-foreground"> · by email</span>
                </p>
                <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!canSend}
                    className="bg-[var(--primary-color)] hover:bg-[var(--hover-color)] text-white disabled:opacity-50"
                >
                    <Send className="w-4 h-4 mr-2" />
                    Send email
                </Button>
            </div>

            {result && (
                <section className="bg-white rounded-xl border border-border p-6 mb-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <h2 className="font-semibold">Last send</h2>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[result.status] || STATUS_STYLES.queued}`}>
                            {BROADCAST_STATUS_LABELS[result.status] || result.status}
                        </span>
                    </div>
                    <p className="text-sm"><CountsLine counts={result.counts} /></p>
                    <SkipReasons reasons={result.counts?.skipped_reasons} />
                    {result.counts?.ignored_ids > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {plural(result.counts.ignored_ids, 'selected employee')} no longer completed or no longer in your company, so they were left out.
                        </p>
                    )}
                </section>
            )}

            <BroadcastHistory companyId={companyId} refreshKey={historyKey} />
        </div>
    )
}
