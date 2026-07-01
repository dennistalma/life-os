import { NextRequest, NextResponse } from 'next/server'
import { updateData } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/social?error=tiktok_denied`
    )
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!
  const redirectUri = `http://127.0.0.1:3000/api/auth/tiktok/callback`
  const codeVerifier = req.cookies.get('tiktok_code_verifier')?.value || ''

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/social?error=tiktok_token`
    )
  }

  const accessToken = tokenData.access_token
  const openId = tokenData.open_id

  const profileRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,video_count,likes_count',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const profileData = await profileRes.json()
  const user = profileData.data?.user || {}

  updateData((data) => {
    const others = data.social.filter((s) => s.platform !== 'tiktok')
    return {
      ...data,
      social: [
        ...others,
        {
          platform: 'tiktok',
          connected: true,
          username: user.display_name || '',
          accessToken,
          userId: openId,
          stats: {
            followers: user.follower_count || 0,
            following: user.following_count || 0,
            posts: user.video_count || 0,
            likes: user.likes_count || 0,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    }
  })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?connected=tiktok`)
}
