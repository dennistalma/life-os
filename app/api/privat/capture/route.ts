import { NextRequest, NextResponse } from 'next/server'
import { parsePrivateExpenseText, extractPrivateExpenseImage, PrivateExpenseExtraction } from '@/lib/privateExpenseExtractor'
import { updateDataAsync } from '@/lib/storage'
import { PrivateExpense } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { input, imageBase64, mediaType } = await req.json()
    const today = new Date().toISOString().split('T')[0]

    const note = typeof input === 'string' ? input.trim() : ''

    let extraction: PrivateExpenseExtraction
    if (typeof imageBase64 === 'string' && imageBase64) {
      extraction = await extractPrivateExpenseImage(imageBase64, mediaType || 'image/png', today, note || undefined)
    } else if (note) {
      extraction = await parsePrivateExpenseText(note, today)
    } else {
      return NextResponse.json({ error: 'Keine Eingabe angegeben' }, { status: 400 })
    }

    const entry: PrivateExpense = {
      id: crypto.randomUUID(),
      date: extraction.date,
      category: extraction.category,
      amount: extraction.amount,
      note: extraction.note || undefined,
      createdAt: new Date().toISOString(),
    }

    const updatedData = await updateDataAsync((data) => {
      data.privateExpenses = [entry, ...data.privateExpenses]
      return data
    })

    return NextResponse.json({ entry, extraction, data: updatedData })
  } catch (err) {
    console.error('Private expense capture error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
