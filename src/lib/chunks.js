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

    const runner = async () => {
        while (next < chunks.length) {
            const index = next++
            results[index] = await worker(chunks[index])
            finished += chunks[index].length
            onProgress?.(finished, items.length)
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, runner))
    return results
}
