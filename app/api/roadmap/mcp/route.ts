import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap-v2'
const MCP_SECRET = 'a1d0041ea61660d5c8a2b06bb06667475b611e73cab064dadcf5542a6b084767'

type Item = { id: string; text: string; done: boolean; category?: string; notes?: string }
type Section = { id: string; title: string; emoji: string; items: Item[] }

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-mcp-token')
  if (token !== MCP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, sectionId, text, category, notes, itemText } = await req.json()
  const sections = (await redis.get(KEY)) as Section[] | null
  if (!sections) return NextResponse.json({ error: 'Roadmap nicht initialisiert' }, { status: 400 })

  if (action === 'add') {
    if (!text?.trim()) return NextResponse.json({ error: 'Kein Text' }, { status: 400 })
    const newItem: Item = {
      id: `${sectionId}-${Date.now()}`,
      text: text.trim(),
      done: false,
      ...(category ? { category } : {}),
      ...(notes ? { notes } : {}),
    }
    const updated = sections.map(s =>
      s.id !== sectionId ? s : { ...s, items: [...s.items, newItem] }
    )
    await redis.set(KEY, updated)
    return NextResponse.json({ ok: true, item: newItem })
  }

  if (action === 'toggle') {
    let found: Item | null = null
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        items: s.items.map(i => {
          if (i.text.toLowerCase().includes(itemText.toLowerCase())) {
            found = { ...i, done: !i.done }
            return found
          }
          return i
        }),
      }
    })
    if (!found) return NextResponse.json({ error: 'Aufgabe nicht gefunden' }, { status: 404 })
    await redis.set(KEY, updated)
    return NextResponse.json({ ok: true, itemText: (found as Item).text, done: (found as Item).done })
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
}
