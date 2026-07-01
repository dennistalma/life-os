import { NextRequest, NextResponse } from 'next/server'
import { readData, updateData } from '@/lib/storage'

export async function GET() {
  const data = readData()
  // Never expose access tokens to the client
  const safe = data.social.map(({ accessToken: _t, ...rest }) => rest)
  return NextResponse.json(safe)
}

export async function POST(req: NextRequest) {
  const { platform } = await req.json()
  const data = readData()
  const account = data.social.find((s) => s.platform === platform)
  if (!account?.accessToken) {
    return NextResponse.json({ error: 'Nicht verbunden' }, { status: 400 })
  }

  try {
    let stats = account.stats

    if (platform === 'instagram') {
      const res = await fetch(
        `https://graph.instagram.com/v22.0/${account.userId}?fields=followers_count,follows_count,media_count&access_token=${account.accessToken}`
      )
      const d = await res.json()
      stats = {
        followers: d.followers_count || 0,
        following: d.follows_count || 0,
        posts: d.media_count || 0,
        updatedAt: new Date().toISOString(),
      }
    } else if (platform === 'tiktok') {
      const res = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,video_count,likes_count',
        { headers: { Authorization: `Bearer ${account.accessToken}` } }
      )
      const d = await res.json()
      const u = d.data?.user || {}
      stats = {
        followers: u.follower_count || 0,
        following: u.following_count || 0,
        posts: u.video_count || 0,
        likes: u.likes_count || 0,
        updatedAt: new Date().toISOString(),
      }
    }

    const updated = updateData((d) => ({
      ...d,
      social: d.social.map((s) => s.platform === platform ? { ...s, stats } : s),
    }))

    const safe = updated.social.map(({ accessToken: _t, ...rest }) => rest)
    return NextResponse.json(safe)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fehler' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const { platform } = await req.json()
  const updated = updateData((d) => ({
    ...d,
    social: d.social.filter((s) => s.platform !== platform),
  }))
  const safe = updated.social.map(({ accessToken: _t, ...rest }) => rest)
  return NextResponse.json(safe)
}
