'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  SITE_CURRENCIES,
  currencyMeta,
  formatMoneyAmount,
  parseMoney,
  type SiteCurrencyCode,
} from '@/lib/currency'

type CurrencyContextValue = {
  currencies: typeof SITE_CURRENCIES
  baseCurrency: string
  selectedCurrency: string
  baseSymbol: string
  selectedSymbol: string
  setSelectedCurrency: (code: string) => void
  convert: (amount: number, to?: string) => number
  formatPrice: (value: number | string, to?: string) => string
  formatBasePrice: (value: number | string) => string
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useState('LKR')
  const [selectedCurrency, setSelectedCurrencyState] = useState('LKR')
  const [rates, setRates] = useState<Record<string, number>>({ LKR: 1 })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('selected-currency')
      if (saved) setSelectedCurrencyState(saved.toUpperCase())
    } catch {
      /* ignore */
    }

    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        const currency = String(json?.data?.currency || json?.currency || 'LKR').toUpperCase()
        setBaseCurrency(currency)
        try {
          if (!localStorage.getItem('selected-currency')) setSelectedCurrencyState(currency)
        } catch {
          setSelectedCurrencyState((current) => current || currency)
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    fetch(`/api/currency/rates?base=${encodeURIComponent(baseCurrency)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json.rates) setRates({ [baseCurrency]: 1, ...json.rates })
      })
      .catch(() => undefined)
  }, [baseCurrency])

  const setSelectedCurrency = useCallback((code: string) => {
    const next = code.toUpperCase()
    setSelectedCurrencyState(next)
    try {
      localStorage.setItem('selected-currency', next)
    } catch {
      /* ignore */
    }
  }, [])

  const convert = useCallback(
    (amount: number, to = selectedCurrency) => {
      if (!Number.isFinite(amount)) return 0
      const target = to.toUpperCase()
      if (target === baseCurrency) return amount
      const rate = rates[target]
      return Number.isFinite(rate) ? amount * rate : amount
    },
    [baseCurrency, rates, selectedCurrency]
  )

  const formatPrice = useCallback(
    (value: number | string, to = selectedCurrency) => {
      return formatMoneyAmount(convert(parseMoney(value), to), to)
    },
    [convert, selectedCurrency]
  )

  const formatBasePrice = useCallback(
    (value: number | string) => formatMoneyAmount(parseMoney(value), baseCurrency),
    [baseCurrency]
  )

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currencies: SITE_CURRENCIES,
      baseCurrency,
      selectedCurrency,
      baseSymbol: currencyMeta(baseCurrency).symbol,
      selectedSymbol: currencyMeta(selectedCurrency).symbol,
      setSelectedCurrency,
      convert,
      formatPrice,
      formatBasePrice,
    }),
    [baseCurrency, selectedCurrency, setSelectedCurrency, convert, formatPrice, formatBasePrice]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    return {
      currencies: SITE_CURRENCIES,
      baseCurrency: 'LKR',
      selectedCurrency: 'LKR' as SiteCurrencyCode | string,
      baseSymbol: 'Rs',
      selectedSymbol: 'Rs',
      setSelectedCurrency: () => undefined,
      convert: (amount: number) => amount,
      formatPrice: (value: number | string) => formatMoneyAmount(parseMoney(value), 'LKR'),
      formatBasePrice: (value: number | string) => formatMoneyAmount(parseMoney(value), 'LKR'),
    } satisfies CurrencyContextValue
  }
  return ctx
}
