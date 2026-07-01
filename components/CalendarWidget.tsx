'use client'

import { CalendarEvent } from '@/lib/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

interface Props {
  events: CalendarEvent[]
}

function formatEventDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Heute'
    if (isTomorrow(d)) return 'Morgen'
    return format(d, 'EEE, dd. MMM', { locale: de })
  } catch {
    return dateStr
  }
}

export default function CalendarWidget({ events }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => (a.date + (a.time || '')) .localeCompare(b.date + (b.time || '')))
    .slice(0, 5)

  return (
    <div className="card-base p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-cyan-400">📅</span> Kalender
        </h2>
        <Link href="/kalender" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          Alle ansehen →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-xs text-slate-600 py-2">Keine bevorstehenden Termine. Tippe z.B. "Morgen 14 Uhr Zahnarzt".</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0e1419] border border-cyan-500/10 hover:border-cyan-500/25 transition-colors"
            >
              <div className="flex-shrink-0 flex flex-col items-center min-w-[44px]">
                <span className="text-xs text-cyan-400 font-medium">
                  {formatEventDate(event.date)}
                </span>
                {event.time && (
                  <span className="text-xs text-slate-500">{event.time}</span>
                )}
              </div>
              <div className="w-px self-stretch bg-cyan-500/20" />
              <div>
                <p className="text-sm text-slate-200">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
