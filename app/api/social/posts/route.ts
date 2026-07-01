import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SocialPost } from '@/lib/types'

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform') || 'instagram'
  const cookieStore = await cookies()

  if (platform === 'instagram') {
    const accessToken = cookieStore.get('ig_access_token')?.value
    const userId = cookieStore.get('ig_user_id')?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Nicht verbunden' }, { status: 400 })
    }

    try {
      const res = await fetch(
        `https://graph.instagram.com/v22.0/${userId}/media` +
        `?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink` +
        `&limit=12&access_token=${accessToken}`
      )
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      const posts: SocialPost[] = json.data.map((p: Record<string, string | number>) => ({
        id: String(p.id),
        mediaType: p.media_type as SocialPost['mediaType'],
        thumbnailUrl: String(p.thumbnail_url || p.media_url),
        permalink: String(p.permalink),
        timestamp: String(p.timestamp),
        likeCount: Number(p.like_count) || 0,
        commentsCount: Number(p.comments_count) || 0,
        caption: p.caption ? String(p.caption).slice(0, 120) : undefined,
      }))

      const profileRes = await fetch(
        `https://graph.instagram.com/v22.0/${userId}` +
        `?fields=followers_count,follows_count,media_count,name` +
        `&access_token=${accessToken}`
      )
      const profile = await profileRes.json()

      return NextResponse.json({ posts, profile })
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unbekannte Plattform' }, { status: 400 })
}
