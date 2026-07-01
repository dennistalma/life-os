'use client'

import { useEffect, useState } from 'react'
import { Save, ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { SocialKnowledgeBase } from '@/lib/social-kb'

const empty: SocialKnowledgeBase = {
  brandName: '', brandDescription: '', targetAudience: '', brandVoice: '',
  seoKeywords: [], instagramHashtags: [], tiktokHashtags: [], adKeywords: [],
  postTemplates: [], updatedAt: '',
}

function TagInput({ label, tags, onChange, placeholder }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim().replace(/^#/, '')
    if (val && !tags.includes(val)) { onChange([...tags, val]); setInput('') }
  }

  return (
    <div>
      <label className="text-xs text-slate-500 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
        {tags.map((t, i) => (
          <span key={i} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
            {t}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))}><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder={placeholder || 'Enter drücken zum Hinzufügen'}
          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pink-500/50" />
        <button onClick={add} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-sm"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

export default function SocialSettingsPage() {
  const [kb, setKb] = useState<SocialKnowledgeBase>(empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/social/kb').then(r => r.json()).then(setKb)
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/social/kb', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kb),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function field(key: keyof SocialKnowledgeBase, label: string, placeholder?: string, rows = 1) {
    return (
      <div>
        <label className="text-xs text-slate-500 mb-1 block">{label}</label>
        {rows > 1 ? (
          <textarea value={kb[key] as string} onChange={e => setKb({ ...kb, [key]: e.target.value })}
            placeholder={placeholder} rows={rows}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 resize-none" />
        ) : (
          <input value={kb[key] as string} onChange={e => setKb({ ...kb, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pink-500/50" />
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-semibold text-slate-100">Social Media Wissensdatenbank</h1>
          </div>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
            <Save className="w-4 h-4" />
            {saved ? '✓ Gespeichert' : saving ? 'Speichere...' : 'Speichern'}
          </button>
        </div>

        <div className="card-base p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300">Markeninfo</h2>
          {field('brandName', 'Markenname', 'z.B. TalmaWoodLamps')}
          {field('brandDescription', 'Markenbeschreibung', 'Was verkaufst du? Was macht dich besonders?', 3)}
          {field('targetAudience', 'Zielgruppe', 'z.B. Frauen 25-45, Inneneinrichtung-Fans, nachhaltig denkend', 2)}
          {field('brandVoice', 'Tonalität', 'z.B. warm, handgemacht, gemütlich, authentisch')}
        </div>

        <div className="card-base p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300">Keywords & SEO</h2>
          <TagInput label="SEO-Keywords (werden in Captions eingebaut)" tags={kb.seoKeywords}
            onChange={v => setKb({ ...kb, seoKeywords: v })} placeholder="z.B. Holzlampe, handgemacht..." />
          <TagInput label="Anzeigen-Keywords (Google/Meta Ads)" tags={kb.adKeywords}
            onChange={v => setKb({ ...kb, adKeywords: v })} placeholder="z.B. Lampe kaufen, Holzdeko..." />
        </div>

        <div className="card-base p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300">Hashtags</h2>
          <TagInput label="Instagram Hashtags" tags={kb.instagramHashtags}
            onChange={v => setKb({ ...kb, instagramHashtags: v })} placeholder="#holzlampe #handmade..." />
          <TagInput label="TikTok Hashtags" tags={kb.tiktokHashtags}
            onChange={v => setKb({ ...kb, tiktokHashtags: v })} placeholder="#holzdeko #fyp..." />
        </div>

        <div className="card-base p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-300">Post-Vorlagen</h2>
          <TagInput label="Wiederholende Sätze / CTAs" tags={kb.postTemplates}
            onChange={v => setKb({ ...kb, postTemplates: v })}
            placeholder="z.B. Link in Bio, DM für Bestellungen..." />
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
          <Save className="w-4 h-4" />
          {saved ? '✓ Gespeichert!' : 'Alles speichern'}
        </button>
      </div>
    </main>
  )
}
