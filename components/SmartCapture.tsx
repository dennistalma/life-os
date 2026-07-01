'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { AppData, CaptureResult, Category } from '@/lib/types'

const CATEGORY_LABELS: Record<Category, { label: string; color: string; emoji: string }> = {
  todo: { label: 'To-Do', color: 'text-amber-400', emoji: '✓' },
  calendar: { label: 'Kalender', color: 'text-cyan-400', emoji: '📅' },
  finance: { label: 'Finanzen', color: 'text-green-400', emoji: '€' },
  habit: { label: 'Habit', color: 'text-purple-400', emoji: '🔄' },
  goal: { label: 'Ziel', color: 'text-orange-400', emoji: '🎯' },
}

const EXAMPLES = [
  'Morgen 14 Uhr Zahnarzt',
  '50€ für Holz ausgegeben',
  'Jeden Tag 30 Min lesen',
  'Bis Ende Juli neue Website fertig',
  'Steuererklärung einreichen – hohe Priorität',
]

interface Props {
  onDataUpdate: (data: AppData) => void
}

export default function SmartCapture({ onDataUpdate }: Props) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [lastResult, setLastResult] = useState<CaptureResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIdx((i) => (i + 1) % EXAMPLES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || status === 'loading') return

    setStatus('loading')
    setLastResult(null)
    setErrorMsg('')

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler')

      setLastResult(json.result)
      onDataUpdate(json.data)
      setInput('')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const catInfo = lastResult ? CATEGORY_LABELS[lastResult.category] : null

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative rounded-xl border transition-all duration-300 ${
            status === 'loading'
              ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
              : status === 'success'
              ? 'border-green-500/50 shadow-[0_0_25px_rgba(34,197,94,0.15)]'
              : status === 'error'
              ? 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
              : 'border-[#2a2a3d] hover:border-orange-500/40 focus-within:border-orange-500/60 focus-within:shadow-[0_0_25px_rgba(249,115,22,0.2)]'
          } bg-[#16161f]`}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex-shrink-0">
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : status === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-orange-400" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={EXAMPLES[exampleIdx]}
              disabled={status === 'loading'}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-base outline-none disabled:opacity-50 transition-colors"
              autoFocus
            />

            <button
              type="submit"
              disabled={!input.trim() || status === 'loading'}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/20 hover:border-orange-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? 'Analysiere...' : 'Erfassen'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      <div className="mt-3 min-h-[32px]">
        {status === 'success' && catInfo && lastResult && (
          <div className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-top-1 duration-300">
            <span className={`font-semibold ${catInfo.color}`}>
              {catInfo.emoji} {catInfo.label} erkannt
            </span>
            <span className="text-slate-500">–</span>
            <span className="text-slate-400">{lastResult.reasoning}</span>
            <span className="ml-auto text-slate-600 text-xs">
              {Math.round(lastResult.confidence * 100)}% sicher
            </span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
        {status === 'idle' && (
          <p className="text-xs text-slate-600">
            KI erkennt automatisch: Termin · To-Do · Finanzen · Habit · Ziel
          </p>
        )}
      </div>
    </div>
  )
}
