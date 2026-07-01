import fs from 'fs'
import path from 'path'

export interface SocialKnowledgeBase {
  brandName: string
  brandDescription: string
  targetAudience: string
  brandVoice: string
  seoKeywords: string[]
  instagramHashtags: string[]
  tiktokHashtags: string[]
  adKeywords: string[]
  postTemplates: string[]
  updatedAt: string
}

const defaultKB: SocialKnowledgeBase = {
  brandName: '',
  brandDescription: '',
  targetAudience: '',
  brandVoice: 'warm, authentisch, handgemacht',
  seoKeywords: [],
  instagramHashtags: [],
  tiktokHashtags: [],
  adKeywords: [],
  postTemplates: [],
  updatedAt: new Date().toISOString(),
}

const KB_FILE = process.env.NODE_ENV === 'production'
  ? '/tmp/social-kb.json'
  : path.join(process.cwd(), 'data', 'social-kb.json')

export async function readKB(): Promise<SocialKnowledgeBase> {
  if (process.env.NODE_ENV === 'production') {
    try {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.LAGERUNG_URL ?? process.env.KV_REST_API_URL!,
        token: process.env.LAGERUNG_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
      })
      const data = await redis.get<SocialKnowledgeBase>('social-kb')
      return data ? { ...defaultKB, ...data } : defaultKB
    } catch { return defaultKB }
  }
  try {
    if (!fs.existsSync(KB_FILE)) return defaultKB
    return { ...defaultKB, ...JSON.parse(fs.readFileSync(KB_FILE, 'utf-8')) }
  } catch { return defaultKB }
}

export async function writeKB(kb: SocialKnowledgeBase): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: process.env.LAGERUNG_URL ?? process.env.KV_REST_API_URL!,
      token: process.env.LAGERUNG_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
    })
    await redis.set('social-kb', kb)
    return
  }
  fs.mkdirSync(path.dirname(KB_FILE), { recursive: true })
  fs.writeFileSync(KB_FILE, JSON.stringify(kb, null, 2))
}
