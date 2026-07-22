'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, Loader2, AlertCircle, Sparkles, CheckCircle, X } from 'lucide-react'
import { PrivateExpense, AppData } from '@/lib/types'

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || ''
      resolve({ base64, mediaType: file.type || 'image/png' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

const CATEGORY_COLORS: Record<string, string> = {
  'Red Bull': 'bg-sky-400',
  Benzin: 'bg-orange-400',
  Trinken: 'bg-cyan-400',
  Tabak: 'bg-red-400',
  Essen: 'bg-green-400',
  Fixkosten: 'bg-purple-400',
  Poker: 'bg-emerald-400',
  Sonstiges: 'bg-slate-400',
  SL: 'bg-yellow-400',
}

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-slate-400'
}

const CATEGORY_ROW_BG: Record<string, string> = {
  'Red Bull': 'bg-sky-500/30',
  Benzin: 'bg-orange-500/30',
  Trinken: 'bg-cyan-500/30',
  Tabak: 'bg-red-500/30',
  Essen: 'bg-green-500/30',
  Fixkosten: 'bg-purple-500/30',
  Poker: 'bg-emerald-500/30',
  Sonstiges: 'bg-slate-500/30',
  SL: 'bg-yellow-500/30',
}

function categoryRowBg(cat: string): string {
  return CATEGORY_ROW_BG[cat] ?? 'bg-slate-500/10'
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + 'T00:00:00Z')
  const diffToMonday = (d.getUTCDay() + 6) % 7 // 0=Sun,1=Mon,... -> days since Monday
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - diffToMonday)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) }
}

function previousMonthKey(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export default function PrivatPage() {
  const [expenses, setExpenses] = useState<PrivateExpense[]>([])
  const [loaded, setLoaded] = useState(false)

  const [captureInput, setCaptureInput] = useState('')
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [captureResult, setCaptureResult] = useState<{ category: string; amount: number; confidence: number } | null>(null)
  const [captureError, setCaptureError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ base64: string; mediaType: string; previewUrl: string } | null>(null)
  const captureStatusRef = useRef(captureStatus)
  captureStatusRef.current = captureStatus

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

  async function submitCapture() {
    const body: { input?: string; imageBase64?: string; mediaType?: string } = {}
    if (captureInput.trim()) body.input = captureInput.trim()
    if (pendingImage) {
      body.imageBase64 = pendingImage.base64
      body.mediaType = pendingImage.mediaType
    }

    setCaptureStatus('loading')
    setCaptureError('')
    try {
      const res = await fetch('/api/privat/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      clearPendingImage()
      setCaptureStatus('success')
      setTimeout(() => setCaptureStatus('idle'), 4000)
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setCaptureStatus('error')
      setTimeout(() => setCaptureStatus('idle'), 5000)
    }
  }

  function handleCaptureSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!captureInput.trim() && !pendingImage) || captureStatus === 'loading') return
    submitCapture()
  }

  function clearPendingImage() {
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  async function attachImage(file: File) {
    if (captureStatusRef.current === 'loading') return
    const { base64, mediaType } = await fileToBase64(file)
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { base64, mediaType, previewUrl: URL.createObjectURL(file) }
    })
  }

  function handleDrop(e: React.DragEvent<HTMLFormElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) attachImage(file)
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (captureStatusRef.current === 'loading') return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            attachImage(file)
            break
          }
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [expenses]
  )

  const currentMonth = today().slice(0, 7)

  const thisMonthTotal = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === currentMonth).reduce((s, e) => s + e.amount, 0),
    [expenses, currentMonth]
  )

  const { start: weekStart, end: weekEnd } = useMemo(() => weekRange(today()), [])

  const thisWeekTotal = useMemo(
    () => expenses.filter((e) => e.date >= weekStart && e.date <= weekEnd).reduce((s, e) => s + e.amount, 0),
    [expenses, weekStart, weekEnd]
  )

  const lastMonth = useMemo(() => previousMonthKey(currentMonth), [currentMonth])

  const lastMonthTotal = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === lastMonth).reduce((s, e) => s + e.amount, 0),
    [expenses, lastMonth]
  )

  const monthDeltaPct = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : null

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
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-slate-100">Private Ausgaben</h1>

        {/* Schnellerfassung per Freitext */}
        <div className="space-y-2">
          <form
            onSubmit={handleCaptureSubmit}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className="relative"
          >
            <div
              className={`relative rounded-xl border transition-all duration-300 ${
                dragActive
                  ? 'border-orange-500/70 bg-orange-500/5'
                  : captureStatus === 'loading'
                  ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                  : captureStatus === 'success'
                  ? 'border-green-500/50 shadow-[0_0_25px_rgba(34,197,94,0.15)]'
                  : captureStatus === 'error'
                  ? 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                  : 'border-[#2a2a3d] hover:border-orange-500/40 focus-within:border-orange-500/60 focus-within:shadow-[0_0_25px_rgba(249,115,22,0.2)]'
              } ${dragActive ? '' : 'bg-[#16161f]'}`}
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
                {pendingImage && (
                  <div className="relative flex-shrink-0">
                    <img src={pendingImage.previewUrl} alt="Screenshot" className="w-9 h-9 object-cover rounded-lg border border-[#2a2a3d]" />
                    <button
                      type="button"
                      onClick={clearPendingImage}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#0a0a0f] border border-[#2a2a3d] flex items-center justify-center text-slate-500 hover:text-red-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={captureInput}
                  onChange={(e) => setCaptureInput(e.target.value)}
                  placeholder={
                    dragActive
                      ? 'Screenshot hier loslassen…'
                      : pendingImage
                      ? 'Optional: Notiz zum Screenshot ergänzen…'
                      : 'z.B. „80€ Benzin tanken“, „Energy Drink 2€“ oder Screenshot einfügen (Strg+V)'
                  }
                  disabled={captureStatus === 'loading'}
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-base outline-none disabled:opacity-50 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={(!captureInput.trim() && !pendingImage) || captureStatus === 'loading'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card-base p-4 space-y-1">
            <p className="text-xs text-slate-500">Diese Woche</p>
            <p className="text-xl font-semibold text-orange-400">{fmt(thisWeekTotal)}</p>
          </div>
          <div className="card-base p-4 space-y-1">
            <p className="text-xs text-slate-500">Diesen Monat gesamt</p>
            <p className="text-xl font-semibold text-orange-400">{fmt(thisMonthTotal)}</p>
            {lastMonthTotal > 0 && monthDeltaPct !== null && (
              <p className="text-xs text-slate-500">
                Vormonat {fmt(lastMonthTotal)} ·{' '}
                <span className={monthDeltaPct > 0 ? 'text-red-400' : monthDeltaPct < 0 ? 'text-green-400' : 'text-slate-500'}>
                  {monthDeltaPct > 0 ? '+' : ''}{monthDeltaPct}%
                </span>
              </p>
            )}
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
                  className={`flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg group ${categoryRowBg(e.category)}`}
                >
                  <span className="text-slate-200 font-medium font-mono text-xs w-20">{e.date}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryColor(e.category)}`} />
                  <span className="text-slate-200 font-medium w-24 truncate">{e.category}</span>
                  <span className="text-slate-200 font-medium flex-1 truncate text-xs">{e.note ?? ''}</span>
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
