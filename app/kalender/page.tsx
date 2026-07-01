'use client'

import { useEffect, useState } from 'react'
import { CalendarEvent } from '@/lib/types'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, addWeeks, subMonths, subWeeks,
  isSameMonth, isToday, parseISO, isSameDay,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type View = 'month' | 'week'

interface EventForm {
  id?: string
  title: string
  date: string
  time: string
  description: string
}

const emptyForm: EventForm = { title: '', date: '', time: '', description: '' }

export default function KalenderPage() {
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleSyncing, setGoogleSyncing] = useState(false)
  const [view, setView] = useState<View>('month')
  const [current, setCurrent] = useState(new Date())
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const events = [...localEvents, ...googleEvents]

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => setLocalEvents(d.events || []))
    syncGoogle()

    const params = new URLSearchParams(window.location.search)
    if (params.get('google') === 'connected') {
      window.history.replaceState({}, '', '/kalender')
      syncGoogle()
    }
  }, [])

  async function syncGoogle() {
    setGoogleSyncing(true)
    try {
      const res = await fetch('/api/google/events')
      if (res.status === 401) { setGoogleConnected(false); return }
      const data = await res.json()
      if (data.events) {
        setGoogleEvents(data.events)
        setGoogleConnected(true)
      }
    } catch {
      // not connected
    } finally {
      setGoogleSyncing(false)
    }
  }

  async function saveEvent() {
    if (!form.title || !form.date) return
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      const data = await res.json()
      let updatedEvents: CalendarEvent[]
      if (form.id) {
        updatedEvents = data.events.map((e: CalendarEvent) =>
          e.id === form.id
            ? { ...e, title: form.title, date: form.date, time: form.time || undefined, description: form.description || undefined }
            : e
        )
      } else {
        const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          title: form.title,
          date: form.date,
          time: form.time || undefined,
          description: form.description || undefined,
          createdAt: new Date().toISOString(),
          source: 'local',
        }
        updatedEvents = [newEvent, ...data.events]
      }
      await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, events: updatedEvents }),
      })
      setLocalEvents(updatedEvents)
    } finally {
      setForm(emptyForm)
      setEditing(false)
      setLoading(false)
    }
  }

  async function deleteEvent(id: string) {
    if (id.startsWith('google_')) {
      setGoogleEvents(prev => prev.filter(e => e.id !== id))
      return
    }
    const res = await fetch('/api/data')
    const data = await res.json()
    const updated = data.events.filter((e: CalendarEvent) => e.id !== id)
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, events: updated }),
    })
    setLocalEvents(updated)
  }

  function startEdit(event: CalendarEvent) {
    setForm({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time || '',
      description: event.description || '',
    })
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startNew(date?: string) {
    setForm({ ...emptyForm, date: date || '' })
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Month view
  function renderMonth() {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 })
    const days = []
    let d = start
    while (d <= end) { days.push(d); d = addDays(d, 1) }

    return (
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => (
            <div key={w} className="text-center text-xs text-slate-600 py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const dayEvents = events.filter(e => e.date === format(day, 'yyyy-MM-dd'))
            const inMonth = isSameMonth(day, current)
            const todayDay = isToday(day)
            return (
              <div
                key={i}
                onClick={() => startNew(format(day, 'yyyy-MM-dd'))}
                className={`min-h-[72px] p-1.5 rounded-lg border cursor-pointer transition-colors
                  ${todayDay ? 'border-orange-500/40 bg-orange-500/5' : 'border-white/5 hover:border-white/10'}
                  ${inMonth ? '' : 'opacity-30'}
                `}
              >
                <span className={`text-xs font-medium block mb-1 ${todayDay ? 'text-orange-400' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}
                      className={`text-[10px] rounded px-1 truncate cursor-pointer ${
                        e.source === 'google'
                          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      }`}
                    >
                      {e.time ? e.time + ' ' : ''}{e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-600">+{dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Week view
  function renderWeek() {
    const start = startOfWeek(current, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    const hours = Array.from({ length: 17 }, (_, i) => i + 7) // 7:00 - 23:00

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 mb-1">
            <div className="text-xs text-slate-700 px-2 py-1" />
            {days.map((day, i) => (
              <div
                key={i}
                className={`text-center py-1 rounded-lg cursor-pointer ${isToday(day) ? 'bg-orange-500/10' : ''}`}
                onClick={() => startNew(format(day, 'yyyy-MM-dd'))}
              >
                <p className="text-[10px] text-slate-500">{format(day, 'EEE', { locale: de })}</p>
                <p className={`text-sm font-medium ${isToday(day) ? 'text-orange-400' : 'text-slate-300'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
          {/* Time grid */}
          <div className="space-y-0">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-t border-white/5 min-h-[48px]">
                <div className="text-[10px] text-slate-700 px-2 pt-0.5">{hour}:00</div>
                {days.map((day, di) => {
                  const timeStr = `${String(hour).padStart(2, '0')}:`
                  const dayEvents = events.filter(e =>
                    isSameDay(parseISO(e.date), day) && e.time?.startsWith(timeStr)
                  )
                  return (
                    <div
                      key={di}
                      className="border-l border-white/5 px-0.5 py-0.5 space-y-0.5 cursor-pointer hover:bg-white/2"
                      onClick={() => startNew(format(day, 'yyyy-MM-dd'))}
                    >
                      {dayEvents.map(e => (
                        <div
                          key={e.id}
                          onClick={(ev) => { ev.stopPropagation(); startEdit(e) }}
                          className={`text-[10px] rounded px-1 py-0.5 cursor-pointer truncate ${
                            e.source === 'google'
                              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                          }`}
                        >
                          {e.time} {e.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function navigate(dir: 1 | -1) {
    if (view === 'month') setCurrent(dir === 1 ? addMonths(current, 1) : subMonths(current, 1))
    else setCurrent(dir === 1 ? addWeeks(current, 1) : subWeeks(current, 1))
  }

  const title = view === 'month'
    ? format(current, 'MMMM yyyy', { locale: de })
    : `${format(startOfWeek(current, { weekStartsOn: 1 }), 'dd.MM')} – ${format(endOfWeek(current, { weekStartsOn: 1 }), 'dd.MM.yyyy')}`

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Dashboard</Link>
            <h1 className="text-xl font-semibold text-slate-100">Kalender</h1>
          </div>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <button
                onClick={syncGoogle}
                disabled={googleSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
                title="Google Kalender synchronisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${googleSyncing ? 'animate-spin' : ''}`} />
                Google Sync
              </button>
            ) : (
              <a
                href="/api/auth/google"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors text-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                Google verbinden
              </a>
            )}
            <button
              onClick={() => startNew()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Termin
            </button>
          </div>
        </div>

        {/* Event form */}
        {editing && (
          <div className="card-base p-4 space-y-3 border border-cyan-500/20">
            <h3 className="text-sm font-medium text-slate-300">
              {form.id ? 'Termin bearbeiten' : 'Neuer Termin'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Titel *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#0e1419] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-[#0e1419] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-[#0e1419] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Beschreibung (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-[#0e1419] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveEvent}
                disabled={loading || !form.title || !form.date}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm disabled:opacity-40"
              >
                <Check className="w-4 h-4" /> Speichern
              </button>
              <button
                onClick={() => { setForm(emptyForm); setEditing(false) }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors text-sm"
              >
                <X className="w-4 h-4" /> Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Calendar nav */}
        <div className="card-base p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold text-slate-200 min-w-[180px] text-center capitalize">{title}</h2>
              <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${view === 'month' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Monat
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${view === 'week' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Woche
              </button>
            </div>
          </div>
          {view === 'month' ? renderMonth() : renderWeek()}
        </div>

        {/* Upcoming list */}
        <div className="card-base p-4 space-y-3">
          <h3 className="text-sm font-medium text-slate-400">Alle Termine</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-600">Noch keine Termine.</p>
          ) : (
            <div className="space-y-1.5">
              {[...events]
                .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
                .map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm text-slate-200 flex items-center gap-1.5">
                        {e.title}
                        {e.source === 'google' && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 rounded">Google</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(e.date), 'EEE, dd. MMM yyyy', { locale: de })}
                        {e.time ? ' · ' + e.time : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {e.source !== 'google' && (
                        <button
                          onClick={() => startEdit(e)}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteEvent(e.id)}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
