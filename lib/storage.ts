import fs from 'fs'
import path from 'path'
import { AppData } from './types'

const DATA_FILE = process.env.NODE_ENV === 'production'
  ? '/tmp/life-os.json'
  : path.join(process.cwd(), 'data', 'life-os.json')

const defaultData: AppData = {
  todos: [],
  events: [],
  transactions: [],
  habits: [],
  goals: [],
  userName: 'Dennis',
  social: [],
  notes: [],
}

export function readData(): AppData {
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

export function writeData(data: AppData): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export function updateData(updater: (data: AppData) => AppData): AppData {
  const current = readData()
  const updated = updater(current)
  writeData(updated)
  return updated
}
