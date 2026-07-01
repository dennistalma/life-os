import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET() {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())

  const state = base64url(crypto.randomBytes(16))

  const cookieStore = await cookies()
  cookieStore.set('etsy_verifier', verifier, { httpOnly: true, maxAge: 600, path: '/' })
  cookieStore.set('etsy_state', state, { httpOnly: true, maxAge: 600, path: '/' })

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/etsy/callback`,
    scope: 'shops_r transactions_r',
    client_id: process.env.ETSY_API_KEY!,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.redirect(`https://www.etsy.com/oauth/connect?${params}`)
}
