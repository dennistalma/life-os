import { NextRequest, NextResponse } from 'next/server'
import { readDataAsync, updateDataAsync } from '@/lib/storage'

export async function GET() {
  const data = await readDataAsync()
  const safe = data.social.map(({ accessToken: _t, ...rest }) => rest)
  return NextResponse.json(safe)
}

export async function DELETE(req: NextRequest) {
  const { platform } = await req.json()
  const updated = await updateDataAsync((d) => ({
    ...d,
    social: d.social.filter((s) => s.platform !== platform),
  }))
  const safe = updated.social.map(({ accessToken: _t, ...rest }) => rest)
  return NextResponse.json(safe)
}
