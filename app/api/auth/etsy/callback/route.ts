import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const verifier = cookieStore.get('etsy_verifier')?.value
  const savedState = cookieStore.get('etsy_state')?.value

  if (!code || !verifier || state !== savedState) {
    return NextResponse.json({ error: 'OAuth Fehler' }, { status: 400 })
  }

  const res = await fetch('https://api.etsy.com/v3/public/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEY!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/etsy/callback`,
      code,
      code_verifier: verifier,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 400 })
  }

  cookieStore.set('etsy_access_token', data.access_token, { httpOnly: true, maxAge: data.expires_in, path: '/' })
  cookieStore.set('etsy_refresh_token', data.refresh_token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}`)
}
