import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readKB } from '@/lib/social-kb'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { platform, brief, imageContext } = await req.json()
  const kb = await readKB()

  const hashtags = platform === 'tiktok' ? kb.tiktokHashtags : kb.instagramHashtags
  const platformStyle = platform === 'tiktok'
    ? 'TikTok: kurz, energetisch, Hook am Anfang, Trending-Sprache, max 150 Zeichen Caption'
    : 'Instagram: emotional, storytelling, 150-300 Zeichen Caption, Zeilenumbrüche nutzen'

  const prompt = `Du bist Social-Media-Manager für die Marke "${kb.brandName || 'diese Marke'}".

MARKEN-INFO:
- Beschreibung: ${kb.brandDescription || 'Handgemachte Produkte'}
- Zielgruppe: ${kb.targetAudience || 'Interessierte Käufer'}
- Tonalität: ${kb.brandVoice || 'warm, authentisch'}

SEO-KEYWORDS (einbauen wenn möglich): ${kb.seoKeywords.join(', ') || 'keine'}
ANZEIGEN-KEYWORDS: ${kb.adKeywords.join(', ') || 'keine'}

PLATTFORM: ${platformStyle}
${brief ? `POST-IDEE: ${brief}` : ''}
${imageContext ? `BILDBESCHREIBUNG: ${imageContext}` : ''}

VERFÜGBARE HASHTAGS: ${hashtags.join(' ') || '#handmade #craft'}

Erstelle den optimalen Post. Antworte NUR als JSON:
{
  "caption": "vollständige Caption mit Zeilenumbrüchen",
  "hashtags": ["nur", "die", "besten", "15", "hashtags", "aus der Liste + neue"],
  "hook": "erster Satz der Aufmerksamkeit erzeugt",
  "cta": "Call-to-Action am Ende",
  "seoScore": "1-10 wie gut SEO-optimiert"
}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'KI hat kein gültiges JSON zurückgegeben' }, { status: 500 })

    return NextResponse.json(JSON.parse(match[0]))
  } catch (err) {
    console.error('generate-post error:', err)
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
