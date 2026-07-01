'use client'

import { useState, useEffect } from 'react'
import { CalendarEvent } from '@/lib/types'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isToday,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  events: CalendarEvent[]
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 - 20:00

export default function DashboardCalendar({ events }: Props) {
  const [current, setCurrent] = useState(new Date())
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    fetch('/api/google/events')
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setGoogleEvents(d.events || []))
      .catch(() => {})
  }, [])

  const allEvents = [...events, ...googleEvents]

  const weekStart = startOfWeek(current, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekEnd = addDays(weekStart, 6)
  const title = `${format(weekStart, 'dd. MMM', { locale: de })} – ${format(weekEnd, 'dd. MMM yyyy', { locale: de })}`

  return (
    <div className="card-base p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent(subWeeks(current, 1))}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-slate-200 min-w-[200px] text-center">
            {title}
          </h2>
          <button
            onClick={() => setCurrent(addWeeks(current, 1))}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent(new Date())}
            className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            Heute
          </button>
          <Link
            href="/kalender"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Termin
          </Link>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-8 gap-0.5">
        <div /> {/* Zeitspalte */}
        {days.map((day, i) => (
          <div
            key={i}
            className={`text-center py-2 rounded-lg ${isToday(day) ? 'bg-orange-500/10' : ''}`}
          >
            <p className="text-[10px] text-slate-500 uppercase">
              {format(day, 'EEE', { locale: de })}
            </p>
            <p className={`text-base font-semibold ${isToday(day) ? 'text-orange-400' : 'text-slate-300'}`}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[420px] space-y-0">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-t border-white/5 min-h-[44px]">
            <div className="text-[10px] text-slate-700 px-2 pt-1 select-none">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((day, di) => {
              const timeStr = `${String(hour).padStart(2, '0')}:`
              const dayStr = format(day, 'yyyy-MM-dd')
              const dayEvents = allEvents.filter(e =>
                e.date === dayStr && e.time?.startsWith(timeStr)
              )
              return (
                <Link
                  key={di}
                  href="/kalender"
                  className="border-l border-white/5 px-0.5 py-0.5 space-y-0.5 hover:bg-white/[0.02] transition-colors"
                >
                  {dayEvents.map(e => (
                    <div
                      key={e.id}
                      className={`text-[10px] rounded px-1 py-0.5 truncate ${
                        e.source === 'google'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {e.time?.slice(0, 5)} {e.title}
                    </div>
                  ))}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-cyan-500/20" />
          <span className="text-[10px] text-slate-600">Lokal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-blue-500/20" />
          <span className="text-[10px] text-slate-600">Google</span>
        </div>
      </div>
    </div>
  )
}
