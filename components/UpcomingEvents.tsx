'use client'

import { useEffect, useState } from 'react'
import { Bell, Calendar, ExternalLink } from 'lucide-react'
import { CalendarEvent } from '@/lib/types'
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  localEvents: CalendarEvent[]
}

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return { label: 'Heute', color: 'text-orange-400 bg-orange-500/10' }
  if (isTomorrow(d)) return { label: 'Morgen', color: 'text-yellow-400 bg-yellow-500/10' }
  const diff = differenceInDays(d, new Date())
  if (diff <= 7) return { label: `in ${diff} Tagen`, color: 'text-cyan-400 bg-cyan-500/10' }
  return { label: format(d, 'dd. MMM', { locale: de }), color: 'text-slate-400 bg-white/5' }
}

export default function UpcomingEvents({ localEvents }: Props) {
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    fetch('/api/google/events')
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setGoogleEvents(d.events || []))
      .catch(() => {})
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = [...localEvents, ...googleEvents]
    .filter(e => e.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.time ?? '').localeCompare(b.time ?? '')
    })
    .slice(0, 8)

  if (upcoming.length === 0) return null

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-400" /> Nächste Termine
        </h2>
        <Link href="/kalender" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Kalender
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {upcoming.map(event => {
          const { label, color } = dayLabel(event.date)
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/20 border border-white/5"
            >
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${color}`}>
                {label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{event.title}</p>
                {event.description && (
                  <p className="text-[10px] text-slate-600 truncate">{event.description}</p>
                )}
              </div>
              {event.time && (
                <span className="text-xs text-slate-500 flex-shrink-0">{event.time.slice(0, 5)}</span>
              )}
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.source === 'google' ? 'bg-blue-400' : 'bg-cyan-400'}`} />
            </div>
          )
        })}
      </div>

      {upcoming.some(e => isToday(parseISO(e.date))) && (
        <div className="flex items-center gap-2 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] text-orange-400/70">
            {upcoming.filter(e => isToday(parseISO(e.date))).length} Termin{upcoming.filter(e => isToday(parseISO(e.date))).length !== 1 ? 'e' : ''} heute
          </span>
        </div>
      )}
    </div>
  )
}
