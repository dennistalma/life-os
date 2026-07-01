import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'INSTAGRAM_CLIENT_ID nicht konfiguriert' }, { status: 500 })
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/instagram/callback`
  const scope = 'instagram_business_basic,instagram_business_manage_insights'
  const url = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`
  return NextResponse.redirect(url)
}
