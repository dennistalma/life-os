'use client'

import { useState, useRef } from 'react'
import { Upload, Sparkles, Copy, ExternalLink, RefreshCw, Instagram, X } from 'lucide-react'
import Image from 'next/image'

type Platform = 'instagram' | 'tiktok'

const PLATFORM_URLS: Record<Platform, string> = {
  instagram: 'https://www.instagram.com/create/style/',
  tiktok: 'https://www.tiktok.com/upload',
}

export default function PostCreator() {
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [brief, setBrief] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setCaption('')
    setHashtags([])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/') || file?.type.startsWith('video/')) handleFile(file)
  }

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, brief }),
      })
      const data = await res.json()
      setCaption(data.caption || '')
      setHashtags(data.hashtags || [])
    } finally {
      setLoading(false)
    }
  }

  function copyAll() {
    const text = `${caption}\n\n${hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openPlatform() {
    copyAll()
    window.open(PLATFORM_URLS[platform], '_blank')
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" /> Post erstellen
        </h2>
        {/* Platform toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(['instagram', 'tiktok'] as Platform[]).map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs transition-colors ${platform === p ? 'bg-pink-500/20 text-pink-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {p === 'instagram' ? '📸 Instagram' : '♪ TikTok'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Upload + Brief */}
        <div className="space-y-3">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="relative border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-pink-500/40 transition-colors overflow-hidden"
            style={{ minHeight: 180 }}
          >
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="Vorschau" fill className="object-cover" unoptimized />
                <button
                  onClick={e => { e.stopPropagation(); setImageUrl(null) }}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
                <Upload className="w-6 h-6 text-slate-600" />
                <p className="text-xs text-slate-600">Bild hierher ziehen oder klicken</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

          {/* Brief */}
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="Was soll der Post zeigen? (z.B. Neue Lampen-Kollektion, Herbst-Sale...)"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 resize-none"
          />

          <button
            onClick={generate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg text-sm transition-colors disabled:opacity-40"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generiere...' : 'Caption generieren'}
          </button>
        </div>

        {/* Right: Caption + Hashtags */}
        <div className="space-y-3">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Caption erscheint hier..."
            rows={6}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 resize-none"
          />

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}

          {(caption || hashtags.length > 0) && (
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Kopiert!' : 'Alles kopieren'}
              </button>
              <button
                onClick={openPlatform}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {platform === 'instagram' ? 'Instagram öffnen' : 'TikTok öffnen'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
