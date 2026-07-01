import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/storage'

export async function GET() {
  const data = readData()
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  writeData(body)
  return NextResponse.json({ ok: true })
}
