export async function functionError(error, fallback) {
    try {
        const body = await error.context.json()
        return body?.error || fallback
    } catch {
        return fallback
    }
}
