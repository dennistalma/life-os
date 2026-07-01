import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY nicht konfiguriert' }, { status: 500 })
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/tiktok/callback`
  const csrfState = crypto.randomBytes(16).toString('hex')
  const scope = 'user.info.basic,user.info.stats'

  const codeVerifier = crypto.randomBytes(32).toString('hex')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const url =
    `https://www.tiktok.com/v2/auth/authorize/?` +
    `client_key=${clientKey}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${csrfState}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`

  const res = NextResponse.redirect(url)
  res.cookies.set('tiktok_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })
  return res
}
