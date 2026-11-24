const sessionKey = () => {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
}

const cacheKey = (userId) => `rs_branding_${userId}`

let cachedBranding = null

function storedUserId() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey()))?.user?.id ?? null
    } catch {
        return null
    }
}

function readCache(userId) {
    try {
        return JSON.parse(localStorage.getItem(cacheKey(userId)))
    } catch {
        return null
    }
}

function setVariables({ primary, hover, secondary }) {
    const style = document.documentElement.style
    if (primary) style.setProperty('--primary-color', primary)
    if (hover) style.setProperty('--hover-color', hover)
    if (secondary) style.setProperty('--secondary-bg', secondary)
}

function preloadLogo(url) {
    if (!url) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
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
    const userId = storedUserId()
    if (!userId) return false

    const branding = readCache(userId)
    if (!branding) return false

    setVariables(branding)
    preloadLogo(branding.logoUrl)
    cachedBranding = branding
    return true
}

export const hasCachedBranding = () => cachedBranding !== null

export const getCachedBranding = () => cachedBranding
