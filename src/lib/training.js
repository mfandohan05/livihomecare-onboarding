import { supabase } from '@/lib/supabase'

export const DUE_SOON_DAYS = 7

export const TRAINING_ROLES = [
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'nurse_prn', label: 'Nurse (PRN)' },
    { value: 'nurse_director', label: 'Nurse (Director)' },
    { value: 'other', label: 'Other' },
]

async function invoke(name, body) {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke(name, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (error) {
        let message = error.message
        try {
            const parsed = await error.context?.json?.()
            if (parsed?.error) message = parsed.error
        } catch {
            message = error.message
        }
        throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
    return data
}

export const trainingAdmin = (action, body = {}) => invoke('training-admin', { action, ...body })
export const trainingCaregiver = (action, body = {}) => invoke('training-caregiver', { action, ...body })

export function trainingImageUrl(path) {
    if (!path) return null
    return supabase.storage.from('company_assets').getPublicUrl(path).data.publicUrl
}

export function formatTrainingDate(value) {
    if (!value) return ''
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getTrainingStatus(row, now = new Date()) {
    const progress = row.status === 'passed' ? 'passed' : row.status === 'in_progress' ? 'in_progress' : 'not_started'
    let due = null

    if (progress !== 'passed' && row.due_date) {
        const dueAt = new Date(row.due_date)
        const msLeft = dueAt.getTime() - now.getTime()
        if (msLeft < 0) {
            due = { level: 'overdue', label: `Overdue ${formatTrainingDate(row.due_date)}` }
        } else if (msLeft <= DUE_SOON_DAYS * 86400000) {
            due = { level: 'due_soon', label: 'Due Soon' }
        }
    }

    return { progress, due }
}

export function parseVideoUrl(raw) {
    const value = (raw || '').trim()
    if (!value) return null

    let url
    try {
        url = new URL(value)
    } catch {
        return { error: 'Enter a full link starting with https://' }
    }
    if (url.protocol !== 'https:') return { error: 'The video link must start with https://' }

    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
        const id = url.pathname.slice(1)
        if (/^[\w-]{6,20}$/.test(id)) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        const embed = url.pathname.match(/^\/embed\/([\w-]{6,20})/)
        const id = embed ? embed[1] : url.searchParams.get('v')
        if (id && /^[\w-]{6,20}$/.test(id)) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const match = url.pathname.match(/(\d{5,})/)
        if (match) return { kind: 'iframe', src: `https://player.vimeo.com/video/${match[1]}` }
    }

    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return { kind: 'file', src: url.toString() }

    return { error: 'Use a YouTube or Vimeo link, or a direct link to an .mp4 or .webm file' }
}

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Could not read the file'))
        reader.readAsDataURL(file)
    })
}
