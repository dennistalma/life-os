'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash2, Loader2, AlertCircle, Sparkles, CheckCircle } from 'lucide-react'
import { PrivateExpense, AppData } from '@/lib/types'

const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

const CATEGORY_COLORS: Record<string, string> = {
  Benzin: 'bg-orange-400',
  Essen: 'bg-green-400',
  Zigaretten: 'bg-red-400',
  Freizeit: 'bg-cyan-400',
  Kleidung: 'bg-purple-400',
  Sonstiges: 'bg-slate-400',
}

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-slate-400'
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function PrivatPage() {
  const [expenses, setExpenses] = useState<PrivateExpense[]>([])
  const [loaded, setLoaded] = useState(false)

  const [captureInput, setCaptureInput] = useState('')
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [captureResult, setCaptureResult] = useState<{ category: string; amount: number; confidence: number } | null>(null)
  const [captureError, setCaptureError] = useState('')

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.privateExpenses ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function persist(updated: PrivateExpense[]) {
    setExpenses(updated)
    const current: AppData = await fetch('/api/data').then((r) => r.json())
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, privateExpenses: updated }),
    })
  }

  async function handleDelete(id: string) {
    await persist(expenses.filter((e) => e.id !== id))
  }

  async function handleCaptureSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!captureInput.trim() || captureStatus === 'loading') return
    setCaptureStatus('loading')
    setCaptureError('')
    try {
      const res = await fetch('/api/privat/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: captureInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler')

      setExpenses((prev) => [json.entry, ...prev])
      setCaptureResult({
        category: json.entry.category,
        amount: json.entry.amount,
        confidence: json.extraction.confidence,
      })
      setCaptureInput('')
      setCaptureStatus('success')
      setTimeout(() => setCaptureStatus('idle'), 4000)
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setCaptureStatus('error')
      setTimeout(() => setCaptureStatus('idle'), 5000)
    }
  }

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [expenses]
  )

  const currentMonth = today().slice(0, 7)

  const thisMonthTotal = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === currentMonth).reduce((s, e) => s + e.amount, 0),
    [expenses, currentMonth]
  )

  const byCategoryThisMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      if (monthKey(e.date) !== currentMonth) continue
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [expenses, currentMonth])

  const maxCategoryAmount = Math.max(1, ...byCategoryThisMonth.map(([, v]) => v))

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      map.set(monthKey(e.date), (map.get(monthKey(e.date)) ?? 0) + e.amount)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [expenses])

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-slate-100">Private Ausgaben</h1>

        {/* Schnellerfassung per Freitext */}
        <div className="space-y-2">
          <form onSubmit={handleCaptureSubmit} className="relative">
            <div
              className={`relative rounded-xl border transition-all duration-300 ${
                captureStatus === 'loading'
                  ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                  : captureStatus === 'success'
                  ? 'border-green-500/50 shadow-[0_0_25px_rgba(34,197,94,0.15)]'
                  : captureStatus === 'error'
                  ? 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                  : 'border-[#2a2a3d] hover:border-orange-500/40 focus-within:border-orange-500/60 focus-within:shadow-[0_0_25px_rgba(249,115,22,0.2)]'
              } bg-[#16161f]`}
            >
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex-shrink-0">
                  {captureStatus === 'loading' ? (
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : captureStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : captureStatus === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={captureInput}
                  onChange={(e) => setCaptureInput(e.target.value)}
                  placeholder="z.B. „80€ Benzin tanken“ oder „Energy Drink 2€“"
                  disabled={captureStatus === 'loading'}
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-base outline-none disabled:opacity-50 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!captureInput.trim() || captureStatus === 'loading'}
                  className="flex-shrink-0 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/20 hover:border-orange-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {captureStatus === 'loading' ? 'Erfasse...' : 'Erfassen'}
                </button>
              </div>
            </div>
          </form>
          <div className="min-h-[20px]">
            {captureStatus === 'success' && captureResult && (
              <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryColor(captureResult.category)}`} />
                <span className="text-slate-300 font-medium">{captureResult.category}</span>
                <span className="text-slate-500">–</span>
                <span className="text-slate-400">{fmt(captureResult.amount)}</span>
                <span className="ml-auto text-slate-600 text-xs">
                  {Math.round(captureResult.confidence * 100)}% sicher
                </span>
              </div>
            )}
            {captureStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" /> {captureError}
              </div>
            )}
            {captureStatus === 'idle' && (
              <p className="text-xs text-slate-600">Ohne Datumsangabe wird das heutige Datum verwendet.</p>
            )}
          </div>
        </div>

        {/* Monatsübersicht */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card-base p-4 space-y-1">
            <p className="text-xs text-slate-500">Diesen Monat gesamt</p>
            <p className="text-xl font-semibold text-orange-400">{fmt(thisMonthTotal)}</p>
          </div>
          <div className="card-base p-4 space-y-2">
            <p className="text-xs text-slate-500 mb-1">Nach Kategorie (dieser Monat)</p>
            {byCategoryThisMonth.length === 0 ? (
              <p className="text-xs text-slate-600">Noch keine Ausgaben diesen Monat.</p>
            ) : (
              <div className="space-y-1.5">
                {byCategoryThisMonth.map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-slate-400 truncate">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#1f1f2e] overflow-hidden">
                      <div
                        className={`h-full ${categoryColor(cat)}`}
                        style={{ width: `${(val / maxCategoryAmount) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-300 font-medium w-16 text-right">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nach Monat */}
        {byMonth.length > 1 && (
          <div className="card-base p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-300">Nach Monat</h2>
            <div className="space-y-1">
              {byMonth.map(([month, val]) => (
                <div key={month} className="flex items-center gap-3 text-sm py-1">
                  <span className="text-slate-500 w-20 font-mono">{month}</span>
                  <span className="text-slate-300 font-medium">{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="card-base p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Alle Einträge</h2>
          {!loaded ? (
            <p className="text-xs text-slate-600 py-2">Lädt…</p>
          ) : sorted.length === 0 ? (
            <p className="text-xs text-slate-600 py-2">Noch keine Ausgaben erfasst.</p>
          ) : (
            <div className="space-y-1">
              {sorted.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 text-sm py-1.5 border-b border-[#1f1f2e]/50 last:border-0 group"
                >
                  <span className="text-slate-500 font-mono text-xs w-20">{e.date}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryColor(e.category)}`} />
                  <span className="text-slate-400 w-24 truncate">{e.category}</span>
                  <span className="text-slate-500 flex-1 truncate text-xs">{e.note ?? ''}</span>
                  <span className="text-slate-200 font-medium">{fmt(e.amount)}</span>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
