import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?error=tiktok_denied`)
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/tiktok/callback`
  const cookieStore = await cookies()
  const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value || ''

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri, code_verifier: codeVerifier }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?error=tiktok_token`)
  }

  const accessToken = tokenData.access_token
  const openId = tokenData.open_id
  const maxAge = tokenData.expires_in || 86400

  const profileRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,video_count,likes_count',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const profileData = await profileRes.json()
  const user = profileData.data?.user || {}

  cookieStore.set('tt_access_token', accessToken, { httpOnly: true, maxAge, path: '/' })
  cookieStore.set('tt_open_id', openId, { httpOnly: true, maxAge, path: '/' })
  cookieStore.set('tt_username', user.display_name || '', { httpOnly: false, maxAge, path: '/' })
  if (tokenData.refresh_token) {
    cookieStore.set('tt_refresh_token', tokenData.refresh_token, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' })
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?connected=tiktok`)
}
