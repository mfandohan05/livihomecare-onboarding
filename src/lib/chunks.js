export function splitIntoChunks(items, size) {
    const chunks = []
    for (let start = 0; start < items.length; start += size) chunks.push(items.slice(start, start + size))
    return chunks
}

export async function mapChunks(items, { size, concurrency, worker, onProgress }) {
    const chunks = splitIntoChunks(items, size)
    const results = new Array(chunks.length)
    let next = 0
    let finished = 0
    let failed = false

    // After one chunk fails the others stop picking up work and stay quiet, so a failed
    // report neither keeps hitting the database nor reports progress after the error.
    const runner = async () => {
        while (!failed && next < chunks.length) {
            const index = next++
            try {
                results[index] = await worker(chunks[index])
            } catch (error) {
                failed = true
                throw error
            }
            if (failed) return
            finished += chunks[index].length
            onProgress?.(finished, items.length)
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, runner))
    return results
}
