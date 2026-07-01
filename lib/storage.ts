import fs from 'fs'
import path from 'path'
import { AppData } from './types'

const defaultData: AppData = {
  todos: [],
  events: [],
  transactions: [],
  habits: [],
  goals: [],
  userName: 'Dennis',
  social: [],
  notes: [],
  receipts: [],
}

// ── File-based storage (local dev) ──────────────────────────────────────────
const DATA_FILE = path.join(process.cwd(), 'data', 'life-os.json')

function readFile(): AppData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2))
      return defaultData
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return { ...defaultData, ...JSON.parse(raw) }
  } catch {
    return defaultData
  }
}

function writeFile(data: AppData): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// ── Upstash Redis storage (production) ──────────────────────────────────────
async function readRedis(): Promise<AppData> {
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: process.env.LAGERUNG_URL ?? process.env.KV_REST_API_URL!,
      token: process.env.LAGERUNG_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
    })
    const data = await redis.get<AppData>('life-os-data')
    return data ? { ...defaultData, ...data } : defaultData
  } catch {
    return defaultData
  }
}

async function writeRedis(data: AppData): Promise<void> {
  const { Redis } = await import('@upstash/redis')
  const redis = new Redis({
    url: process.env.LAGERUNG_URL ?? process.env.KV_REST_API_URL!,
    token: process.env.LAGERUNG_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
  })
  await redis.set('life-os-data', data)
}

// ── Public API ───────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production'

export function readData(): AppData {
  if (isProd) {
    // Return default synchronously — callers must use readDataAsync in prod
    return defaultData
  }
  return readFile()
}

export async function readDataAsync(): Promise<AppData> {
  if (isProd) return readRedis()
  return readFile()
}

export function writeData(data: AppData): void {
  if (!isProd) writeFile(data)
}

export async function writeDataAsync(data: AppData): Promise<void> {
  if (isProd) await writeRedis(data)
  else writeFile(data)
}

export async function updateDataAsync(updater: (data: AppData) => AppData): Promise<AppData> {
  const current = await readDataAsync()
  const updated = updater(current)
  await writeDataAsync(updated)
  return updated
}

// Keep sync version for local dev compatibility
export function updateData(updater: (data: AppData) => AppData): AppData {
  const current = readFile()
  const updated = updater(current)
  writeFile(updated)
  return updated
}
