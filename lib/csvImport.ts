import * as XLSX from 'xlsx'

export interface ParsedCsvRow {
  date: string
  description: string
  amount: number
  currency: string
  type: string
  state: string
}

function parseCsvLines(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f.length > 0)) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((f) => f.length > 0)) rows.push(row)
  }
  return rows
}

function findCol(header: string[], ...names: string[]): number {
  const lower = header.map((h) => h.trim().toLowerCase())
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase())
    if (idx !== -1) return idx
  }
  return -1
}

function normalizeDate(raw: string): string | null {
  const v = (raw ?? '').trim()
  if (!v) return null

  // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss"
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  // "DD/MM/YYYY" or "DD.MM.YYYY"
  const eu = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/)
  if (eu) return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`

  return null
}

// Converts already-tabular data (first row = header) into spending rows.
// Works for both CSV text rows and rows read out of an Excel sheet.
function rowsToParsedCsvRows(rows: string[][]): ParsedCsvRow[] {
  if (rows.length < 2) return []

  const header = rows[0]
  const typeCol = findCol(header, 'Type')
  const dateCol = findCol(header, 'Started Date', 'Completed Date', 'Date')
  const descCol = findCol(header, 'Description')
  const amountCol = findCol(header, 'Amount')
  const currencyCol = findCol(header, 'Currency')
  const stateCol = findCol(header, 'State')

  if (dateCol === -1 || amountCol === -1) return []

  const result: ParsedCsvRow[] = []
  for (const r of rows.slice(1)) {
    const amount = parseFloat(String(r[amountCol] ?? '').replace(',', '.'))
    if (!Number.isFinite(amount) || amount >= 0) continue // only negative = spending

    const date = normalizeDate(String(r[dateCol] ?? ''))
    if (!date) continue

    result.push({
      date,
      description: String(descCol !== -1 ? r[descCol] : '').trim() || 'Unbekannt',
      amount: Math.abs(amount),
      currency: currencyCol !== -1 ? String(r[currencyCol]).trim() : 'EUR',
      type: typeCol !== -1 ? String(r[typeCol]).trim() : '',
      state: stateCol !== -1 ? String(r[stateCol]).trim() : '',
    })
  }
  return result
}

// Parses a Revolut personal account CSV export
// (columns: Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance)
export function parseRevolutCsv(text: string): ParsedCsvRow[] {
  return rowsToParsedCsvRows(parseCsvLines(text))
}

// Parses a Revolut personal account Excel export (same columns as the CSV export)
export function parseRevolutExcel(buffer: Buffer | ArrayBuffer): ParsedCsvRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  return rowsToParsedCsvRows(rows)
}
