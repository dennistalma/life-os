import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap-v2'

const TOOLS = [
  {
    name: 'add_roadmap_item',
    description: 'Fügt eine neue Aufgabe zur SpiritLamps Launch-Roadmap hinzu.',
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['juli', 'august', 'september', 'oktober', 'launch'],
          description: 'Monat: juli, august, september, oktober oder launch',
        },
        text: { type: 'string', description: 'Text der Aufgabe' },
        category: { type: 'string', description: 'Kategorie (optional)' },
        notes: { type: 'string', description: 'Notizen (optional)' },
        duration: { type: 'string', description: 'Zeitschätzung z.B. "1–2 Std", "3 Tage", "30 Min" (optional)' },
      },
      required: ['section', 'text'],
    },
  },
  {
    name: 'list_roadmap',
    description: 'Zeigt alle Abschnitte und Aufgaben der Roadmap.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'toggle_roadmap_item',
    description: 'Markiert eine Aufgabe als erledigt oder offen.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['juli', 'august', 'september', 'oktober', 'launch'] },
        item_text: { type: 'string', description: 'Text der Aufgabe (oder Teil davon)' },
      },
      required: ['section', 'item_text'],
    },
  },
  {
    name: 'delete_roadmap_item',
    description: 'Löscht eine Aufgabe aus der Roadmap.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['juli', 'august', 'september', 'oktober', 'launch'] },
        item_text: { type: 'string', description: 'Text der Aufgabe (oder Teil davon)' },
      },
      required: ['section', 'item_text'],
    },
  },
]

type Item = { id: string; text: string; done: boolean; category?: string; notes?: string }
type Section = { id: string; title: string; emoji: string; items: Item[] }

async function handleTool(name: string, args: Record<string, string>) {
  const sections = (await redis.get(KEY)) as Section[] | null
  if (!sections) return { error: 'Roadmap nicht initialisiert' }

  if (name === 'add_roadmap_item') {
    const { section, category, notes } = args
    let { text, duration } = args

    // Auto-extract duration from text if not provided explicitly
    // Matches: (Aufwand: 30 Min), (2–3 Std), (ca. 1 Tag), etc.
    if (!duration) {
      const match = text.match(/\((?:Aufwand[:\s]*)?(?:ca\.?\s*)?(\d+[\d\s–\-]*(?:Min(?:uten?)?|Std(?:unden?)?|Tage?n?|h)(?:[^)]*)?)\)/i)
      if (match) {
        duration = match[1].trim()
        text = text.replace(match[0], '').trim()
      }
    }

    const newItem: Item = {
      id: `${section}-${Date.now()}`,
      text: text.trim(),
      done: false,
      ...(category ? { category } : {}),
      ...(notes ? { notes } : {}),
      ...(duration ? { duration } : {}),
    }
    const updated = sections.map(s =>
      s.id !== section ? s : { ...s, items: [...s.items, newItem] }
    )
    await redis.set(KEY, updated)
    const sec = sections.find(s => s.id === section)
    return { content: `✅ Aufgabe hinzugefügt zu "${sec?.emoji} ${sec?.title}": "${text}"` }
  }

  if (name === 'list_roadmap') {
    const text = sections.map(s => {
      const done = s.items.filter(i => i.done).length
      return `${s.emoji} ${s.title} (${done}/${s.items.length})\n` +
        s.items.map(i => `  ${i.done ? '✓' : '○'} ${i.text}`).join('\n')
    }).join('\n\n')
    return { content: text }
  }

  if (name === 'delete_roadmap_item') {
    const { section, item_text } = args
    let found = false
    const updated = sections.map(s => {
      if (s.id !== section) return s
      const filtered = s.items.filter(i => {
        if (i.text.toLowerCase().includes(item_text.toLowerCase())) { found = true; return false }
        return true
      })
      return { ...s, items: filtered }
    })
    if (!found) return { error: `Aufgabe "${item_text}" nicht gefunden` }
    await redis.set(KEY, updated)
    return { content: `🗑️ Aufgabe "${item_text}" wurde gelöscht.` }
  }

  if (name === 'toggle_roadmap_item') {
    const { section, item_text } = args
    let found: Item | null = null
    const updated = sections.map(s => {
      if (s.id !== section) return s
      return {
        ...s, items: s.items.map(i => {
          if (i.text.toLowerCase().includes(item_text.toLowerCase())) {
            found = { ...i, done: !i.done }
            return found
          }
          return i
        }),
      }
    })
    if (!found) return { error: `Aufgabe "${item_text}" nicht gefunden` }
    await redis.set(KEY, updated)
    return { content: `✅ "${(found as Item).text}" ist jetzt ${(found as Item).done ? 'erledigt ✓' : 'offen ○'}` }
  }

  return { error: 'Unbekanntes Tool' }
}

export async function GET() {
  // MCP initialize via GET — return server info as SSE
  const info = JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'life-os-roadmap', version: '1.0.0' },
    },
  })
  return new NextResponse(
    `data: ${info}\n\n`,
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, method, params } = body

  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'life-os-roadmap', version: '1.0.0' },
      },
    })
  }

  if (method === 'notifications/initialized') {
    return NextResponse.json({ jsonrpc: '2.0', id, result: {} })
  }

  if (method === 'tools/list') {
    return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params
    const result = await handleTool(name, args)
    if (result.error) {
      return NextResponse.json({
        jsonrpc: '2.0', id,
        error: { code: -32000, message: result.error },
      })
    }
    return NextResponse.json({
      jsonrpc: '2.0', id,
      result: { content: [{ type: 'text', text: result.content }] },
    })
  }

  return NextResponse.json({
    jsonrpc: '2.0', id,
    error: { code: -32601, message: 'Method not found' },
  })
}
