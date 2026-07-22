import { NextRequest, NextResponse } from 'next/server'
import { parsePrivateExpenseText, extractPrivateExpenseImage, PrivateExpenseExtraction } from '@/lib/privateExpenseExtractor'
import { updateDataAsync } from '@/lib/storage'
import { addToEurApp } from '@/lib/eurSync'
import { PrivateExpense, Transaction } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { input, imageBase64, mediaType } = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const note = typeof input === 'string' ? input.trim() : ''

    let extraction: PrivateExpenseExtraction
    let fallbackNote: string
    if (typeof imageBase64 === 'string' && imageBase64) {
      extraction = await extractPrivateExpenseImage(imageBase64, mediaType || 'image/png', today, note || undefined)
      fallbackNote = extraction.note || note || 'Screenshot'
    } else if (note) {
      extraction = await parsePrivateExpenseText(note, today)
      fallbackNote = note
    } else {
      return NextResponse.json({ error: 'Keine Eingabe angegeben' }, { status: 400 })
    }

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
        description: extraction.note || fallbackNote,
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
