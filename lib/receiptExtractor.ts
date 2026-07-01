import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `Du liest Belege/Rechnungen (Fotos oder Screenshots) für eine einfache Einnahmen-Überschuss-Rechnung (EÜR).
Extrahiere die Daten aus dem Bild und antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "vendor": "<Name des Ausstellers/Händlers, oder null>",
  "description": "<kurze Beschreibung, was gekauft/verkauft wurde>",
  "date": "<Rechnungsdatum als YYYY-MM-DD, falls nicht erkennbar heutiges Datum>",
  "grossAmount": <Bruttobetrag als Zahl>,
  "netAmount": <Nettobetrag als Zahl, falls nicht angegeben grossAmount/1.19 schätzen>,
  "vatAmount": <MwSt.-Betrag als Zahl, falls nicht angegeben grossAmount - netAmount>,
  "vatRate": <MwSt.-Satz in Prozent, z.B. 19 oder 7, oder null>,
  "type": "<'expense' wenn es ein Einkaufsbeleg ist, 'income' wenn es eine von dir ausgestellte Verkaufsrechnung ist>",
  "category": "<grobe Kategorie, z.B. 'Material', 'Büro', 'Software', 'Verkauf', 'Sonstiges'>",
  "confidence": <0.0-1.0, wie sicher du bei der Erkennung bist>
}
Wenn du einen Wert nicht sicher erkennen kannst, mach eine plausible Schätzung und senke die confidence entsprechend.`

export interface ReceiptExtraction {
  vendor: string | null
  description: string
  date: string
  grossAmount: number
  netAmount: number
  vatAmount: number
  vatRate: number | null
  type: 'income' | 'expense'
  category: string
  confidence: number
}

export async function extractReceipt(
  imageBase64: string,
  mediaType: string,
  today: string
): Promise<ReceiptExtraction> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
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
  if (!jsonMatch) throw new Error('Konnte keine Daten aus dem Beleg lesen')

  const parsed = JSON.parse(jsonMatch[0])
  const gross = Math.abs(Number(parsed.grossAmount) || 0)
  const net = parsed.netAmount != null ? Math.abs(Number(parsed.netAmount)) : Math.round((gross / 1.19) * 100) / 100
  const vat = parsed.vatAmount != null ? Math.abs(Number(parsed.vatAmount)) : Math.round((gross - net) * 100) / 100

  return {
    vendor: parsed.vendor || null,
    description: parsed.description || 'Beleg',
    date: parsed.date || today,
    grossAmount: gross,
    netAmount: net,
    vatAmount: vat,
    vatRate: parsed.vatRate != null ? Number(parsed.vatRate) : null,
    type: parsed.type === 'income' ? 'income' : 'expense',
    category: parsed.category || 'Sonstiges',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
  }
}
