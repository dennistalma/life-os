import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('tt_access_token')?.value
  const username = cookieStore.get('tt_username')?.value

  if (!accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  try {
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,following_count,video_count,likes_count',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const profileData = await profileRes.json()
    const user = profileData.data?.user || {}

    const stats = {
      followers: user.follower_count ?? 0,
      following: user.following_count ?? 0,
      posts: user.video_count ?? 0,
      likes: user.likes_count ?? 0,
    }

    // Try video list
    let videos: {
      id: string; title: string; createTime: number
      viewCount: number; likeCount: number; commentCount: number; shareCount: number
    }[] = []

    const videoRes = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,view_count,like_count,comment_count,share_count', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_count: 10 }),
    })
    const videoData = await videoRes.json()
    if (videoData.data?.videos) {
      videos = videoData.data.videos.map((v: {
        id: string; title?: string; create_time?: number
        view_count?: number; like_count?: number; comment_count?: number; share_count?: number
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

    return NextResponse.json({ username: user.display_name || username || '', stats, videos })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
  }
}
