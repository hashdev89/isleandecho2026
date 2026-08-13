export const SITE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
] as const

export type SiteCurrencyCode = (typeof SITE_CURRENCIES)[number]['code']

export function currencyMeta(code?: string | null) {
  const value = String(code || 'LKR').toUpperCase()
  return SITE_CURRENCIES.find((item) => item.code === value) || { code: value, name: value, symbol: value }
}

export function parseMoney(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function formatMoneyAmount(amount: number, currencyCode: string) {
  const meta = currencyMeta(currencyCode)
  const safe = Number.isFinite(amount) ? amount : 0
  const formatted = safe.toLocaleString(undefined, {
    minimumFractionDigits: safe >= 100 || Number.isInteger(safe) ? 0 : 2,
    maximumFractionDigits: safe >= 100 ? 0 : 2,
  })
  return `${meta.symbol} ${formatted}`
}

export function getTourRating(tour: { rating?: number | string; importantInfo?: Record<string, unknown>; important_info?: Record<string, unknown> } | null | undefined) {
  const extra = tour?.importantInfo || tour?.important_info || {}
  const n = Number(tour?.rating ?? extra.rating ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function getTourReviews(tour: { reviews?: number | string; importantInfo?: Record<string, unknown>; important_info?: Record<string, unknown> } | null | undefined) {
  const extra = tour?.importantInfo || tour?.important_info || {}
  const n = Number(tour?.reviews ?? extra.reviews ?? 0)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
}
