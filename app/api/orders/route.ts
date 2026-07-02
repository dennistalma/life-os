import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

interface Order {
  id: string
  platform: 'wix' | 'etsy' | 'email'
  orderNumber: string
  customer: string
  product: string
  amount: number
  currency: string
  status: string
  date: string
  link?: string
}

async function fetchWixOrders(): Promise<Order[]> {
  const apiKey = process.env.WIX_API_KEY
  const siteId = process.env.WIX_SITE_ID
  if (!apiKey || !siteId) return []

  try {
    const res = await fetch('https://www.wixapis.com/ecom/v1/orders/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
        'wix-site-id': siteId,
      },
      body: JSON.stringify({
        sort: [{ fieldName: 'createdDate', order: 'DESC' }],
        paging: { limit: 50 },
      }),
    })
    const data = await res.json()
    if (!res.ok) return []

    return (data.orders || []).map((o: Record<string, unknown>) => {
      const pricing = o.priceSummary as Record<string, { amount: string }> | undefined
      const buyer = o.buyerInfo as Record<string, string> | undefined
      const items = Array.isArray(o.lineItems) ? o.lineItems as Record<string, unknown>[] : []
      const productName = items.length > 0
        ? String((items[0] as Record<string, unknown>).productName || 'Produkt')
        : `${items.length} Artikel`

      const statusMap: Record<string, string> = {
        PENDING: 'Ausstehend', APPROVED: 'Bestätigt',
        CANCELED: 'Storniert', FULFILLED: 'Versandt',
        PARTIALLY_FULFILLED: 'Teilversandt',
      }

      return {
        id: String(o.id),
        platform: 'wix' as const,
        orderNumber: String(o.number || ''),
        customer: buyer?.firstName
          ? `${buyer.firstName} ${buyer.lastName || ''}`.trim()
          : buyer?.email || 'Unbekannt',
        product: productName,
        amount: parseFloat(pricing?.total?.amount || '0'),
        currency: String(o.currency || 'EUR'),
        status: statusMap[String(o.status)] || String(o.status),
        date: String(o.createdDate || new Date().toISOString()),
        link: `https://manage.wix.com/premium-purchase-plan/orders`,
      }
    })
  } catch {
    return []
  }
}

async function fetchEtsyOrdersFromEmail(): Promise<Order[]> {
  const email = process.env.OUTLOOK_EMAIL
  const password = process.env.OUTLOOK_PASSWORD
  if (!email || !password) return []

  const client = new ImapFlow({
    host: 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  })

  const orders: Order[] = []

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const status = await client.status('INBOX', { messages: true })
      const total = status.messages || 0
      const from = Math.max(1, total - 99)

      for await (const msg of client.fetch(`${from}:*`, {
        envelope: true,
        flags: true,
        bodyParts: ['1'],
      })) {
        if (!msg.envelope) continue
        const fromAddr = msg.envelope.from?.[0]
        const fromEmail = fromAddr?.address?.toLowerCase() || ''
        const subject = msg.envelope.subject || ''

        // Etsy order emails
        if (!fromEmail.includes('etsy.com') && !subject.toLowerCase().includes('etsy')) continue
        if (!subject.toLowerCase().includes('order') && !subject.toLowerCase().includes('bestellung')) continue

        let body = ''
        try {
          const part = msg.bodyParts?.get('1')
          if (part) body = Buffer.from(part).toString('utf8')
        } catch { body = '' }

        // Parse order number from subject: "Order #12345678"
        const orderMatch = subject.match(/#?(\d{8,12})/)
        const orderNum = orderMatch ? orderMatch[1] : String(msg.uid)

        // Parse amount: "$12.50" or "€12,50"
        const amountMatch = body.match(/[\$€£](\d+[.,]\d{2})/) || subject.match(/[\$€£](\d+[.,]\d{2})/)
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0

        // Parse customer name
        const customerMatch = body.match(/(?:from|von|buyer|käufer)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i)
        const customer = customerMatch ? customerMatch[1] : 'Etsy Käufer'

        // Parse product from subject or body
        const productMatch = subject.replace(/order|bestellung|etsy|#\d+/gi, '').trim()

        orders.push({
          id: `etsy-${msg.uid}`,
          platform: 'etsy',
          orderNumber: orderNum,
          customer,
          product: productMatch || 'Etsy Bestellung',
          amount,
          currency: 'EUR',
          status: 'Neu',
          date: msg.envelope.date?.toISOString() || new Date().toISOString(),
          link: `https://www.etsy.com/your/orders/sold`,
        })
      }
    } finally {
      lock.release()
    }
    await client.logout()
  } catch {
    try { await client.logout() } catch {}
  }

  return orders
}

export async function GET() {
  const [wixOrders, etsyOrders] = await Promise.all([
    fetchWixOrders(),
    fetchEtsyOrdersFromEmail(),
  ])

  const all = [...wixOrders, ...etsyOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const today = new Date().toDateString()
  const todayOrders = all.filter(o => new Date(o.date).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.amount, 0)
  const totalRevenue = all.reduce((s, o) => s + o.amount, 0)

  return NextResponse.json({
    orders: all,
    stats: {
      total: all.length,
      todayCount: todayOrders.length,
      todayRevenue,
      totalRevenue,
      wixCount: wixOrders.length,
      etsyCount: etsyOrders.length,
    },
  })
}
