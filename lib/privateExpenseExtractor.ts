import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export const PRIVATE_EXPENSE_CATEGORIES = ['Red Bull', 'Benzin', 'Trinken', 'Tabak', 'Essen', 'Fixkosten', 'Poker', 'Sonstiges', 'SL'] as const

// Shared between the dedicated private-capture prompt and the dashboard's
// general classifier, so both agree on the same category regardless of
// which input field was used.
export const PRIVATE_EXPENSE_CATEGORY_GUIDANCE = `- "Red Bull" -> Red Bull, Energy Drinks
- "Benzin" -> Tankstelle, Tanken, Diesel, Sprit
- "Trinken" -> sonstige Getränke (Wasser, Kaffee, Bier, Softdrinks außer Red Bull)
- "Tabak" -> Zigaretten, Tabak, Vape
- "Essen" -> Supermarkt, Restaurant, Lieferdienst, Snacks
- "Fixkosten" -> Miete, Abos, Versicherung, Handyvertrag und ähnliche wiederkehrende Kosten
- "Poker" -> Poker, Casino, Buy-in, Cashgame, Wetten
- "SL" -> nur wenn explizit "SL" oder "Spirit Lamps" im Text vorkommt (Business-Ausgaben, werden automatisch weitergeleitet)
- "Sonstiges" -> wenn nichts davon passt`

export interface PrivateExpenseExtraction {
  date: string
  amount: number
  note: string
  category: string
  confidence: number
}

const TEXT_SYSTEM_PROMPT = `Du liest kurze Freitext-Eingaben für private Ausgaben (kein Business), z.B. "Energy Drink 2€" oder "80€ Benzin tanken".
Antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "amount": <Betrag als Zahl, positiv>,
  "note": "<kurze Notiz, z.B. was gekauft wurde>",
  "category": "<eine von: ${PRIVATE_EXPENSE_CATEGORIES.join(', ')}>",
  "date": "<YYYY-MM-DD falls explizit im Text genannt (z.B. 'gestern', 'letzten Montag'), sonst null>",
  "confidence": <0.0-1.0, wie sicher du bei der Kategorie-Zuordnung bist>
}
Wähle die Kategorie nach bestem Ermessen:
${PRIVATE_EXPENSE_CATEGORY_GUIDANCE}
Wenn kein Datum im Text steht, setze "date" auf null (nicht raten).`

export async function parsePrivateExpenseText(
  input: string,
  today: string
): Promise<PrivateExpenseExtraction> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: TEXT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Heutiges Datum: ${today}\nEingabe: "${input}"`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Konnte die Eingabe nicht verstehen')

  const parsed = JSON.parse(jsonMatch[0])
  const amount = Math.abs(Number(parsed.amount) || 0)
  if (!amount) throw new Error('Kein Betrag erkannt')

  const category = PRIVATE_EXPENSE_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : 'Sonstiges'

  return {
    date: parsed.date || today,
    amount,
    note: parsed.note || input,
    category,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
  }
}
