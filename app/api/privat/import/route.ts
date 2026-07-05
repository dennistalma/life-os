import { NextRequest, NextResponse } from 'next/server'
import { parseRevolutCsv } from '@/lib/csvImport'
import { classifyExpenseBatch } from '@/lib/privateExpenseExtractor'

export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json()
    if (typeof csv !== 'string' || !csv.trim()) {
      return NextResponse.json({ error: 'Keine CSV-Daten angegeben' }, { status: 400 })
    }

    const rows = parseRevolutCsv(csv)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Keine passenden Buchungen in der CSV gefunden' }, { status: 400 })
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
    console.error('CSV import error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
