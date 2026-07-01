import { NextRequest, NextResponse } from 'next/server'
import { readData, updateData } from '@/lib/storage'
import { SocialPost } from '@/lib/types'

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform') || 'instagram'
  const data = readData()
  const account = data.social.find((s) => s.platform === platform)

  if (!account?.accessToken || !account.userId) {
    return NextResponse.json({ error: 'Nicht verbunden' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/v22.0/${account.userId}/media` +
      `?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink` +
      `&limit=6&access_token=${account.accessToken}`
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

    // Also refresh profile stats while we're at it
    const profileRes = await fetch(
      `https://graph.instagram.com/v22.0/${account.userId}` +
      `?fields=followers_count,follows_count,media_count,profile_picture_url,name` +
      `&access_token=${account.accessToken}`
    )
    const profile = await profileRes.json()

    updateData((d) => ({
      ...d,
      social: d.social.map((s) =>
        s.platform === platform
          ? {
              ...s,
              displayName: profile.name || s.displayName,
              profilePictureUrl: profile.profile_picture_url || s.profilePictureUrl,
              recentPosts: posts,
              stats: {
                followers: profile.followers_count ?? s.stats?.followers ?? 0,
                following: profile.follows_count ?? s.stats?.following,
                posts: profile.media_count ?? s.stats?.posts,
                updatedAt: new Date().toISOString(),
              },
            }
          : s
      ),
    }))

    return NextResponse.json({ posts, profile })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fehler' },
      { status: 500 }
    )
  }
}
