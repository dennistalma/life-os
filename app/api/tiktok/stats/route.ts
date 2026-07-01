import { NextResponse } from 'next/server'
import { readData, updateData } from '@/lib/storage'

export async function GET() {
  const data = readData()
  const account = data.social.find((s) => s.platform === 'tiktok')

  if (!account?.connected || !account.accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  try {
    // Refresh profile stats
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,video_count,likes_count',
      { headers: { Authorization: `Bearer ${account.accessToken}` } }
    )
    const profileData = await profileRes.json()
    const user = profileData.data?.user || {}

    const stats = {
      followers: user.follower_count ?? account.stats?.followers ?? 0,
      following: user.following_count ?? account.stats?.following ?? 0,
      posts: user.video_count ?? account.stats?.posts ?? 0,
      likes: user.likes_count ?? (account.stats as unknown as Record<string, number>)?.likes ?? 0,
      updatedAt: new Date().toISOString(),
    }

    updateData((d) => ({
      ...d,
      social: d.social.map((s) =>
        s.platform === 'tiktok' ? { ...s, displayName: user.display_name || s.displayName, stats } : s
      ),
    }))

    // Try to get video list (requires video.list scope)
    let videos: {
      id: string
      title: string
      createTime: number
      viewCount: number
      likeCount: number
      commentCount: number
      shareCount: number
    }[] = []

    const videoRes = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count,share_count', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: 10 }),
    })
    const videoData = await videoRes.json()
    if (videoData.data?.videos) {
      videos = videoData.data.videos.map((v: {
        id: string
        title?: string
        create_time?: number
        view_count?: number
        like_count?: number
        comment_count?: number
        share_count?: number
      }) => ({
        id: v.id,
        title: v.title || '',
        createTime: v.create_time || 0,
        viewCount: v.view_count || 0,
        likeCount: v.like_count || 0,
        commentCount: v.comment_count || 0,
        shareCount: v.share_count || 0,
      }))
    }

    return NextResponse.json({
      username: user.display_name || account.username,
      stats,
      videos,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
  }
}
