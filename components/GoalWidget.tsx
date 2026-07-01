'use client'

import { Goal } from '@/lib/types'
import { format, parseISO, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  goals: Goal[]
}

const TIMEFRAME_LABELS: Record<string, string> = {
  week: 'Diese Woche',
  month: 'Diesen Monat',
  quarter: 'Dieses Quartal',
  year: 'Dieses Jahr',
  custom: 'Individuell',
}

export default function GoalWidget({ goals }: Props) {
  const active = goals.filter((g) => !g.completed)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-orange-400">🎯</span> Ziele
        </h2>
        <span className="text-xs text-slate-500">{active.length} aktiv</span>
      </div>

      {goals.length === 0 ? (
        <p className="text-xs text-slate-600 py-2">Tippe z.B. "Bis Ende Juli neue Website fertig" um ein Ziel zu setzen.</p>
      ) : (
        <div className="space-y-3">
          {active.map((goal) => {
            const daysLeft = goal.deadline
              ? differenceInDays(parseISO(goal.deadline), new Date())
              : null
            const progress = Math.min(100, Math.max(0, goal.progress || 0))

            return (
              <div key={goal.id} className="p-3 rounded-lg border border-orange-500/15 bg-orange-500/5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm text-slate-200 font-medium">{goal.title}</p>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {TIMEFRAME_LABELS[goal.timeframe]}
                  </span>
                </div>
                {goal.description && (
                  <p className="text-xs text-slate-500 mb-2">{goal.description}</p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-[#0a0a0f] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-orange-400 font-medium">{progress}%</span>
                </div>
                <div className="flex items-center justify-between">
                  {goal.deadline && (
                    <span className="text-xs text-slate-500">
                      Deadline: {format(parseISO(goal.deadline), 'dd. MMM yyyy', { locale: de })}
                    </span>
                  )}
                  {daysLeft !== null && (
                    <span className={`text-xs font-medium ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 14 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {daysLeft > 0 ? `${daysLeft} Tage` : daysLeft === 0 ? 'Heute!' : `${Math.abs(daysLeft)} Tage überfällig`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
