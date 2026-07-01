'use client'

import { useEffect, useState } from 'react'
import { AppData } from '@/lib/types'
import SmartCapture from '@/components/SmartCapture'
import ReceiptCapture from '@/components/ReceiptCapture'
import TodoWidget from '@/components/TodoWidget'
import DashboardCalendar from '@/components/DashboardCalendar'
import InstagramWidget from '@/components/InstagramWidget'
import TikTokWidget from '@/components/TikTokWidget'
import NotesWidget from '@/components/NotesWidget'
import RevenueOverview from '@/components/RevenueOverview'
import AnalyticsWidget from '@/components/AnalyticsWidget'
import WixWidget from '@/components/WixWidget'
import EmailWidget from '@/components/EmailWidget'
import EtsyWidget from '@/components/EtsyWidget'

function getGreeting(name: string): string {
  const h = new Date().getHours()
  if (h < 5) return `Nachtaktiv, ${name}?`
  if (h < 12) return `Guten Morgen, ${name}`
  if (h < 17) return `Guten Tag, ${name}`
  if (h < 22) return `Guten Abend, ${name}`
  return `Gute Nacht, ${name}`
}

const defaultData: AppData = {
  todos: [], events: [], transactions: [], habits: [], goals: [], userName: 'Dennis', social: [], notes: [], receipts: [],
}

export default function Home() {
  const [data, setData] = useState<AppData>(defaultData)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  function handleUpdate(updated: AppData) {
    setData(updated)
  }

  function handlePartialUpdate(partial: Partial<AppData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-semibold text-slate-100">
              {getGreeting(data.userName)}{' '}
              <span className="text-orange-400 text-glow-orange">👋</span>
            </h1>
            <span className="text-xs text-slate-600 font-mono">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-slate-600">Life OS</span>
            <span className="text-xs text-slate-700">·</span>
            <span className="text-xs text-slate-600">
              {data.todos.filter((t) => !t.completed).length} Aufgaben ·{' '}
              {data.habits.filter((h) => h.completedDates.includes(today.toISOString().split('T')[0])).length}/{data.habits.length} Habits heute
            </span>
          </div>
        </div>

        {/* Smart Capture */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-orange-500/50" />
            <span className="text-xs font-medium text-orange-400/80 uppercase tracking-widest">Smart Capture</span>
          </div>
          <SmartCapture onDataUpdate={handleUpdate} />
        </div>

        {/* Umsatz-Überblick */}
        {loaded && <RevenueOverview />}

        {/* Kalender - volle Höhe */}
        {loaded && <DashboardCalendar events={data.events} />}

        {/* To-Dos - volle Breite */}
        {loaded && (
          <TodoWidget todos={data.todos} onUpdate={handlePartialUpdate} />
        )}

        {/* Notizen (links) + Belege (rechts) */}
        {loaded && (
          <div className="grid grid-cols-2 gap-4">
            <NotesWidget />
            <ReceiptCapture onDataUpdate={handleUpdate} />
          </div>
        )}

        {/* E-Mails - volle Breite, 2 Spalten */}
        {loaded && <EmailWidget />}

        {/* Etsy Shop - volle Breite */}
        {loaded && <EtsyWidget />}

        {/* Wix Shop - volle Breite */}
        {loaded && <WixWidget />}

        {/* Google Analytics */}
        {loaded && <AnalyticsWidget />}

        {/* TikTok - volle Breite */}
        {loaded && <TikTokWidget />}

        {/* Instagram - volle Breite */}
        {loaded && <InstagramWidget />}

        {/* Footer */}
        <div className="pt-4 border-t border-[#1f1f2e] flex items-center justify-between">
          <span className="text-xs text-slate-700">Life OS · lokal gespeichert</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-slate-700">Anthropic API verbunden</span>
          </div>
        </div>
      </div>
    </main>
  )
}
