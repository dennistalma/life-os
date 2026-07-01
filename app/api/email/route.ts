import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

export async function GET() {
  const email = process.env.OUTLOOK_EMAIL
  const password = process.env.OUTLOOK_PASSWORD

  if (!email || !password) {
    return NextResponse.json({ error: 'E-Mail nicht konfiguriert' }, { status: 500 })
  }

  const client = new ImapFlow({
    host: 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    const messages: {
      id: string
      subject: string
      from: string
      date: string
      read: boolean
      preview: string
    }[] = []

    try {
      // Fetch last 20 messages
      const status = await client.status('INBOX', { messages: true })
      const total = status.messages || 0
      const from = Math.max(1, total - 19)

      for await (const msg of client.fetch(`${from}:*`, {
        envelope: true,
        flags: true,
        bodyStructure: true,
        bodyParts: ['1'],
      })) {
        const env = msg.envelope
        const fromAddr = env.from?.[0]
        const fromStr = fromAddr?.name
          ? `${fromAddr.name} <${fromAddr.address}>`
          : fromAddr?.address || 'Unbekannt'

        let preview = ''
        try {
          const part = msg.bodyParts?.get('1')
          if (part) {
            preview = Buffer.from(part).toString('utf8').replace(/\s+/g, ' ').slice(0, 120)
          }
        } catch {
          preview = ''
        }

        messages.push({
          id: String(msg.uid),
          subject: env.subject || '(Kein Betreff)',
          from: fromStr,
          date: env.date?.toISOString() || new Date().toISOString(),
          read: msg.flags?.has('\\Seen') || false,
          preview,
        })
      }
    } finally {
      lock.release()
    }

    await client.logout()

    // newest first
    messages.reverse()

    return NextResponse.json({ messages, total: messages.length })
  } catch (err) {
    try { await client.logout() } catch {}
    const msg = err instanceof Error ? `${err.message} | ${(err as Record<string,unknown>).response || ''}` : 'IMAP Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
