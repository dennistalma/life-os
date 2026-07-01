import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('etsy_access_token')?.value
  if (token) return token

  const refresh = cookieStore.get('etsy_refresh_token')?.value
  if (!refresh) return null

  const res = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ETSY_API_KEY!,
      refresh_token: refresh,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  cookieStore.set('etsy_access_token', data.access_token, { httpOnly: true, maxAge: data.expires_in, path: '/' })
  return data.access_token
}

export async function GET() {
  const token = await getToken()
  if (!token) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  // Get current user/shop
  const meRes = await fetch('https://openapi.etsy.com/v3/application/users/me', {
    headers: { Authorization: `Bearer ${token}`, 'x-api-key': process.env.ETSY_API_KEY! },
  })
  if (!meRes.ok) return NextResponse.json({ error: 'API Fehler' }, { status: 500 })
  const me = await meRes.json()
  const shopId = me.shop_id

  if (!shopId) return NextResponse.json({ error: 'Kein Shop gefunden' }, { status: 404 })

  // Get shop stats
  const [shopRes, receiptsRes] = await Promise.all([
    fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': process.env.ETSY_API_KEY! },
    }),
    fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?limit=25&was_paid=true`, {
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': process.env.ETSY_API_KEY! },
    }),
  ])

  const shop = shopRes.ok ? await shopRes.json() : {}
  const receiptsData = receiptsRes.ok ? await receiptsRes.json() : { results: [] }
  const receipts = receiptsData.results || []

  const totalRevenue = receipts.reduce((sum: number, r: { grandtotal?: { amount?: number; divisor?: number } }) => {
    return sum + (r.grandtotal?.amount ?? 0) / (r.grandtotal?.divisor ?? 100)
  }, 0)

  const orders = receipts.map((r: {
    receipt_id: number
    name: string
    status: string
    created_timestamp: number
    grandtotal?: { amount?: number; divisor?: number }
    transactions?: unknown[]
  }) => ({
    id: String(r.receipt_id),
    buyerName: r.name,
    status: r.status,
    date: new Date(r.created_timestamp * 1000).toISOString(),
    total: ((r.grandtotal?.amount ?? 0) / (r.grandtotal?.divisor ?? 100)).toFixed(2),
    itemCount: r.transactions?.length ?? 1,
  }))

  return NextResponse.json({
    shopName: shop.shop_name ?? 'Mein Shop',
    listingCount: shop.listing_active_count ?? 0,
    totalSales: shop.transaction_sold_count ?? 0,
    totalRevenue: totalRevenue.toFixed(2),
    orderCount: receipts.length,
    orders,
  })
}
