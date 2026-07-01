import { NextRequest, NextResponse } from 'next/server'
import { readKB, writeKB } from '@/lib/social-kb'

export async function GET() {
  const kb = await readKB()
  return NextResponse.json(kb)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  await writeKB({ ...body, updatedAt: new Date().toISOString() })
  return NextResponse.json({ ok: true })
}
