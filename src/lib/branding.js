const sessionKey = () => {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
}

const cacheKey = (userId) => `rs_branding_${userId}`

const TEXT_FIELDS = ['primary', 'hover', 'secondary', 'companyName']

function storedUserId() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey()))?.user?.id ?? null
    } catch {
        return null
    }
}

function cleanBranding(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null

    const clean = {}
    for (const field of TEXT_FIELDS) {
        if (typeof value[field] === 'string') clean[field] = value[field]
    }
    if (typeof value.logoUrl === 'string' && /^https?:\/\//i.test(value.logoUrl)) {
        clean.logoUrl = value.logoUrl
    }

    return Object.keys(clean).length > 0 ? clean : null
}

function readCache(userId) {
    try {
        return cleanBranding(JSON.parse(localStorage.getItem(cacheKey(userId))))
    } catch {
        return null
    }
}

function currentCache() {
    const userId = storedUserId()
    return userId ? readCache(userId) : null
}

function setVariables({ primary, hover, secondary }) {
    const style = document.documentElement.style
    if (primary) style.setProperty('--primary-color', primary)
    if (hover) style.setProperty('--hover-color', hover)
    if (secondary) style.setProperty('--secondary-bg', secondary)
}

export function applyBranding(branding) {
    setVariables(branding)

    const userId = storedUserId()
    if (!userId) return

    const provided = Object.fromEntries(
        Object.entries(branding).filter(([, value]) => value !== undefined)
    )

    try {
        localStorage.setItem(cacheKey(userId), JSON.stringify({ ...readCache(userId), ...provided }))
    } catch {
        return
    }
}

export function applyCachedBranding() {
    const branding = currentCache()
    if (!branding) return false

    setVariables(branding)
    return true
}

export function clearBranding() {
    const userId = storedUserId()
    if (!userId) return

    try {
        localStorage.removeItem(cacheKey(userId))
    } catch {
        return
    }
}

export const getCachedBranding = () => currentCache()

export const hasCachedBranding = () => currentCache() !== null
