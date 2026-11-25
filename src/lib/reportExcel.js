// Builds an .xlsx workbook from the same columns/rows the CSV export uses.
// Rows hold display text (MM/DD/YYYY, "15.00"); each column's type tells us how to store it in Excel.

const ALIGNMENT = 'left'
const MIN_WIDTH = 10
const MAX_WIDTH = 45
const WIDTH_PADDING = 3
const DATE_FORMAT = 'mm/dd/yyyy'
const MIN_EXCEL_YEAR = 1900

const HEADER_STYLE = { fontWeight: 'bold', backgroundColor: '#F3F4F6', align: ALIGNMENT }

const CELL_BUILDERS = {
    date: (text) => {
        const [month, day, year] = text.split('/').map(Number)
        // Excel cannot show dates before 1900 (it prints ####), so keep those as text.
        if (year < MIN_EXCEL_YEAR) return { value: text }
        return { value: new Date(Date.UTC(year, month - 1, day)), type: Date, format: DATE_FORMAT }
    },
    money: (text) => ({ value: Number(text), type: Number, format: '0.00' }),
    integer: (text) => ({ value: Number(text), type: Number, format: '0' }),
}

function toCell(type, value) {
    const text = value === null || value === undefined ? '' : String(value)
    if (text === '') return null

    const cell = CELL_BUILDERS[type]?.(text) ?? { value: text }
    return { align: ALIGNMENT, ...cell }
}

function columnWidth([key, label, type], rows) {
    if (type === 'date') return Math.max(MIN_WIDTH, label.length + WIDTH_PADDING)

    const longest = rows.reduce((max, row) => Math.max(max, String(row[key] ?? '').length), label.length)
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest + WIDTH_PADDING))
}

export function toSheetData(columns, rows) {
    const header = columns.map(([, label]) => ({ value: label, ...HEADER_STYLE }))
    const body = rows.map((row) => columns.map(([key, , type]) => toCell(type, row[key])))
    return [header, ...body]
}

export async function toXlsxBlob(columns, rows, sheetName = 'Report') {
    const { default: writeExcelFile } = await import('write-excel-file/browser')

    return writeExcelFile(toSheetData(columns, rows), {
        sheet: sheetName,
        columns: columns.map((column) => ({ width: columnWidth(column, rows) })),
        stickyRowsCount: 1,
    }).toBlob()
}
