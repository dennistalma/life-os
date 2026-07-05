import { NextRequest, NextResponse } from 'next/server'
import { parseRevolutCsv, parseRevolutExcel, ParsedCsvRow } from '@/lib/csvImport'
import { classifyExpenseBatch } from '@/lib/privateExpenseExtractor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { csv, fileBase64, filename } = body as {
      csv?: string
      fileBase64?: string
      filename?: string
    }

    let rows: ParsedCsvRow[]
    if (fileBase64) {
      const isExcel = /\.xlsx?$/i.test(filename ?? '')
      const buffer = Buffer.from(fileBase64, 'base64')
      rows = isExcel ? parseRevolutExcel(buffer) : parseRevolutCsv(buffer.toString('utf-8'))
    } else if (typeof csv === 'string' && csv.trim()) {
      rows = parseRevolutCsv(csv)
    } else {
      return NextResponse.json({ error: 'Keine Datei angegeben' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Keine passenden Buchungen in der Datei gefunden' }, { status: 400 })
    }

    const categories = await classifyExpenseBatch(rows.map((r) => r.description))

    const candidates = rows.map((r, i) => ({
      date: r.date,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      category: categories[i],
      include: r.currency === 'EUR' && (r.type === 'CARD_PAYMENT' || r.type === 'ATM'),
    }))

    return NextResponse.json({ candidates })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
