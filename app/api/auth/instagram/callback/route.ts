import { NextRequest, NextResponse } from 'next/server'
import { updateData } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/social?error=instagram_denied`
    )
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID!
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/instagram/callback`

  // Exchange code for short-lived token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error_type) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/social?error=instagram_token`
    )
  }

  // Exchange for long-lived token
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
  )
  const longData = await longRes.json()
  const accessToken = longData.access_token || tokenData.access_token
  const userId = tokenData.user_id

  // Fetch profile stats
  const profileRes = await fetch(
    `https://graph.instagram.com/v22.0/${userId}?fields=username,followers_count,follows_count,media_count&access_token=${accessToken}`
  )
  const profile = await profileRes.json()

  updateData((data) => {
    const others = data.social.filter((s) => s.platform !== 'instagram')
    return {
      ...data,
      social: [
        ...others,
        {
          platform: 'instagram',
          connected: true,
          username: profile.username || '',
          accessToken,
          userId: String(userId),
          stats: {
            followers: profile.followers_count || 0,
            following: profile.follows_count || 0,
            posts: profile.media_count || 0,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    }
  })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/social?connected=instagram`)
}
