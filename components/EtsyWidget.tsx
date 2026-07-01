'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, RefreshCw, ExternalLink, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

interface EtsyData {
  shopName: string
  listingCount: number
  totalSales: number
  totalRevenue: string
  orderCount: number
  orders: {
    id: string
    buyerName: string
    status: string
    date: string
    total: string
    itemCount: number
  }[]
}

export default function EtsyWidget() {
  const [data, setData] = useState<EtsyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/etsy/shop')
      const json = await res.json()
      if (json.error === 'not_connected') {
        setError('not_connected')
      } else if (!res.ok) {
        setError(json.error || 'Fehler')
      } else {
        setData(json)
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
          <ShoppingCart className="w-4 h-4 text-orange-400" />
          Etsy Shop {data?.shopName ? `· ${data.shopName}` : ''}
        </h2>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error === 'not_connected' && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-slate-500">Etsy noch nicht verbunden</p>
          <Link
            href="/api/auth/etsy"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-colors"
          >
            <LinkIcon className="w-4 h-4" /> Mit Etsy verbinden
          </Link>
        </div>
      )}

      {error && error !== 'not_connected' && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Gesamtumsatz</p>
              <p className="text-lg font-bold text-orange-400">{data.totalRevenue} €</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Bestellungen</p>
              <p className="text-lg font-bold text-slate-200">{data.orderCount}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Gesamtverkäufe</p>
              <p className="text-lg font-bold text-cyan-400">{data.totalSales}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 mb-1">Aktive Listings</p>
              <p className="text-lg font-bold text-green-400">{data.listingCount}</p>
            </div>
          </div>

          {data.orders.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Letzte Bestellungen</p>
              {data.orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                  <span className="text-slate-400">{o.buyerName}</span>
                  <span className="text-slate-500">{o.itemCount} Artikel</span>
                  <span className="text-orange-400 font-medium">{o.total} €</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Link href="https://www.etsy.com/your/shops/me/dashboard" target="_blank"
        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
        Etsy öffnen <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  )
}
