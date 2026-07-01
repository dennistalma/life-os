import { NextRequest, NextResponse } from 'next/server'
import { updateDataAsync } from '@/lib/storage'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      imageBase64,
      mediaType,
      extractedRaw,
      vendor,
      description,
      date,
      amount,
      netAmount,
      vatAmount,
      vatRate,
      type,
      category,
    } = body

    if (!imageBase64 || !mediaType || amount == null || !date) {
      return NextResponse.json({ error: 'Unvollständige Belegdaten' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const transactionId = crypto.randomUUID()
    const receiptId = crypto.randomUUID()

    const updatedData = await updateDataAsync((data) => {
      data.transactions = [
        {
          id: transactionId,
          description: description || 'Beleg',
          amount: Math.abs(Number(amount) || 0),
          type: type === 'income' ? 'income' : 'expense',
          category: category || 'Sonstiges',
          date,
          createdAt: now,
          vendor: vendor || undefined,
          netAmount: netAmount != null ? Number(netAmount) : undefined,
          vatAmount: vatAmount != null ? Number(vatAmount) : undefined,
          vatRate: vatRate != null ? Number(vatRate) : undefined,
          receiptId,
          locked: true,
        },
        ...data.transactions,
      ]
      data.receipts = [
        {
          id: receiptId,
          transactionId,
          imageBase64,
          mediaType,
          extractedRaw: extractedRaw || '',
          createdAt: now,
        },
        ...data.receipts,
      ]
      return data
    })

    return NextResponse.json({ data: updatedData })
  } catch (err) {
    console.error('Receipt confirm error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
