'use client'

import { useEffect, useState } from 'react'
import { Mail, RefreshCw, Circle } from 'lucide-react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { de } from 'date-fns/locale'

interface EmailMessage {
  id: string
  subject: string
  from: string
  date: string
  read: boolean
  preview: string
}

function formatDate(dateStr: string) {
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return 'Gestern'
    return format(d, 'dd.MM.', { locale: de })
  } catch {
    return ''
  }
}

function senderName(from: string) {
  const match = from.match(/^(.+?)\s*</)
  return match ? match[1].trim() : from.split('@')[0]
}

function EmailColumn({
  title,
  email,
  messages,
  loading,
  error,
  onRefresh,
  placeholder,
}: {
  title: string
  email: string
  messages: EmailMessage[]
  loading: boolean
  error: string
  onRefresh: () => void
  placeholder?: boolean
}) {
  const unreadCount = messages.filter(m => !m.read).length

  return (
    <div className="card-base p-4 space-y-3 flex-1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" />
          {title}
          {!placeholder && unreadCount > 0 && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
              {unreadCount} neu
            </span>
          )}
        </h2>
        {!placeholder && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {placeholder ? (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-600 mb-3">Noch nicht verbunden</p>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-black/20 opacity-30">
              <div className="flex-shrink-0 mt-1.5">
                <Circle className="w-2 h-2 text-slate-700" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-slate-700 rounded w-24" />
                <div className="h-2 bg-slate-800 rounded w-40" />
              </div>
              <div className="h-2 bg-slate-800 rounded w-8" />
            </div>
          ))}
          <p className="text-[10px] text-slate-700 text-center pt-2">spiritlamps@... · bald verfügbar</p>
        </div>
      ) : (
        <>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {loading && !error && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-[#1e1e2a] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-3">Keine E-Mails gefunden.</p>
          )}

          {!loading && !error && messages.length > 0 && (
            <div className="space-y-1">
              {messages.slice(0, 8).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                    !msg.read ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-black/20'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1.5">
                    {!msg.read
                      ? <Circle className="w-2 h-2 fill-blue-400 text-blue-400" />
                      : <Circle className="w-2 h-2 text-slate-700" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${!msg.read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                        {senderName(msg.from)}
                      </p>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">{formatDate(msg.date)}</span>
                    </div>
                    <p className={`text-xs truncate ${!msg.read ? 'text-slate-300' : 'text-slate-500'}`}>
                      {msg.subject}
                    </p>
                    {msg.preview && (
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">{msg.preview}</p>
                    )}
                  </div>
                </div>
              ))}
              {messages.length > 8 && (
                <p className="text-xs text-slate-600 text-center pt-1">+{messages.length - 8} weitere</p>
              )}
            </div>
          )}

          <p className="text-[10px] text-slate-700">{email}</p>
        </>
      )}
    </div>
  )
}

export default function EmailWidget() {
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/email')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setMessages(data.messages || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-px h-4 bg-blue-500/50" />
        <span className="text-xs font-medium text-blue-400/80 uppercase tracking-widest">E-Mails</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmailColumn
          title="Privat"
          email="dennis_talma@hotmail.de"
          messages={messages}
          loading={loading}
          error={error}
          onRefresh={load}
        />
        <EmailColumn
          title="Geschäftlich"
          email="spiritlamps@..."
          messages={[]}
          loading={false}
          error=""
          onRefresh={() => {}}
          placeholder
        />
      </div>
    </div>
  )
}
