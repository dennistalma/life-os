'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, CheckCircle, AlertCircle, Receipt as ReceiptIcon } from 'lucide-react'
import { AppData } from '@/lib/types'
import { ReceiptExtraction } from '@/lib/receiptExtractor'

interface Props {
  onDataUpdate: (data: AppData) => void
}

type Status = 'idle' | 'reading' | 'form' | 'saving' | 'success' | 'error'

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

export default function ReceiptCapture({ onDataUpdate }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [image, setImage] = useState<{ base64: string; mediaType: string; previewUrl: string } | null>(null)
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('reading')
    setErrorMsg('')
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const previewUrl = URL.createObjectURL(file)
      setImage({ base64, mediaType, previewUrl })

      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler bei der Erkennung')

      setExtraction(json.extraction)
      setStatus('form')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setStatus('error')
    }
  }

  async function handleConfirm() {
    if (!extraction || !image) return
    setStatus('saving')
    try {
      const res = await fetch('/api/receipt/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image.base64,
          mediaType: image.mediaType,
          extractedRaw: JSON.stringify(extraction),
          vendor: extraction.vendor,
          description: extraction.description,
          date: extraction.date,
          amount: extraction.grossAmount,
          netAmount: extraction.netAmount,
          vatAmount: extraction.vatAmount,
          vatRate: extraction.vatRate,
          type: extraction.type,
          category: extraction.category,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fehler beim Speichern')

      onDataUpdate(json.data)
      setStatus('success')
      setTimeout(reset, 2500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setStatus('error')
    }
  }

  function reset() {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setExtraction(null)
    setStatus('idle')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function updateField<K extends keyof ReceiptExtraction>(key: K, value: ReceiptExtraction[K]) {
    setExtraction((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  return (
    <div className="card-base p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <ReceiptIcon className="w-4 h-4 text-cyan-400" /> Beleg scannen
      </h2>

      {status === 'idle' && (
        <label className="flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-[#2a2a3d] rounded-xl hover:border-cyan-500/40 cursor-pointer transition-colors">
          <Camera className="w-6 h-6 text-slate-500" />
          <span className="text-xs text-slate-500">Foto/Screenshot einer Rechnung hochladen</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      )}

      {status === 'reading' && (
        <div className="flex items-center gap-2 py-6 justify-center text-sm text-cyan-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Beleg wird gelesen...
        </div>
      )}

      {(status === 'form' || status === 'saving') && extraction && image && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <img src={image.previewUrl} alt="Beleg" className="w-20 h-20 object-cover rounded-lg border border-[#2a2a3d]" />
            <div className="flex-1 text-xs text-slate-500">
              KI-Erkennung: {Math.round(extraction.confidence * 100)}% sicher – bitte prüfen und ggf. korrigieren.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500 space-y-1">
              Beschreibung
              <input
                type="text"
                value={extraction.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Aussteller
              <input
                type="text"
                value={extraction.vendor ?? ''}
                onChange={(e) => updateField('vendor', e.target.value)}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Datum
              <input
                type="date"
                value={extraction.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Typ
              <select
                value={extraction.type}
                onChange={(e) => updateField('type', e.target.value as 'income' | 'expense')}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              >
                <option value="expense">Ausgabe</option>
                <option value="income">Einnahme</option>
              </select>
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Brutto (€)
              <input
                type="number"
                step="0.01"
                value={extraction.grossAmount}
                onChange={(e) => updateField('grossAmount', Number(e.target.value))}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Netto (€)
              <input
                type="number"
                step="0.01"
                value={extraction.netAmount}
                onChange={(e) => updateField('netAmount', Number(e.target.value))}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              MwSt. (€)
              <input
                type="number"
                step="0.01"
                value={extraction.vatAmount}
                onChange={(e) => updateField('vatAmount', Number(e.target.value))}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              Kategorie
              <input
                type="text"
                value={extraction.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full bg-[#0f0f16] border border-[#2a2a3d] rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-cyan-500/50"
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={reset}
              disabled={status === 'saving'}
              className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              disabled={status === 'saving'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 hover:border-cyan-500/60 disabled:opacity-40 transition-all"
            >
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Bestätigen &amp; speichern
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 py-4 justify-center text-sm text-green-400">
          <CheckCircle className="w-4 h-4" /> Beleg gespeichert
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  )
}
