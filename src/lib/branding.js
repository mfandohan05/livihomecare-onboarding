const sessionKey = () => {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    return `sb-${ref}-auth-token`
}

const cacheKey = (userId) => `rs_branding_${userId}`

let restoredFromCache = false

function storedUserId() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey()))?.user?.id ?? null
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

export function applyBranding(colors) {
    setVariables(colors)

    const userId = storedUserId()
    if (!userId) return

    try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(colors))
    } catch {
        return
    }
}

export function applyCachedBranding() {
    const userId = storedUserId()
    if (!userId) return false

    try {
        const colors = JSON.parse(localStorage.getItem(cacheKey(userId)))
        if (!colors) return false

        setVariables(colors)
        restoredFromCache = true
        return true
    } catch {
        return false
    }
}

export const hasCachedBranding = () => restoredFromCache
