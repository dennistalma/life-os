import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=ga_denied`)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/analytics/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const data = await res.json()
  if (!data.access_token) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=ga_token`)

  const cookieStore = await cookies()
  cookieStore.set('ga_access_token', data.access_token, { httpOnly: true, maxAge: data.expires_in, path: '/' })
  if (data.refresh_token) {
    cookieStore.set('ga_refresh_token', data.refresh_token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}`)
}
