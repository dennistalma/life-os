import { NextRequest, NextResponse } from 'next/server'
import { classifyInput } from '@/lib/classifier'
import { updateData } from '@/lib/storage'
import { Category } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Kein Input angegeben' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const result = await classifyInput(input.trim(), today)

    const updatedData = updateData((data) => {
      const category: Category = result.category
      if (category === 'todo') {
        data.todos = [result.data as never, ...data.todos]
      } else if (category === 'calendar') {
        data.events = [result.data as never, ...data.events]
      } else if (category === 'finance') {
        data.transactions = [result.data as never, ...data.transactions]
      } else if (category === 'habit') {
        data.habits = [result.data as never, ...data.habits]
      } else if (category === 'goal') {
        data.goals = [result.data as never, ...data.goals]
      }
      return data
    })

    return NextResponse.json({ result, data: updatedData })
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
