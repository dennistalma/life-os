import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?error=instagram_denied`)
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID!
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/instagram/callback`

  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', redirect_uri: redirectUri, code }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error_type) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?error=instagram_token`)
  }

  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()
  const accessToken = longData.access_token || tokenData.access_token
  const userId = String(tokenData.user_id)

  const profileRes = await fetch(
    `https://graph.instagram.com/v22.0/${userId}?fields=username,followers_count,follows_count,media_count&access_token=${accessToken}`
  )
  const profile = await profileRes.json()

  const cookieStore = await cookies()
  const maxAge = 60 * 60 * 24 * 60 // 60 days
  cookieStore.set('ig_access_token', accessToken, { httpOnly: true, maxAge, path: '/' })
  cookieStore.set('ig_user_id', userId, { httpOnly: true, maxAge, path: '/' })
  cookieStore.set('ig_username', profile.username || '', { httpOnly: false, maxAge, path: '/' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?connected=instagram`)
}
