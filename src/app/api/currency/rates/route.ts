import { NextRequest, NextResponse } from 'next/server'

const CACHE_MS = 60 * 60 * 1000
const cache = new Map<string, { rates: Record<string, number>; expires: number }>()

async function fetchRates(base: string): Promise<Record<string, number>> {
  const upper = base.toUpperCase()
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(upper)}`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.result === 'success' && json.rates) {
        return { [upper]: 1, ...json.rates }
      }
    }
  } catch (error) {
    console.error('open.er-api rates failed:', error)
  }

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${upper.toLowerCase()}.json`
    )
    if (res.ok) {
      const json = await res.json()
      const table = json?.[upper.toLowerCase()] || {}
      const rates: Record<string, number> = { [upper]: 1 }
      for (const [code, value] of Object.entries(table)) {
        const n = Number(value)
        if (Number.isFinite(n)) rates[code.toUpperCase()] = n
      }
      return rates
    }
  } catch (error) {
    console.error('fawazahmed0 rates failed:', error)
  }

  return { [upper]: 1 }
}

export async function GET(request: NextRequest) {
  const base = (request.nextUrl.searchParams.get('base') || 'LKR').toUpperCase()
  const cached = cache.get(base)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ success: true, base, rates: cached.rates, cached: true })
  }

  const rates = await fetchRates(base)
  cache.set(base, { rates, expires: Date.now() + CACHE_MS })
  return NextResponse.json({ success: true, base, rates })
}
