import { NextRequest, NextResponse } from 'next/server'
import { readDataAsync, writeDataAsync } from '@/lib/storage'

export async function GET() {
  const data = await readDataAsync()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  await writeDataAsync(body)
  return NextResponse.json({ ok: true })
}
