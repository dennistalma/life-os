'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SocialAccount } from '@/lib/types'
import { RefreshCw, Unlink, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PLATFORMS = [
  {
    id: 'instagram' as const,
    name: 'Instagram',
    icon: '📸',
    description: 'Follower, Posts, Reichweite',
    color: 'border-pink-500/30 hover:border-pink-500/60',
    connectColor: 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20',
    authPath: '/api/auth/instagram',
    setupSteps: [
      'Geh auf developers.facebook.com',
      'Erstelle eine neue App (Typ: "Business")',
      'Füge das Produkt "Instagram Graph API" hinzu',
      'Trage Client ID & Secret in .env.local ein',
    ],
  },
  {
    id: 'tiktok' as const,
    name: 'TikTok',
    icon: '🎵',
    description: 'Follower, Videos, Likes',
    color: 'border-slate-500/30 hover:border-slate-400/60',
    connectColor: 'bg-slate-500/10 border-slate-500/30 text-slate-300 hover:bg-slate-500/20',
    authPath: '/api/auth/tiktok',
    setupSteps: [
      'Geh auf developers.tiktok.com',
      'Erstelle eine neue App',
      'Aktiviere "Login Kit" und "User Info"',
      'Trage Client Key & Secret in .env.local ein',
    ],
  },
]

export default function SocialPage() {
  return <Suspense><SocialPageInner /></Suspense>
}

function SocialPageInner() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/social').then((r) => r.json()).then(setAccounts)
  }, [])

  const successPlatform = searchParams.get('connected')
  const errorType = searchParams.get('error')

  async function handleRefresh(platform: string) {
    setRefreshing(platform)
    const res = await fetch('/api/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    const updated = await res.json()
    if (Array.isArray(updated)) setAccounts(updated)
    setRefreshing(null)
  }

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform)
    const res = await fetch('/api/social', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    const updated = await res.json()
    if (Array.isArray(updated)) setAccounts(updated)
    setDisconnecting(null)
  }

  function isConnected(platform: string) {
    return accounts.find((a) => a.platform === platform && a.connected)
  }

  function needsSetup(platform: string) {
    if (platform === 'instagram') return !process.env.NEXT_PUBLIC_INSTAGRAM_CONFIGURED
    if (platform === 'tiktok') return !process.env.NEXT_PUBLIC_TIKTOK_CONFIGURED
    return false
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-[#1e1e2a] text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Social Media</h1>
            <p className="text-xs text-slate-500">Accounts verbinden und Stats tracken</p>
          </div>
        </div>

        {successPlatform && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            {successPlatform === 'instagram' ? 'Instagram' : 'TikTok'} erfolgreich verbunden!
          </div>
        )}
        {errorType && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            Verbindung fehlgeschlagen. Prüfe deine API-Keys in .env.local
          </div>
        )}

        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id)
            const isRefreshing = refreshing === platform.id
            const isDisconnecting = disconnecting === platform.id

            return (
              <div key={platform.id} className={`card-base border ${platform.color} p-5 space-y-4 transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h2 className="font-semibold text-slate-200">{platform.name}</h2>
                      <p className="text-xs text-slate-500">{platform.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {connected ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Verbunden
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">Nicht verbunden</span>
                    )}
                  </div>
                </div>

                {connected ? (
                  <div className="space-y-3">
                    {connected.stats && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/30 rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-slate-200">{fmtNum(connected.stats.followers)}</p>
                          <p className="text-[10px] text-slate-500">Follower</p>
                        </div>
                        {connected.stats.posts !== undefined && (
                          <div className="bg-black/30 rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-slate-200">{fmtNum(connected.stats.posts)}</p>
                            <p className="text-[10px] text-slate-500">{platform.id === 'tiktok' ? 'Videos' : 'Posts'}</p>
                          </div>
                        )}
                        {connected.stats.likes !== undefined && (
                          <div className="bg-black/30 rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-slate-200">{fmtNum(connected.stats.likes)}</p>
                            <p className="text-[10px] text-slate-500">Likes</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefresh(platform.id)}
                        disabled={isRefreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 text-xs transition-colors disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Aktualisieren
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={isDisconnecting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors disabled:opacity-40"
                      >
                        <Unlink className="w-3 h-3" />
                        Trennen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                      <p className="text-xs font-medium text-amber-400 mb-2">Setup erforderlich:</p>
                      <ol className="space-y-1">
                        {platform.setupSteps.map((step, i) => (
                          <li key={i} className="text-xs text-slate-500 flex gap-2">
                            <span className="text-amber-500/50 flex-shrink-0">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <a
                      href={platform.authPath}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${platform.connectColor}`}
                    >
                      {platform.icon} Mit {platform.name} verbinden
                    </a>
                  </div>
                )}
              </div>
            )
          })}

          {/* Wix – coming soon */}
          <div className="card-base border border-blue-500/15 p-5 opacity-60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h2 className="font-semibold text-slate-400">Wix</h2>
                <p className="text-xs text-slate-600">Website-Besucher, Seitenaufrufe · Bald verfügbar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function fmtNum(n?: number): string {
  if (n === undefined) return '–'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
