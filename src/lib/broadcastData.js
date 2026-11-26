import { supabase } from '@/lib/supabase'
import { functionError } from '@/lib/functionError'

export const HISTORY_PAGE_SIZE = 10

export const BROADCAST_STATUS = [{ value: 'onboarded', label: 'Completed' }]

export const TEMPLATES = [
    {
        id: 'shift',
        label: 'Shift available',
        subject: 'Shift available',
        body: 'Hi {first_name},\n\nA shift is available:\n\nDate: \nTime: \nLocation: \nDetails: \n\nIf you can take it, reply to this email or call the office.\n\nThank you,\n{company_name}',
    },
    {
        id: 'update',
        label: 'General update',
        subject: 'An update from {company_name}',
        body: 'Hi {first_name},\n\n\n\nThank you,\n{company_name}',
    },
]

export const MERGE_FIELDS = [
    { token: '{first_name}', label: 'First name' },
    { token: '{company_name}', label: 'Company name' },
]

export const SKIP_REASON_LABELS = {
    no_email: 'No email on file',
    invalid_email: 'Invalid email address',
    duplicate_email: 'Email shared with another recipient',
}

export const RECIPIENT_STATUS_LABELS = {
    queued: 'Not sent',
    sent: 'Sent',
    delivered: 'Delivered',
    failed: 'Failed',
    skipped: 'Skipped',
}

export const BROADCAST_STATUS_LABELS = {
    sending: 'Sending',
    completed: 'Sent',
    partial: 'Partly sent',
    failed: 'Failed',
}

export function firstNameOf(name) {
    return (name || '').trim().split(/\s+/)[0] || 'there'
}

export function applyTemplate(text, vars) {
    return text
        .replace(/\{first_name\}/g, vars.first_name)
        .replace(/\{company_name\}/g, vars.company_name)
}

export function newIdempotencyKey() {
    return crypto.randomUUID()
}

export async function loadBroadcastConfig() {
    const { data, error } = await supabase.functions.invoke('send-broadcast', { body: { action: 'config' } })
    if (error) throw new Error(await functionError(error, 'Could not load broadcast settings.'))
    return data
}

export async function countOnboarded(companyId) {
    const { count, error } = await supabase
        .from('caregivers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'completed')
    if (error) throw new Error(error.message || 'Could not count employees.')
    return count || 0
}

export async function sendBroadcast(payload) {
    const { data, error } = await supabase.functions.invoke('send-broadcast', { body: payload })
    if (error) throw new Error(await functionError(error, 'The broadcast could not be sent. Check the history before retrying.'))
    return data
}

export async function listBroadcasts(companyId, page) {
    const from = (page - 1) * HISTORY_PAGE_SIZE
    const { data, count, error } = await supabase
        .from('broadcasts')
        .select('id, created_at, created_by_name, subject, body, recipient_mode, status, counts', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(from, from + HISTORY_PAGE_SIZE - 1)
    if (error) throw new Error(error.message || 'Could not load broadcast history.')
    return { broadcasts: data || [], total: count || 0 }
}

export async function listBroadcastRecipients(companyId, broadcastId) {
    const { data: rows, error } = await supabase
        .from('broadcast_recipients')
        .select('id, caregiver_id, status, skip_reason, error, sent_at')
        .eq('company_id', companyId)
        .eq('broadcast_id', broadcastId)
    if (error) throw new Error(error.message || 'Could not load recipients.')

    const ids = [...new Set((rows || []).map((r) => r.caregiver_id))]
    const names = {}
    for (let i = 0; i < ids.length; i += 100) {
        const { data, error: cgError } = await supabase
            .from('caregivers')
            .select('id, name, email')
            .eq('company_id', companyId)
            .in('id', ids.slice(i, i + 100))
        if (cgError) throw new Error(cgError.message || 'Could not load recipients.')
        for (const cg of data || []) names[cg.id] = cg
    }

    return (rows || [])
        .map((r) => ({ ...r, name: names[r.caregiver_id]?.name || 'Deleted employee', email: names[r.caregiver_id]?.email || '' }))
        .sort((a, b) => a.name.localeCompare(b.name))
}
