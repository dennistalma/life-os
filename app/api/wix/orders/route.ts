import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.WIX_API_KEY
  const siteId = process.env.WIX_SITE_ID

  if (!apiKey || !siteId) {
    return NextResponse.json({ error: 'Wix nicht konfiguriert' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://www.wixapis.com/ecom/v1/orders/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'wix-site-id': siteId,
        },
        body: JSON.stringify({
          filter: {},
          sort: [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: 20 },
        }),
      }
    )

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Wix API Fehler')

    const orders = (data.orders || []).map((o: Record<string, unknown>) => {
      const pricing = o.priceSummary as Record<string, { amount: string }> | undefined
      const buyer = o.buyerInfo as Record<string, string> | undefined
      return {
        id: o.id,
        number: o.number,
        status: o.status,
        createdDate: o.createdDate,
        total: pricing?.total?.amount || '0',
        currency: o.currency,
        buyerName: buyer?.firstName
          ? `${buyer.firstName} ${buyer.lastName || ''}`.trim()
          : buyer?.email || 'Unbekannt',
        lineItemsCount: Array.isArray(o.lineItems) ? o.lineItems.length : 0,
      }
    })

    // Summary stats
    const totalRevenue = orders.reduce(
      (sum: number, o: { total: string }) => sum + parseFloat(o.total || '0'),
      0
    )

    return NextResponse.json({ orders, totalRevenue, count: orders.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fehler' },
      { status: 500 }
    )
  }
}
