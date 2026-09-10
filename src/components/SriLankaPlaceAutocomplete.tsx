'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'

export interface SriLankaPlace {
  id: string
  name: string
  placeName: string
  lat: number
  lng: number
  region?: string
}

interface SriLankaPlaceAutocompleteProps {
  label?: string
  placeholder?: string
  value: SriLankaPlace | null
  onChange: (place: SriLankaPlace | null) => void
  className?: string
}

export default function SriLankaPlaceAutocomplete({
  label = 'Drop-off location',
  placeholder = 'Search cities, towns, hotels, airports…',
  value,
  onChange,
  className = '',
}: SriLankaPlaceAutocompleteProps) {
  const [query, setQuery] = useState(value?.placeName || value?.name || '')
  const [results, setResults] = useState<SriLankaPlace[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(wrapRef, open, close)

  useEffect(() => {
    setQuery(value?.placeName || value?.name || '')
  }, [value])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      return
    }
    if (value && (value.placeName === q || value.name === q)) {
      return
    }

    const handle = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/places/sri-lanka?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        if (json.success) {
          setResults(json.data || [])
          setOpen(true)
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => window.clearTimeout(handle)
  }, [query, value])

  return (
    <div className={`relative ${open ? 'z-[100]' : 'z-10'} ${className}`} ref={wrapRef}>
      {label ? (
        <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lagoon)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (value) onChange(null)
            setOpen(true)
          }}
          onFocus={() => {
            if (results.length) setOpen(true)
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-3 md:py-4 border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px]"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--ink-soft)]" />
        ) : null}
      </div>
      {open && results.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white shadow-2xl py-1"
        >
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  onChange(place)
                  setQuery(place.placeName || place.name)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
              >
                <span className="font-medium block truncate">{place.name}</span>
                <span className="text-xs text-[var(--ink-soft)] block truncate">{place.placeName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !loading && query.trim().length >= 1 && results.length === 0 ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-[110] rounded-xl border border-black/10 bg-white shadow-2xl px-4 py-3 text-sm text-[var(--ink-soft)]">
          No matching locations in Sri Lanka
        </div>
      ) : null}
    </div>
  )
}
