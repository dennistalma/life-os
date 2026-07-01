'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'

interface RevenueData {
  etsy: { total: string; orders: number; connected: boolean }
  wix: { total: number; orders: number; connected: boolean }
}

export default function RevenueOverview() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [etsyRes, wixRes] = await Promise.allSettled([
      fetch('/api/etsy/shop'),
      fetch('/api/wix/orders'),
    ])

    const etsy = { total: '0.00', orders: 0, connected: false }
    const wix = { total: 0, orders: 0, connected: false }

    if (etsyRes.status === 'fulfilled' && etsyRes.value.ok) {
      const d = await etsyRes.value.json()
      if (!d.error) {
        etsy.total = d.totalRevenue ?? '0.00'
        etsy.orders = d.orderCount ?? 0
        etsy.connected = true
      }
    }

    if (wixRes.status === 'fulfilled' && wixRes.value.ok) {
      const d = await wixRes.value.json()
      if (!d.error) {
        wix.total = d.totalRevenue ?? 0
        wix.orders = d.orders?.length ?? 0
        wix.connected = true
      }
    }

    setData({ etsy, wix })
    setLoading(false)
  }

  const totalRevenue = data
    ? parseFloat(data.etsy.total) + data.wix.total
    : 0
  const totalOrders = data ? data.etsy.orders + data.wix.orders : 0

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" /> Umsatz-Überblick
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gesamt */}
        <div className="md:col-span-2 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-[10px] text-green-500/70 uppercase tracking-wider mb-1">Gesamt (Etsy + Wix)</p>
          <p className="text-3xl font-bold text-green-400">
            {loading ? '...' : `${totalRevenue.toFixed(2)} €`}
          </p>
          <p className="text-xs text-green-500/50 mt-1">{totalOrders} Bestellungen insgesamt</p>
        </div>

        {/* Etsy */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <p className="text-[10px] text-orange-500/70 uppercase tracking-wider mb-1">Etsy</p>
          <p className="text-xl font-bold text-orange-400">
            {loading ? '...' : data?.etsy.connected ? `${data.etsy.total} €` : '–'}
          </p>
          <p className="text-xs text-orange-500/50 mt-1">
            {data?.etsy.connected ? `${data.etsy.orders} Bestellungen` : 'nicht verbunden'}
          </p>
        </div>

        {/* Wix */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-[10px] text-blue-500/70 uppercase tracking-wider mb-1">Wix</p>
          <p className="text-xl font-bold text-blue-400">
            {loading ? '...' : data?.wix.connected ? `${data.wix.total.toFixed(2)} €` : '–'}
          </p>
          <p className="text-xs text-blue-500/50 mt-1">
            {data?.wix.connected ? `${data.wix.orders} Bestellungen` : 'nicht verbunden'}
          </p>
        </div>
      </div>
    </div>
  )
}
