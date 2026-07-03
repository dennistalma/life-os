import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('tiktok-developers-site-verification=qzyUCIM8LrBQ5h9BeXmlBYUtNgVOcCpb', {
    headers: { 'Content-Type': 'text/plain' },
  })
}
