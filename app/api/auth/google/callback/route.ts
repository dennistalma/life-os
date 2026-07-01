import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/kalender?error=google_denied`)
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/kalender?error=google_token`)
  }

  const cookieStore = await cookies()
  cookieStore.set('google_access_token', tokens.access_token, {
    httpOnly: true,
    maxAge: tokens.expires_in || 3600,
    path: '/',
  })
  if (tokens.refresh_token) {
    cookieStore.set('google_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/kalender?google=connected`)
}
