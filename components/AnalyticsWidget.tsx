'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Users, Eye, MousePointer, RefreshCw, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

interface GAData {
  sessions: number
  users: number
  pageViews: number
  bounceRate: string
  days: { date: string; sessions: number; users: number }[]
}

export default function AnalyticsWidget() {
  const [data, setData] = useState<GAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      if (json.error === 'not_connected') setError('not_connected')
      else if (json.error === 'GA_PROPERTY_ID nicht konfiguriert') setError('no_property')
      else if (!res.ok) setError(json.error || 'Fehler')
      else setData(json)
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const maxSessions = data ? Math.max(...data.days.map(d => d.sessions), 1) : 1

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" /> Google Analytics
          <span className="text-slate-600 font-normal text-[10px]">letzte 30 Tage</span>
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error === 'not_connected' && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-slate-500">Google Analytics noch nicht verbunden</p>
          <Link href="/api/auth/google/analytics" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors">
            <LinkIcon className="w-4 h-4" /> Mit Google Analytics verbinden
          </Link>
        </div>
      )}

      {error === 'no_property' && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">GA Property ID fehlt in den Einstellungen</p>
          <p className="text-xs text-slate-600 mt-1">GA_PROPERTY_ID in Vercel Umgebungsvariablen eintragen</p>
        </div>
      )}

      {error && error !== 'not_connected' && error !== 'no_property' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><MousePointer className="w-3 h-3" /> Sessions</p>
              <p className="text-lg font-bold text-blue-400">{fmt(data.sessions)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Nutzer</p>
              <p className="text-lg font-bold text-slate-200">{fmt(data.users)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Seitenaufrufe</p>
              <p className="text-lg font-bold text-cyan-400">{fmt(data.pageViews)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Absprungrate</p>
              <p className="text-lg font-bold text-slate-200">{data.bounceRate}%</p>
            </div>
          </div>

          {/* Mini bar chart */}
          {data.days.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Sessions pro Tag</p>
              <div className="flex items-end gap-0.5 h-16">
                {data.days.map((d, i) => (
                  <div
                    key={i}
                    title={`${d.date}: ${d.sessions} Sessions`}
                    className="flex-1 bg-blue-500/30 hover:bg-blue-500/50 rounded-t-sm transition-colors cursor-default"
                    style={{ height: `${Math.max(4, (d.sessions / maxSessions) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
