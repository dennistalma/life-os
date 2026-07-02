'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, ShoppingBag, Package, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  platform: 'wix' | 'etsy' | 'email'
  orderNumber: string
  customer: string
  product: string
  amount: number
  currency: string
  status: string
  date: string
  link?: string
}

interface Stats {
  total: number
  todayCount: number
  todayRevenue: number
  totalRevenue: number
  wixCount: number
  etsyCount: number
}

const PLATFORM_STYLE = {
  wix: { label: 'Wix', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  etsy: { label: 'Etsy', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  email: { label: 'E-Mail', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
}

const STATUS_COLOR: Record<string, string> = {
  'Versandt': 'text-green-400',
  'Bestätigt': 'text-cyan-400',
  'Ausstehend': 'text-yellow-400',
  'Storniert': 'text-red-400',
  'Teilversandt': 'text-orange-400',
  'Neu': 'text-pink-400',
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `vor ${d}d`
  if (h > 0) return `vor ${h}h`
  return 'gerade eben'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'wix' | 'etsy'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(data.orders || [])
      setStats(data.stats || null)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.platform === filter)

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-400" /> Bestellungen
            </h1>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-base p-4">
              <p className="text-xs text-slate-500 mb-1">Heute</p>
              <p className="text-2xl font-bold text-slate-100">{stats.todayCount}</p>
              <p className="text-xs text-green-400">{fmt(stats.todayRevenue)}</p>
            </div>
            <div className="card-base p-4">
              <p className="text-xs text-slate-500 mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
              <p className="text-xs text-slate-400">{fmt(stats.totalRevenue)}</p>
            </div>
            <div className="card-base p-4">
              <p className="text-xs text-slate-500 mb-1">Wix</p>
              <p className="text-2xl font-bold text-blue-400">{stats.wixCount}</p>
              <p className="text-xs text-slate-500">Bestellungen</p>
            </div>
            <div className="card-base p-4">
              <p className="text-xs text-slate-500 mb-1">Etsy</p>
              <p className="text-2xl font-bold text-orange-400">{stats.etsyCount}</p>
              <p className="text-xs text-slate-500">via E-Mail</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'wix', 'etsy'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}>
              {f === 'all' ? 'Alle' : f === 'wix' ? 'Wix' : 'Etsy'}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Lade Bestellungen...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2">
            <ShoppingBag className="w-10 h-10" />
            <p>Keine Bestellungen gefunden</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(order => {
              const p = PLATFORM_STYLE[order.platform]
              const statusColor = STATUS_COLOR[order.status] || 'text-slate-400'
              return (
                <div key={order.id} className="card-base p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  {/* Platform badge */}
                  <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border ${p.bg} ${p.text} ${p.border} font-medium w-14 text-center`}>
                    {p.label}
                  </span>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200 truncate">{order.customer}</span>
                      {order.orderNumber && (
                        <span className="text-xs text-slate-600">#{order.orderNumber}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{order.product}</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-200">
                      {order.amount > 0 ? fmt(order.amount, order.currency) : '—'}
                    </p>
                    <p className={`text-xs ${statusColor}`}>{order.status}</p>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-slate-600 flex-shrink-0 w-16 text-right">
                    {timeAgo(order.date)}
                  </span>

                  {/* Link */}
                  {order.link && (
                    <a href={order.link} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
