'use client'

import { SocialAccount } from '@/lib/types'
import { RefreshCw, Users, Heart, Film, MessageCircle, Play } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

function fmtNum(n?: number): string {
  if (n === undefined || n === null) return '–'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

interface Props {
  accounts: SocialAccount[]
  onUpdate: (accounts: SocialAccount[]) => void
}

export default function SocialWidget({ accounts, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const instagram = accounts.find((a) => a.platform === 'instagram' && a.connected)

  useEffect(() => {
    if (instagram && !instagram.recentPosts) {
      loadPosts()
    }
  }, [instagram?.connected])

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/posts?platform=instagram')
      const json = await res.json()
      if (!res.ok) return
      // Reload full data
      const dataRes = await fetch('/api/social')
      const updated = await dataRes.json()
      if (Array.isArray(updated)) onUpdate(updated)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span>📊</span> Social Media
        </h2>
        <Link href="/social" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          Verwalten →
        </Link>
      </div>

      {!instagram ? (
        <div className="py-3 text-center space-y-2">
          <p className="text-xs text-slate-600">Noch kein Account verbunden.</p>
          <Link href="/social" className="inline-block text-xs px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors">
            Instagram verbinden →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-pink-500/30 flex-shrink-0">
              {instagram.profilePictureUrl ? (
                <Image
                  src={instagram.profilePictureUrl}
                  alt={instagram.username || ''}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {(instagram.username || 'S')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {instagram.displayName || instagram.username}
              </p>
              <p className="text-xs text-slate-500">@{instagram.username}</p>
            </div>
            <button
              onClick={loadPosts}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Row */}
          {instagram.stats && (
            <div className="grid grid-cols-3 gap-2">
              <StatBox icon={<Users className="w-3 h-3" />} label="Follower" value={fmtNum(instagram.stats.followers)} />
              <StatBox icon={<Film className="w-3 h-3" />} label="Posts" value={fmtNum(instagram.stats.posts)} />
              <StatBox icon={<Users className="w-3 h-3" />} label="Following" value={fmtNum(instagram.stats.following)} />
            </div>
          )}

          {/* Post Grid */}
          {loading && !instagram.recentPosts && (
            <div className="grid grid-cols-3 gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-[#1e1e2a] animate-pulse" />
              ))}
            </div>
          )}

          {instagram.recentPosts && instagram.recentPosts.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-2">Letzte Posts</p>
              <div className="grid grid-cols-3 gap-1">
                {instagram.recentPosts.slice(0, 6).map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.caption || 'Post'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="flex items-center gap-0.5 text-white text-xs">
                        <Heart className="w-3 h-3" /> {post.likeCount}
                      </span>
                      <span className="flex items-center gap-0.5 text-white text-xs">
                        <MessageCircle className="w-3 h-3" /> {post.commentsCount}
                      </span>
                    </div>
                    {/* Video indicator */}
                    {post.mediaType === 'VIDEO' && (
                      <div className="absolute top-1 right-1 bg-black/50 rounded p-0.5">
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-2">
      <div className="flex items-center gap-1 text-slate-500 mb-0.5">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-200">{value}</p>
    </div>
  )
}
