'use client'

import { useState, useEffect } from 'react'
import { CalendarEvent } from '@/lib/types'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface Props {
  events: CalendarEvent[]
}

const START_HOUR = 8
const END_HOUR = 20
const ROW_HEIGHT = 48 // px per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * ROW_HEIGHT
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - START_HOUR) + m / 60) * ROW_HEIGHT
}

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
          <button onClick={() => setCurrent(subWeeks(current, 1))} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-slate-200 min-w-[200px] text-center">{title}</h2>
          <button onClick={() => setCurrent(addWeeks(current, 1))} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent(new Date())} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
            Heute
          </button>
          <Link href="/kalender" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Termin
          </Link>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-8 gap-0.5">
        <div />
        {days.map((day, i) => (
          <div key={i} className={`text-center py-2 rounded-lg ${isToday(day) ? 'bg-orange-500/10' : ''}`}>
            <p className="text-[10px] text-slate-500 uppercase">{format(day, 'EEE', { locale: de })}</p>
            <p className={`text-base font-semibold ${isToday(day) ? 'text-orange-400' : 'text-slate-300'}`}>{format(day, 'd')}</p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-8 gap-0.5">
        {/* Time labels */}
        <div className="relative" style={{ height: TOTAL_HEIGHT }}>
          {HOURS.map(hour => (
            <div
              key={hour}
              className="absolute text-[10px] text-slate-700 px-1 select-none"
              style={{ top: (hour - START_HOUR) * ROW_HEIGHT - 6 }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const dayEvents = allEvents.filter(e => e.date === dayStr && e.time)

          return (
            <Link
              key={di}
              href="/kalender"
              className="relative border-l border-white/5 hover:bg-white/[0.01] transition-colors"
              style={{ height: TOTAL_HEIGHT }}
            >
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="absolute w-full border-t border-white/5"
                  style={{ top: (hour - START_HOUR) * ROW_HEIGHT }}
                />
              ))}

              {/* Events */}
              {dayEvents.map(e => {
                const top = timeToY(e.time!)
                const duration = e.duration ?? 60
                const height = Math.max((duration / 60) * ROW_HEIGHT, 18)
                const isGoogle = e.source === 'google'

                return (
                  <div
                    key={e.id}
                    className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden text-[10px] leading-tight ${
                      isGoogle
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40'
                        : 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40'
                    }`}
                    style={{ top, height }}
                    title={`${e.title} (${e.time}${e.duration ? `, ${e.duration} Min` : ''})`}
                  >
                    <span className="font-medium">{e.time?.slice(0, 5)}</span>
                    {height > 24 && <span className="block truncate">{e.title}</span>}
                    {height > 38 && e.duration && (
                      <span className="text-[9px] opacity-70">{e.duration} Min</span>
                    )}
                  </div>
                )
              })}
            </Link>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-cyan-500/30 border border-cyan-500/40" />
          <span className="text-[10px] text-slate-600">Lokal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-blue-500/30 border border-blue-500/40" />
          <span className="text-[10px] text-slate-600">Google</span>
        </div>
      </div>
    </div>
  )
}
