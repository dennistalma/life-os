'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  number: string
  status: string
  createdDate: string
  total: string
  currency: string
  buyerName: string
  lineItemsCount: number
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Ausstehend', color: 'text-yellow-400' },
    APPROVED: { label: 'Bestätigt', color: 'text-cyan-400' },
    CANCELED: { label: 'Storniert', color: 'text-red-400' },
    FULFILLED: { label: 'Versandt', color: 'text-green-400' },
    PARTIALLY_FULFILLED: { label: 'Teilversandt', color: 'text-orange-400' },
  }
  return map[status] || { label: status, color: 'text-slate-400' }
}

export default function WixWidget() {
  const [orders, setOrders] = useState<Order[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wix/orders')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setOrders(data.orders || [])
      setTotalRevenue(data.totalRevenue || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-400" /> Wix Shop
        </h2>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {!error && (
        <>
          {/* Stats - 4 Kacheln nebeneinander */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Gesamtumsatz</p>
              <p className="text-lg font-bold text-orange-400">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Bestellungen</p>
              <p className="text-lg font-bold text-slate-200">{orders.length}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Ø Bestellwert</p>
              <p className="text-lg font-bold text-cyan-400">
                {orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'} €
              </p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Web Sessions</p>
              <p className="text-lg font-bold text-slate-600">—</p>
              <p className="text-[9px] text-slate-700">bald verfügbar</p>
            </div>
          </div>

        </>
      )}

      <Link
        href="https://manage.wix.com"
        target="_blank"
        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        Wix öffnen <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  )
}
