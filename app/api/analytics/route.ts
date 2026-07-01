import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('ga_access_token')?.value
  if (token) return token

  const refresh = cookieStore.get('ga_refresh_token')?.value
  if (!refresh) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) return null
  cookieStore.set('ga_access_token', data.access_token, { httpOnly: true, maxAge: data.expires_in, path: '/' })
  return data.access_token
}

export async function GET() {
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  const propertyId = process.env.GA_PROPERTY_ID
  if (!propertyId) return NextResponse.json({ error: 'GA_PROPERTY_ID nicht konfiguriert' }, { status: 500 })

  const body = {
    dateRanges: [
      { startDate: '30daysAgo', endDate: 'today' },
      { startDate: '60daysAgo', endDate: '31daysAgo' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: 30,
  }

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

  const rows = data.rows || []
  const current = rows.filter((_: unknown, i: number) => i < rows.length / 2)

  const sum = (metric: number) =>
    current.reduce((acc: number, row: { metricValues: { value: string }[] }) =>
      acc + parseFloat(row.metricValues[metric]?.value || '0'), 0)

  return NextResponse.json({
    sessions: Math.round(sum(0)),
    users: Math.round(sum(1)),
    pageViews: Math.round(sum(2)),
    bounceRate: current.length > 0
      ? (sum(3) / current.length * 100).toFixed(1)
      : '0',
    days: current.map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
      date: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
    })),
  })
}
