import { NextRequest, NextResponse } from 'next/server'
import { classifyInput } from '@/lib/classifier'
import { parsePrivateExpenseText } from '@/lib/privateExpenseExtractor'
import { updateDataAsync } from '@/lib/storage'
import { addToEurApp } from '@/lib/eurSync'
import { Category, CaptureResult, PrivateExpense, Transaction } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Kein Input angegeben' }, { status: 400 })
    }

    const trimmed = input.trim()
    const today = new Date().toISOString().split('T')[0]
    let result = await classifyInput(trimmed, today)

    // The dedicated private-expense parser is more reliable at picking the
    // exact category than the general-purpose classifier, so re-derive the
    // data once we know this is a privateExpense — keeps both capture entry
    // points (dashboard + /privat) consistent for the same input.
    if (result.category === 'privateExpense') {
      const extraction = await parsePrivateExpenseText(trimmed, today)
      const entry: PrivateExpense = {
        id: crypto.randomUUID(),
        date: extraction.date,
        category: extraction.category,
        amount: extraction.amount,
        note: extraction.note || undefined,
        createdAt: new Date().toISOString(),
      }
      result = { ...result, data: entry, confidence: extraction.confidence }
    }

    const updatedData = await updateDataAsync((data) => {
      const category: Category = result.category
      if (category === 'todo') {
        data.todos = [result.data as never, ...data.todos]
      } else if (category === 'calendar') {
        data.events = [result.data as never, ...data.events]
      } else if (category === 'finance') {
        data.transactions = [result.data as never, ...data.transactions]
      } else if (category === 'privateExpense') {
        data.privateExpenses = [result.data as never, ...data.privateExpenses]
      } else if (category === 'habit') {
        data.habits = [result.data as never, ...data.habits]
      } else if (category === 'goal') {
        data.goals = [result.data as never, ...data.goals]
      }
      return data
    })

    let addedToEur = false
    if (result.category === 'privateExpense') {
      const expense = result.data as PrivateExpense
      if (expense.category === 'SL') {
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          description: expense.note || trimmed,
          amount: expense.amount,
          type: 'expense',
          category: 'Spirit Lamps',
          date: expense.date,
          createdAt: new Date().toISOString(),
        }
        addedToEur = await addToEurApp(transaction)
      }
    }

    return NextResponse.json({ result: result as CaptureResult, addedToEur, data: updatedData })
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
}
