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

// Parses a Revolut personal account CSV export
// (columns: Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance)
export function parseRevolutCsv(text: string): ParsedCsvRow[] {
  const rows = parseCsvLines(text)
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
    const amount = parseFloat(r[amountCol]?.replace(',', '.') ?? '')
    if (!Number.isFinite(amount) || amount >= 0) continue // only negative = spending

    const rawDate = r[dateCol] ?? ''
    const date = rawDate.slice(0, 10) // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DD"
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    result.push({
      date,
      description: (descCol !== -1 ? r[descCol] : '')?.trim() || 'Unbekannt',
      amount: Math.abs(amount),
      currency: currencyCol !== -1 ? r[currencyCol]?.trim() : 'EUR',
      type: typeCol !== -1 ? r[typeCol]?.trim() : '',
      state: stateCol !== -1 ? r[stateCol]?.trim() : '',
    })
  }
  return result
}
