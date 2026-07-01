import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { platform, brief, imageDescription } = body

  const platformHints: Record<string, string> = {
    instagram: 'Instagram: emotional, persönlich, mit 5-10 relevanten Hashtags am Ende. Emojis einbauen.',
    tiktok: 'TikTok: kurz, energetisch, Hooks am Anfang, 3-5 Hashtags, trending Sprache.',
  }

  const hint = platformHints[platform] || platformHints.instagram

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Erstelle eine Social-Media-Caption für ${platform}.

Stil: ${hint}
${brief ? `Thema/Brief: ${brief}` : ''}
${imageDescription ? `Bildbeschreibung: ${imageDescription}` : ''}

Antworte NUR mit einem JSON-Objekt:
{
  "caption": "...",
  "hashtags": ["...", "..."],
  "alt": "kurze Bildbeschreibung für Barrierefreiheit"
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: 'Keine Antwort' }, { status: 500 })

  const result = JSON.parse(match[0])
  return NextResponse.json(result)
}
