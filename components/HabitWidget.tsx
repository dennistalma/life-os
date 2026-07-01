'use client'

import { Habit, AppData } from '@/lib/types'

interface Props {
  habits: Habit[]
  onUpdate: (data: Partial<AppData>) => void
}

export default function HabitWidget({ habits, onUpdate }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const completedToday = habits.filter((h) => h.completedDates.includes(today)).length

  async function toggleHabit(id: string) {
    const updated = habits.map((h) => {
      if (h.id !== id) return h
      const done = h.completedDates.includes(today)
      return {
        ...h,
        completedDates: done
          ? h.completedDates.filter((d) => d !== today)
          : [...h.completedDates, today],
      }
    })
    onUpdate({ habits: updated })
    const res = await fetch('/api/data')
    const d = await res.json()
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...d, habits: updated }),
    })
  }

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-purple-400">🔄</span> Habits
        </h2>
        <span className="text-xs text-slate-500">
          {completedToday}/{habits.length} heute
        </span>
      </div>

      {habits.length > 0 && (
        <div className="w-full bg-[#0a0a0f] rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: habits.length > 0 ? `${(completedToday / habits.length) * 100}%` : '0%' }}
          />
        </div>
      )}

      {habits.length === 0 ? (
        <p className="text-xs text-slate-600 py-2">Tippe z.B. "Jeden Tag 30 Min lesen" um einen Habit zu erstellen.</p>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => {
            const done = habit.completedDates.includes(today)
            const streak = calcStreak(habit.completedDates)
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  done
                    ? 'border-purple-500/40 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'border-[#1f1f2e] hover:border-[#2a2a3d] bg-[#0a0a0f]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  done ? 'border-purple-400 bg-purple-400' : 'border-slate-600'
                }`}>
                  {done && <span className="text-[10px] text-white font-bold">✓</span>}
                </div>
                <span className={`text-sm flex-1 text-left ${done ? 'text-slate-300' : 'text-slate-400'}`}>
                  {habit.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {streak > 1 && (
                    <span className="text-xs text-orange-400">🔥 {streak}</span>
                  )}
                  <span className="text-xs text-slate-600">
                    {habit.frequency === 'daily' ? 'täglich' : 'wöchentlich'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0
  const sorted = [...dates].sort().reverse()
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)

  for (const d of sorted) {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    const diff = (current.getTime() - date.getTime()) / 86400000
    if (diff > 1) break
    streak++
    current = date
  }
  return streak
}
