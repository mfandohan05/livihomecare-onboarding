export const CHUNK_SIZE = 100

export function emptyOutcome(skippedResults = []) {
    return {
        results: [...skippedResults],
        summary: { created: 0, emailed: 0, trainingFailures: 0, profileFailures: 0 },
    }
}

export function mergeOutcome(outcome, chunkData) {
    const summary = chunkData.summary || {}

    return {
        results: [...outcome.results, ...chunkData.results],
        summary: {
            created: outcome.summary.created + (summary.created || 0),
            emailed: outcome.summary.emailed + (summary.emailed || 0),
            trainingFailures: outcome.summary.trainingFailures + (summary.trainingFailures || 0),
            profileFailures: outcome.summary.profileFailures + (summary.profileFailures || 0),
        },
    }
}

export async function describeFailure(invoke, remainingRows, message) {
    try {
        const data = await invoke({ rows: remainingRows, validateOnly: true })
        const statusByLine = new Map(data.results.map((r) => [r.line, r.status]))

        return {
            message,
            checked: true,
            stillMissing: remainingRows.filter((row) => statusByLine.get(row.line) === 'valid'),
            maybeSaved: data.results.filter((r) => r.status === 'duplicate'),
        }
    } catch {
        return { message, checked: false, stillMissing: remainingRows, maybeSaved: [] }
    }
}

export async function runChunkedImport({ rows, sendEmails, invoke, outcome, onProgress }) {
    let current = outcome
    let done = 0
    onProgress?.({ done, total: rows.length })

    for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
        const chunk = rows.slice(start, start + CHUNK_SIZE)

        try {
            const data = await invoke({ rows: chunk, sendEmails })
            if (!Array.isArray(data?.results)) throw new Error('Unexpected response from the server.')

            current = mergeOutcome(current, data)
            done += chunk.length
            onProgress?.({ done, total: rows.length })
        } catch (err) {
            const message = err?.message || 'Import failed. Please try again.'
            return { outcome: current, failure: await describeFailure(invoke, rows.slice(start), message) }
        }
    }

    return { outcome: current, failure: null }
}
