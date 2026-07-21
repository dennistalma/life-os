import { NextRequest, NextResponse } from 'next/server'
import { parsePrivateExpenseText } from '@/lib/privateExpenseExtractor'
import { updateDataAsync } from '@/lib/storage'
import { addToEurApp } from '@/lib/eurSync'
import { PrivateExpense, Transaction } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    if (typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'Keine Eingabe angegeben' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const extraction = await parsePrivateExpenseText(input.trim(), today)
    const now = new Date().toISOString()

    const entry: PrivateExpense = {
      id: crypto.randomUUID(),
      date: extraction.date,
      category: extraction.category,
      amount: extraction.amount,
      note: extraction.note || undefined,
      createdAt: now,
    }

    const updatedData = await updateDataAsync((data) => {
      data.privateExpenses = [entry, ...data.privateExpenses]
      return data
    })

    let addedToEur = false
    if (extraction.category === 'SL') {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        description: extraction.note || input.trim(),
        amount: extraction.amount,
        type: 'expense',
        category: 'Spirit Lamps',
        date: extraction.date,
        createdAt: now,
      }
      addedToEur = await addToEurApp(transaction)
    }

    return NextResponse.json({ entry, extraction, addedToEur, data: updatedData })
  } catch (err) {
    console.error('Private expense capture error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
