import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap-v2'
const SECRET = 'a1d0041ea61660d5c8a2b06bb06667475b611e73cab064dadcf5542a6b084767'

// Duration map: partial text match (lowercase) → duration string
const DURATIONS: [string, string][] = [
  // Juli
  ['sicherheits-baustein', '1–2 Std'],
  ['trust-bar', '1–2 Std'],
  ['disclaimer', '15 Min'],
  ['scroll-animation', '2–3 Std'],
  ['logo-animation', '3–5 Std'],
  ['exploded-view', '4–6 Std'],
  ['musik-workflow', '2–4 Std'],
  ['ce-konformitäts', '2–3 Std'],
  ['vde-0701', '1 Std'],
  ['wettbewerbs', '1 Std (+Wartezeit)'],
  ['import-unterlagen', '1–2 Std'],
  ['alibaba-bestellung', '30 Min'],
  // August
  ['finale produktlinie', '2 Std'],
  ['produktionskapazität', '1 Std'],
  ['ersten launch-bestand', '3–5 Tage'],
  ['container-werkstatt', '2–4 Tage'],
  ['produktkategorie-seiten', '3–4 Std'],
  ['etsy-shop-struktur', '3–4 Std'],
  ['wix-payments-checkout', '1 Std'],
  ['tiktok-account professionalisieren', '3–4 Std'],
  ['content-kalender', '2 Std'],
  ['mystery-persona', '1–2 Tage'],
  ['coming-soon', '4–6 Std'],
  ['silhouette', '30–60 Min'],
  ['headline', '30–60 Min'],
  ['e-mail-feld', '30–60 Min'],
  ['kein shop', '30–60 Min'],
  // September
  ['organische tiktok-videos', '1–2 Std'],
  ['instagram parallel', '1–2 Std'],
  ['hashtag-sets', '15 Min'],
  ['community/follower', '15 Min'],
  ['making-of (flammen', '1–2 Std'],
  ['behind the brand', '1–2 Std'],
  ['prüf-clip', '1–2 Std'],
  ['mystery-hook', '1–2 Std'],
  ['google/meta-ad', '1–2 Std'],
  ['erste creatives', '2–3 Std'],
  ['fertigung', 'mehrere Std/Woche'],
  ['cross-browser', '2 Std'],
  ['material-vergleichs', '2–3 Std'],
  ['vergleichsvideo', '30 Min'],
  ['§ 6 uwg', '30 Min'],
  ['anwalts', '1 Std (+Wartezeit)'],
  // Oktober
  ['bcb berlin (12', '1–2 Tage'],
  ['bcb-learnings', '2 Std'],
  ['erste presse', '2–3 Std'],
  ['woche 3-4: split-screen', '2–3 Std'],
  ['website final', '3–4 Std'],
  ['lagerbestand', '2 Std'],
  ['countdown', '1 Std'],
  ['newsletter-anmeldungen', '1–2 Std'],
  ['weitere hero-shots', '2–3 Std'],
  ['bcb (12.–14.10.) als content', '2 Std'],
  // Launch-Tag
  ['website live', '30 Min'],
  ['launch-post', '1 Std'],
  ['ads scharf', '30 Min'],
  ['newsletter an', '30 Min'],
  ['allerheiligen', '1 Std'],
]

function getDuration(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [key, dur] of DURATIONS) {
    if (lower.includes(key.toLowerCase())) return dur
  }
  return undefined
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-mcp-token')
  if (token !== SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sections = (await redis.get(KEY)) as { id: string; title: string; emoji: string; items: { id: string; text: string; done: boolean; category?: string; notes?: string; duration?: string }[] }[] | null
  if (!sections) return NextResponse.json({ error: 'Keine Daten' }, { status: 400 })

  let updated_count = 0
  const updated = sections.map(s => ({
    ...s,
    items: s.items.map(i => {
      const duration = getDuration(i.text)
      if (duration) updated_count++
      return duration ? { ...i, duration } : i
    }),
  }))

  await redis.set(KEY, updated)
  return NextResponse.json({ ok: true, updated_count })
}
