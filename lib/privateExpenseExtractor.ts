import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export const PRIVATE_EXPENSE_CATEGORIES = ['Benzin', 'Essen', 'Zigaretten', 'Freizeit', 'Kleidung', 'Sonstiges'] as const

const SYSTEM_PROMPT = `Du liest Screenshots von Belegen, Kassenbons oder Zahlungsbestätigungen für private Ausgaben (kein Business).
Extrahiere die Daten aus dem Bild und antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "date": "<Datum als YYYY-MM-DD, falls nicht erkennbar heutiges Datum>",
  "amount": <Betrag als Zahl, positiv>,
  "note": "<kurze Notiz, z.B. Händlername oder was gekauft wurde>",
  "category": "<eine von: ${PRIVATE_EXPENSE_CATEGORIES.join(', ')}>",
  "confidence": <0.0-1.0, wie sicher du bei der Kategorie-Zuordnung bist>
}
Wähle die Kategorie nach bestem Ermessen (z.B. Tankstelle -> Benzin, Restaurant/Supermarkt -> Essen, Kiosk/Tabakwaren -> Zigaretten). Wenn unklar, nimm "Sonstiges" und senke die confidence.`

export interface PrivateExpenseExtraction {
  date: string
  amount: number
  note: string
  category: string
  confidence: number
}

export async function extractPrivateExpense(
  imageBase64: string,
  mediaType: string,
  today: string
): Promise<PrivateExpenseExtraction> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Heutiges Datum: ${today}. Lies diesen Beleg aus.`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Konnte keine Daten aus dem Bild lesen')

  const parsed = JSON.parse(jsonMatch[0])
  const amount = Math.abs(Number(parsed.amount) || 0)
  const category = PRIVATE_EXPENSE_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : 'Sonstiges'

  return {
    date: parsed.date || today,
    amount,
    note: parsed.note || '',
    category,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
  }
}

const BATCH_SYSTEM_PROMPT = `Du ordnest Kontoauszug-Buchungstexte (private Ausgaben) einer Kategorie zu.
Kategorien: ${PRIVATE_EXPENSE_CATEGORIES.join(', ')}
Du bekommst eine JSON-Liste von Buchungsbeschreibungen. Antworte NUR mit einem validen JSON-Array gleicher Länge und Reihenfolge, ein Kategorie-String pro Eintrag, z.B.:
["Benzin", "Essen", "Sonstiges"]
Ordne nach Handelsname/Kontext zu (z.B. "Shell", "Aral", "Esso" -> Benzin; Supermärkte/Restaurants/Lieferdienste -> Essen; Kiosk/Tabak -> Zigaretten; Kino/Streaming/Sport -> Freizeit; Kleidungsläden -> Kleidung). Wenn unklar: Sonstiges.`

export async function classifyExpenseBatch(descriptions: string[]): Promise<string[]> {
  if (descriptions.length === 0) return []

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: BATCH_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(descriptions),
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Konnte Kategorien nicht zuordnen')

  const parsed = JSON.parse(jsonMatch[0])
  return descriptions.map((_, i) =>
    PRIVATE_EXPENSE_CATEGORIES.includes(parsed[i]) ? parsed[i] : 'Sonstiges'
  )
}
