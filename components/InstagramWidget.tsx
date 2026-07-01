'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Users, Heart, MessageCircle, Play, Image as ImageIcon, ExternalLink, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

function fmt(n?: number) {
  if (n === undefined || n === null) return '–'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

interface Post {
  id: string
  mediaType: string
  permalink: string
  timestamp: string
  likeCount: number
  commentsCount: number
  caption?: string
}

interface Profile {
  followers_count: number
  follows_count: number
  media_count: number
  name: string
}

export default function InstagramWidget() {
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/social/posts?platform=instagram')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Fehler')
      } else {
        setPosts(json.posts || [])
        setProfile(json.profile || null)
      }
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const totalLikes = posts.reduce((s, p) => s + p.likeCount, 0)
  const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0)

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-pink-400">●</span> Instagram
          {profile?.name && <span className="text-slate-500 font-normal">· {profile.name}</span>}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error === 'Nicht verbunden' && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-slate-500">Instagram noch nicht verbunden</p>
          <Link href="/social" className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-sm transition-colors">
            <LinkIcon className="w-4 h-4" /> Instagram verbinden
          </Link>
        </div>
      )}

      {error && error !== 'Nicht verbunden' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {!error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Follower</p>
              <p className="text-lg font-bold text-pink-400">{fmt(profile?.followers_count)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Following</p>
              <p className="text-lg font-bold text-slate-200">{fmt(profile?.follows_count)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Posts</p>
              <p className="text-lg font-bold text-slate-200">{fmt(profile?.media_count)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Likes (letzte 6)</p>
              <p className="text-lg font-bold text-red-400">{fmt(totalLikes)}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Kommentare</p>
              <p className="text-lg font-bold text-cyan-400">{fmt(totalComments)}</p>
            </div>
          </div>

          {/* Post list */}
          {posts.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Letzte Posts</p>
              <div className="space-y-1">
                {posts.map(post => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="w-6 flex-shrink-0 text-center">
                      {post.mediaType === 'VIDEO' ? (
                        <Play className="w-3.5 h-3.5 text-purple-400 inline" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-pink-400 inline" />
                      )}
                    </div>
                    <p className="flex-1 text-xs text-slate-400 truncate">
                      {post.caption || '(kein Text)'}
                    </p>
                    <span className="text-xs text-slate-600 flex-shrink-0">
                      {new Date(post.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
                      <Heart className="w-3 h-3" /> {fmt(post.likeCount)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                      <MessageCircle className="w-3 h-3" /> {fmt(post.commentsCount)}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-slate-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {loading && posts.length === 0 && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
