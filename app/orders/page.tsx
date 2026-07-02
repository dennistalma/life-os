'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, ShoppingBag, Package, ExternalLink, Truck, Check, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  platform: 'wix' | 'etsy' | 'email'
  orderNumber: string
  customer: string
  customerEmail?: string
  product: string
  amount: number
  currency: string
  status: string
  date: string
  shippingDeadline?: string
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
  'Versandt': 'text-green-400', 'Bestätigt': 'text-cyan-400',
  'Ausstehend': 'text-yellow-400', 'Storniert': 'text-red-400',
  'Teilversandt': 'text-orange-400', 'Neu': 'text-pink-400',
}

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function OrderRow({ order, onFulfilled }: { order: Order; onFulfilled: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [tracking, setTracking] = useState('')
  const [carrier, setCarrier] = useState('DHL')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(order.status === 'Versandt')
  const [error, setError] = useState('')

  const p = PLATFORM_STYLE[order.platform]
  const statusColor = STATUS_COLOR[order.status] || 'text-slate-400'

  async function fulfill() {
    if (!tracking.trim() && order.platform === 'wix') {
      setError('Bitte Sendungsnummer eingeben')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          platform: order.platform,
          trackingNumber: tracking,
          carrier,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fehler beim Versenden')
      } else {
        setSent(true)
        setExpanded(false)
        onFulfilled(order.id)
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={`card-base transition-all ${sent ? 'opacity-60' : ''}`}>
      {/* Main row */}
      <div className="p-4 flex items-center gap-3">
        {/* Versandt-Haken */}
        <button
          onClick={() => sent ? null : setExpanded(!expanded)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            sent
              ? 'bg-green-500 border-green-500'
              : 'border-slate-600 hover:border-green-500'
          }`}
        >
          {sent && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Platform */}
        <span className={`flex-shrink-0 text-xs px-2.5 py-0.5 rounded-full border ${p.bg} ${p.text} ${p.border} font-medium`}>
          {p.label}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{order.customer}</span>
            <span className="text-xs text-slate-600">#{order.orderNumber}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">{order.product}</p>
        </div>

        {/* Amount + status */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-slate-200">
            {order.amount > 0 ? fmt(order.amount, order.currency) : '—'}
          </p>
          <p className={`text-xs ${sent ? 'text-green-400' : statusColor}`}>
            {sent ? 'Versandt ✓' : order.status}
          </p>
        </div>

        {/* Date */}
        <span className="text-xs text-slate-600 flex-shrink-0 hidden md:block">
          {formatDate(order.date)}
        </span>

        {/* External link */}
        {order.link && (
          <a href={order.link} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Expand */}
        {!sent && (
          <button onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded: shipping form */}
      {expanded && !sent && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <span className="text-slate-600">Bestellnummer:</span>
              <span className="ml-2 text-slate-300">#{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-600">Artikel:</span>
              <span className="ml-2 text-slate-300">{order.product}</span>
            </div>
            <div>
              <span className="text-slate-600">Bestellt am:</span>
              <span className="ml-2 text-slate-300">{formatDate(order.date)}</span>
            </div>
            <div>
              <span className="text-slate-600">Betrag:</span>
              <span className="ml-2 text-slate-300">{fmt(order.amount, order.currency)}</span>
            </div>
          </div>

          {order.platform === 'etsy' ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-xs text-orange-300">
              Etsy API noch nicht freigegeben — bitte manuell auf Etsy als versandt markieren.
              <a href="https://www.etsy.com/your/orders/sold" target="_blank" rel="noopener noreferrer"
                className="ml-2 underline">Etsy öffnen →</a>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select value={carrier} onChange={e => setCarrier(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-orange-500/40 flex-shrink-0">
                  <option value="DHL">DHL</option>
                  <option value="Hermes">Hermes</option>
                  <option value="DPD">DPD</option>
                  <option value="GLS">GLS</option>
                  <option value="UPS">UPS</option>
                  <option value="Deutsche Post">Deutsche Post</option>
                  <option value="Other">Sonstiger</option>
                </select>
                <input
                  value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  placeholder="Sendungsnummer eingeben..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500/40"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={fulfill} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {sending ? 'Wird versendet...' : 'Als versandt markieren + Tracking senden'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'wix' | 'etsy' | 'open'>('open')

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

  function handleFulfilled(id: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Versandt' } : o))
  }

  const filtered = orders.filter(o => {
    if (filter === 'open') return o.status !== 'Versandt' && o.status !== 'Storniert'
    if (filter === 'wix') return o.platform === 'wix'
    if (filter === 'etsy') return o.platform === 'etsy'
    return true
  })

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

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

        <div className="flex gap-2">
          {(['open', 'all', 'wix', 'etsy'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${filter === f ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}>
              {f === 'open' ? 'Offen' : f === 'all' ? 'Alle' : f === 'wix' ? 'Wix' : 'Etsy'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Lade Bestellungen...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2">
            <ShoppingBag className="w-10 h-10" />
            <p>Keine offenen Bestellungen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(order => (
              <OrderRow key={order.id} order={order} onFulfilled={handleFulfilled} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
