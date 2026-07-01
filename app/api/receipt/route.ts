import { NextRequest, NextResponse } from 'next/server'
import { extractReceipt } from '@/lib/receiptExtractor'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Kein Bild angegeben' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const extraction = await extractReceipt(imageBase64, mediaType, today)

    return NextResponse.json({ extraction })
  } catch (err) {
    console.error('Receipt extraction error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
