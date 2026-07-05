'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, Plus, ImagePlus, Loader2, AlertCircle, FileUp, Check } from 'lucide-react'
import { PrivateExpense, AppData } from '@/lib/types'

interface ImportCandidate {
  date: string
  description: string
  amount: number
  currency: string
  type: string
  category: string
  include: boolean
}

const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

const CATEGORIES = ['Benzin', 'Essen', 'Zigaretten', 'Freizeit', 'Kleidung', 'Sonstiges']

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

function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || ''
      resolve({ base64, mediaType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PrivatPage() {
  const [expenses, setExpenses] = useState<PrivateExpense[]>([])
  const [loaded, setLoaded] = useState(false)

  const [date, setDate] = useState(today())
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [categoryPending, setCategoryPending] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const scanningRef = useRef(false)

  const [importCandidates, setImportCandidates] = useState<ImportCandidate[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(amount.replace(',', '.'))
    if (!value || value <= 0) return
    setSaving(true)
    const entry: PrivateExpense = {
      id: crypto.randomUUID(),
      date,
      category,
      amount: value,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    await persist([entry, ...expenses])
    setAmount('')
    setNote('')
    setCategoryPending(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await persist(expenses.filter((e) => e.id !== id))
  }

  async function processScan(file: File) {
    setScanning(true)
    scanningRef.current = true
    setScanError('')
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const res = await fetch('/api/privat/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler bei der Erkennung')

      const extraction = json.extraction
      setDate(extraction.date)
      setAmount(String(extraction.amount).replace('.', ','))
      setNote(extraction.note || '')
      setCategory(extraction.category)
      setCategoryPending(true)
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
      scanningRef.current = false
    }
  }

  function handleScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processScan(file)
    e.target.value = ''
  }

  function handleScanDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processScan(file)
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportCandidates(null)
    try {
      const { base64 } = await fileToBase64(file)
      const res = await fetch('/api/privat/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, filename: file.name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Import')
      setImportCandidates(json.candidates)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setImporting(false)
    }
  }

  function updateCandidate(index: number, patch: Partial<ImportCandidate>) {
    setImportCandidates((prev) =>
      prev ? prev.map((c, i) => (i === index ? { ...c, ...patch } : c)) : prev
    )
  }

  async function handleImportConfirm() {
    if (!importCandidates) return
    const toAdd = importCandidates.filter((c) => c.include)
    if (toAdd.length === 0) {
      setImportCandidates(null)
      return
    }
    setSaving(true)
    const now = new Date().toISOString()
    const newEntries: PrivateExpense[] = toAdd.map((c) => ({
      id: crypto.randomUUID(),
      date: c.date,
      category: c.category,
      amount: c.amount,
      note: c.description || undefined,
      createdAt: now,
    }))
    await persist([...newEntries, ...expenses])
    setImportCandidates(null)
    setSaving(false)
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (scanningRef.current) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            processScan(file)
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

        {/* Screenshot-Scan */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleScanDrop}
          className={`flex flex-col items-center justify-center gap-2 py-5 border border-dashed rounded-xl cursor-pointer transition-colors ${
            dragActive ? 'border-orange-500/70 bg-orange-500/5' : 'border-[#2a2a3d] hover:border-orange-500/40'
          }`}
        >
          {scanning ? (
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Screenshot wird gelesen...
            </div>
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-slate-500" />
              <span className="text-xs text-slate-500 text-center px-4">
                Screenshot hierher ziehen, mit Strg+V einfügen oder klicken zum Hochladen
              </span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleScanFile} className="hidden" disabled={scanning} />
        </label>

        {scanError && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" /> {scanError}
          </div>
        )}

        {/* CSV-Import (Revolut) */}
        <div className="card-base p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-cyan-400" /> Revolut-Auszug importieren
          </h2>
          <p className="text-xs text-slate-500">
            Export in der Revolut-App unter Kontoauszug → Excel (oder CSV), dann hier hochladen.
          </p>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 cursor-pointer transition-all w-fit">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {importing ? 'Wird analysiert...' : 'Datei auswählen'}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvFile} className="hidden" disabled={importing} />
          </label>

          {importError && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" /> {importError}
            </div>
          )}

          {importCandidates && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-amber-400">
                {importCandidates.filter((c) => c.include).length} von {importCandidates.length} Buchungen ausgewählt — Kategorien prüfen und bei Bedarf anpassen.
              </p>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {importCandidates.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-[#1f1f2e]/50 last:border-0">
                    <input
                      type="checkbox"
                      checked={c.include}
                      onChange={(e) => updateCandidate(i, { include: e.target.checked })}
                      className="accent-cyan-500"
                    />
                    <span className="text-slate-500 font-mono w-20 flex-shrink-0">{c.date}</span>
                    <span className="text-slate-400 flex-1 truncate">{c.description}</span>
                    <select
                      value={c.category}
                      onChange={(e) => updateCandidate(i, { category: e.target.value })}
                      className="bg-[#14141c] border border-[#1f1f2e] rounded px-1.5 py-1 text-slate-200 flex-shrink-0"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="text-slate-200 font-medium w-16 text-right flex-shrink-0">{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setImportCandidates(null)}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 disabled:opacity-40 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {importCandidates.filter((c) => c.include).length} Einträge importieren
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Schnelleingabe */}
        <form onSubmit={handleAdd} className="card-base p-4 space-y-3">
          {categoryPending && (
            <p className="text-xs text-amber-400">Aus Screenshot übernommen — bitte Kategorie prüfen.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#14141c] border border-[#1f1f2e] rounded-lg px-2 py-1.5 text-sm text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Kategorie</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setCategoryPending(false) }}
                className={`w-full bg-[#14141c] border rounded-lg px-2 py-1.5 text-sm text-slate-200 ${
                  categoryPending ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-[#1f1f2e]'
                }`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Betrag (€)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#14141c] border border-[#1f1f2e] rounded-lg px-2 py-1.5 text-sm text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Notiz (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#14141c] border border-[#1f1f2e] rounded-lg px-2 py-1.5 text-sm text-slate-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-30 transition-all"
          >
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </form>

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
