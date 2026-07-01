'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, Heart, MessageCircle, Share2, Play, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

function fmt(n?: number) {
  if (n === undefined || n === null) return '–'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

interface Video {
  id: string
  title: string
  createTime: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
}

interface Stats {
  followers: number
  following: number
  posts: number
  likes: number
}

export default function TikTokWidget() {
  const [username, setUsername] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tiktok/stats')
      const json = await res.json()
      if (json.error === 'not_connected') {
        setError('not_connected')
      } else if (!res.ok) {
        setError(json.error || 'Fehler')
      } else {
        setUsername(json.username || '')
        setStats(json.stats || null)
        setVideos(json.videos || [])
      }
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-slate-100">♪</span> TikTok
          {username && <span className="text-slate-500 font-normal">· {username}</span>}
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error === 'not_connected' && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-slate-500">TikTok noch nicht verbunden</p>
          <Link href="/social" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg text-sm transition-colors">
            <LinkIcon className="w-4 h-4" /> TikTok verbinden
          </Link>
        </div>
      )}

      {error && error !== 'not_connected' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Follower</p>
              <p className="text-lg font-bold text-slate-100">{fmt(stats.followers)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Following</p>
              <p className="text-lg font-bold text-slate-200">{fmt(stats.following)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Play className="w-3 h-3" /> Videos</p>
              <p className="text-lg font-bold text-slate-200">{fmt(stats.posts)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Gesamt-Likes</p>
              <p className="text-lg font-bold text-red-400">{fmt(stats.likes)}</p>
            </div>
          </div>

          {videos.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Letzte Videos</p>
              <div className="space-y-1">
                {videos.map(v => (
                  <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <Play className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <p className="flex-1 text-xs text-slate-400 truncate">{v.title || '(kein Titel)'}</p>
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      {new Date(v.createTime * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                      <Play className="w-3 h-3" /> {fmt(v.viewCount)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
                      <Heart className="w-3 h-3" /> {fmt(v.likeCount)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                      <MessageCircle className="w-3 h-3" /> {fmt(v.commentCount)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600 flex-shrink-0">
                      <Share2 className="w-3 h-3" /> {fmt(v.shareCount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && !loading && (
            <p className="text-xs text-slate-600 text-center py-2">
              Video-Statistiken erfordern die <span className="text-slate-500">video.list</span> Berechtigung — TikTok App neu verbinden
            </p>
          )}
        </>
      )}
    </div>
  )
}
