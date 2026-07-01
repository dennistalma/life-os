import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token || null
}

export async function GET() {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value

  if (!accessToken && refreshToken) {
    accessToken = (await refreshAccessToken(refreshToken)) || undefined
    if (accessToken) {
      cookieStore.set('google_access_token', accessToken, {
        httpOnly: true,
        maxAge: 3600,
        path: '/',
      })
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  const now = new Date()
  const threeMonthsLater = new Date(now)
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: threeMonthsLater.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'google_api_error' }, { status: res.status })
  }

  const data = await res.json()
  const events = (data.items || []).map((item: Record<string, unknown>) => {
    const start = item.start as Record<string, string>
    const end = item.end as Record<string, string>
    const date = start.date || (start.dateTime as string)?.split('T')[0]
    const time = start.dateTime
      ? new Date(start.dateTime).toTimeString().slice(0, 5)
      : undefined
    return {
      id: `google_${item.id}`,
      title: item.summary || '(Kein Titel)',
      date,
      time,
      description: item.description as string | undefined,
      source: 'google' as const,
      googleEventId: item.id,
      endDate: end?.date || (end?.dateTime as string)?.split('T')[0],
    }
  })

  return NextResponse.json({ events })
}
