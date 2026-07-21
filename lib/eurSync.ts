import { Transaction } from './types'

const EUR_APP_URL = 'https://euer-app.vercel.app'

export async function addToEurApp(transaction: Transaction): Promise<boolean> {
  try {
    const current = await fetch(`${EUR_APP_URL}/api/data`, { cache: 'no-store' }).then((r) => r.json())
    const res = await fetch(`${EUR_APP_URL}/api/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, transactions: [transaction, ...(current.transactions ?? [])] }),
    })
    return res.ok
  } catch (err) {
    console.error('EÜR-App sync error:', err)
    return false
  }
}
