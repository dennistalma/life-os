import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'Kein Bild' }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'Beschreibe dieses Bild kurz für einen Instagram-Post: Was ist zu sehen? Welche Stimmung hat es? Welche Farben dominieren? Antworte auf Deutsch in 2-3 Sätzen.',
          },
        ],
      }],
    })

    const description = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ description })
  } catch (err) {
    console.error('analyze-image error:', err)
    const msg = err instanceof Error ? err.message : 'Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
