import { NextRequest, NextResponse } from 'next/server'
import { extractPrivateExpense } from '@/lib/privateExpenseExtractor'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Kein Bild angegeben' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const extraction = await extractPrivateExpense(imageBase64, mediaType, today)

    return NextResponse.json({ extraction })
  } catch (err) {
    console.error('Private expense extraction error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
