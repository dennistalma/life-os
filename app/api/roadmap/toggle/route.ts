import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap-v2'

export async function POST(req: NextRequest) {
  const { sectionId, itemId } = await req.json()
  const sections = (await redis.get(KEY)) as { id: string; title: string; items: { id: string; text: string; done: boolean }[] }[] | null
  if (!sections) return NextResponse.json({ error: 'Nicht initialisiert — lade zuerst /api/roadmap' }, { status: 400 })

  const updated = sections.map(s =>
    s.id !== sectionId ? s : {
      ...s,
      items: s.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }
  )
  await redis.set(KEY, updated)
  return NextResponse.json({ ok: true })
}
