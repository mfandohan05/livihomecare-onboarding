export const CSV_TYPE = 'text/csv;charset=utf-8'
export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadTextFile(filename, content, type = CSV_TYPE) {
    downloadBlob(filename, new Blob([content], { type }))
}
