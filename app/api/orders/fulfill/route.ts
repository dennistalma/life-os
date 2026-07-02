import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { orderId, platform, trackingNumber, carrier } = await req.json()

  if (platform === 'wix') {
    const apiKey = process.env.WIX_API_KEY
    const siteId = process.env.WIX_SITE_ID
    if (!apiKey || !siteId) return NextResponse.json({ error: 'Wix nicht konfiguriert' }, { status: 500 })

    try {
      const res = await fetch(
        `https://www.wixapis.com/ecom/v1/orders/${orderId}/fulfillments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey,
            'wix-site-id': siteId,
          },
          body: JSON.stringify({
            fulfillment: {
              lineItems: [],
              trackingInfo: trackingNumber ? {
                trackingNumber,
                shippingProvider: carrier || 'DHL',
              } : undefined,
            },
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Wix Fehler')
      return NextResponse.json({ ok: true })
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 })
    }
  }

  if (platform === 'etsy') {
    // Etsy API still pending — return info
    return NextResponse.json({ error: 'Etsy API noch nicht freigegeben. Bitte manuell auf Etsy versenden.' }, { status: 400 })
  }

  return NextResponse.json({ error: 'Unbekannte Plattform' }, { status: 400 })
}
