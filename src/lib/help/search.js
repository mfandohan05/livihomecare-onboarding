
export function blocksToText(blocks) {
  return (blocks || [])
    .map((block) => {
      if (typeof block === 'string') return block
      if (block.ul || block.ol) return (block.ul || block.ol).join(' ')
      if (block.note || block.warning || block.tip) return block.note || block.warning || block.tip
      if (block.table) return [...block.table.head, ...block.table.rows.flat()].join(' ')
      if (block.screenshot) return block.screenshot.label
      if (block.qa) return block.qa.map((q) => `${q.q} ${blocksToText(q.a)}`).join(' ')
      return ''
    })
    .join(' ')
}

const stripMarkup = (text) =>
  text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[[a-z]+:\s*(.+?)\]\]/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1')

export function normalize(text) {
  return stripMarkup(String(text || '')).toLowerCase()
}

export function searchEntries(entries, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return null
  const matches = new Set()
  for (const { key, text } of entries) {
    const haystack = normalize(text)
    if (words.every((w) => haystack.includes(w))) matches.add(key)
  }
  return matches
}
