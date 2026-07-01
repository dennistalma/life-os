import { NextRequest, NextResponse } from 'next/server'
import { readData, updateData } from '@/lib/storage'
import { Note } from '@/lib/types'

export async function GET() {
  const data = readData()
  return NextResponse.json({ notes: data.notes || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const note: Note = {
    id: Date.now().toString(),
    text: body.text || '',
    color: body.color || 'default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const updated = updateData((d) => ({ ...d, notes: [...(d.notes || []), note] }))
  return NextResponse.json({ note, notes: updated.notes })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const updated = updateData((d) => ({
    ...d,
    notes: (d.notes || []).map((n) =>
      n.id === body.id ? { ...n, text: body.text, color: body.color ?? n.color, updatedAt: new Date().toISOString() } : n
    ),
  }))
  return NextResponse.json({ notes: updated.notes })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const updated = updateData((d) => ({ ...d, notes: (d.notes || []).filter((n) => n.id !== id) }))
  return NextResponse.json({ notes: updated.notes })
}
