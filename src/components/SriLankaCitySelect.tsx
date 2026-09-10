'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronDown, MapPin, Search } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'
import {
  SRI_LANKA_CITIES,
  filterSriLankaCities,
  type RentalLocation,
} from '@/lib/rentalLocations'

interface SriLankaCitySelectProps {
  label: string
  valueId: string
  onChange: (city: RentalLocation | null) => void
  placeholder?: string
  className?: string
}

export default function SriLankaCitySelect({
  label,
  valueId,
  onChange,
  placeholder = 'Search Sri Lanka cities…',
  className = '',
}: SriLankaCitySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(wrapRef, open, close)

  const selected = useMemo(
    () => SRI_LANKA_CITIES.find((c) => c.id === valueId) || null,
    [valueId]
  )

  const results = useMemo(() => filterSriLankaCities(query, 20), [query])

  const display = selected
    ? `${selected.name}${selected.region ? ` — ${selected.region}` : ''}`
    : ''

  return (
    <div className={`relative ${open ? 'z-[100]' : 'z-10'} ${className}`} ref={wrapRef}>
      <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v)
            setQuery('')
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="w-full pl-4 pr-10 py-3 md:py-4 text-left border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px] flex items-center cursor-pointer hover:border-[var(--lagoon)] transition-colors"
        >
          <span className={`block truncate ${selected ? '' : 'text-[var(--ink-soft)]'}`}>
            {display || placeholder}
          </span>
        </button>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-[110] rounded-xl border border-black/10 bg-white shadow-2xl overflow-hidden">
          <div className="relative border-b border-black/5 p-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter cities (e.g. Kan → Kandy)"
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-[var(--foam)] border border-black/5 focus:ring-2 focus:ring-[var(--lagoon)] outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-[min(280px,50vh)] overflow-y-auto overscroll-contain py-1">
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!valueId}
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                  setQuery('')
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-[var(--sun)]/40"
              >
                Clear selection
              </button>
            </li>
            {results.map((city) => {
              const active = city.id === valueId
              return (
                <li key={city.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(city)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                        : 'text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{city.name}</span>
                        <span
                          className={`block text-xs truncate ${
                            active ? 'text-white/70' : 'text-[var(--ink-soft)]'
                          }`}
                        >
                          {city.region} Province
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[var(--ink-soft)]">No matching cities</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
