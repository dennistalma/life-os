import Anthropic from '@anthropic-ai/sdk'
import { CaptureResult, Category } from './types'

const client = new Anthropic()

const SYSTEM_PROMPT = `Du bist ein intelligenter Assistent für ein persönliches Life-OS Dashboard.
Deine Aufgabe: Analysiere einen Freitext-Input und klassifiziere ihn in eine der folgenden Kategorien:
- "todo": Aufgaben, die erledigt werden müssen (z.B. "Einkaufen gehen", "E-Mail beantworten")
- "calendar": Termine, Meetings, Ereignisse mit Datum/Uhrzeit (z.B. "Morgen 14 Uhr Zahnarzt")
- "finance": Einnahmen oder Ausgaben (z.B. "50€ für Holz ausgegeben", "500€ Gehalt erhalten")
- "habit": Wiederkehrende tägliche/wöchentliche Gewohnheiten (z.B. "Jeden Tag 30 Min lesen")
- "goal": Ziele mit Deadline oder Fortschritt (z.B. "Bis Ende Juli neue Website fertig")

Antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "category": "<todo|calendar|finance|habit|goal>",
  "confidence": <0.0-1.0>,
  "reasoning": "<kurze Begründung auf Deutsch>",
  "data": {
    // Für todo: { "text": "...", "priority": "high|medium|low", "dueDate": "YYYY-MM-DD oder null" }
    // Für calendar: { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM oder null", "description": "... oder null" }
    // Für finance: { "description": "...", "amount": <zahl>, "type": "income|expense", "category": "..." }
    // Für habit: { "name": "...", "frequency": "daily|weekly" }
    // Für goal: { "title": "...", "description": "...", "deadline": "YYYY-MM-DD oder null", "timeframe": "week|month|quarter|year|custom", "target": <zahl oder null>, "unit": "... oder null" }
  }
}`

export async function classifyInput(
  input: string,
  today: string
): Promise<CaptureResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Heutiges Datum: ${today}\nInput: "${input}"`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Kein gültiges JSON in der Antwort')

  const parsed = JSON.parse(jsonMatch[0])

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const base = { id, createdAt: now }

  let finalData
  const category: Category = parsed.category
  const d = parsed.data

  if (category === 'todo') {
    finalData = {
      ...base,
      text: d.text || input,
      completed: false,
      priority: d.priority || 'medium',
      dueDate: d.dueDate || undefined,
    }
  } else if (category === 'calendar') {
    finalData = {
      ...base,
      title: d.title || input,
      date: d.date || today,
      time: d.time || undefined,
      description: d.description || undefined,
    }
  } else if (category === 'finance') {
    finalData = {
      ...base,
      description: d.description || input,
      amount: Math.abs(Number(d.amount) || 0),
      type: d.type || 'expense',
      category: d.category || 'Sonstiges',
      date: today,
    }
  } else if (category === 'habit') {
    finalData = {
      ...base,
      name: d.name || input,
      frequency: d.frequency || 'daily',
      completedDates: [],
    }
  } else {
    finalData = {
      ...base,
      title: d.title || input,
      description: d.description || '',
      deadline: d.deadline || undefined,
      timeframe: d.timeframe || 'month',
      progress: 0,
      target: d.target || undefined,
      unit: d.unit || undefined,
      completed: false,
    }
  }

  return {
    category,
    data: finalData as CaptureResult['data'],
    confidence: parsed.confidence || 0.8,
    reasoning: parsed.reasoning || '',
  }
}
