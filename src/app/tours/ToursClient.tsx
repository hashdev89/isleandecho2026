/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MapPin,
  Star,
  Clock,
  Filter,
  ArrowRight
} from 'lucide-react'
import Header from '../../components/Header'
import StructuredData, { breadcrumbSchema } from '../../components/StructuredData'
import { tourFitsGuestCountFromTour } from '@/lib/tourGroupSize'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getTourRating, getTourReviews, parseMoney } from '@/lib/currency'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'

const KNOWN_STYLES = [
  { id: 'all', name: 'All Tours' },
  { id: 'Fun & Adventure', name: 'Fun & Adventure' },
  { id: 'Cultural & Heritage', name: 'Cultural & Heritage' },
  { id: 'Nature & Wildlife', name: 'Nature & Wildlife' },
  { id: 'Relaxation & Wellness', name: 'Relaxation & Wellness' },
  { id: 'Family Friendly', name: 'Family Friendly' },
  { id: 'Luxury Experience', name: 'Luxury Experience' },
  { id: 'Budget Travel', name: 'Budget Travel' },
  { id: 'Romantic Getaway', name: 'Romantic Getaway' },
]

const STYLE_ALIASES: Record<string, string[]> = {
  adventure: ['adventure', 'fun'],
  cultural: ['cultural', 'heritage'],
  beach: ['beach', 'relax', 'wellness', 'coast'],
  mountain: ['mountain', 'hill', 'highland'],
  city: ['city'],
  wildlife: ['wildlife', 'nature'],
}

function normalizeStyle(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function styleMatches(tourStyle: string | undefined, selected: string) {
  if (!selected || selected === 'all') return true
  const style = normalizeStyle(tourStyle)
  const sel = normalizeStyle(selected)
  if (!style) return false
  if (style === sel) return true
  if (style.includes(sel) || sel.includes(style)) return true
  const aliases = STYLE_ALIASES[sel]
  if (aliases) return aliases.some((key) => style.includes(key))
  return false
}

function getTourDays(duration?: string | null) {
  if (!duration) return 0
  const text = String(duration)
  const daysMatch = text.match(/(\d+)\s*(?:days?|d)\b/i)
  if (daysMatch) return parseInt(daysMatch[1], 10)
  const nightsMatch = text.match(/(\d+)\s*(?:nights?|n)\b/i)
  if (nightsMatch) return parseInt(nightsMatch[1], 10) + 1
  const firstNum = text.match(/(\d+)/)
  return firstNum ? parseInt(firstNum[1], 10) : 0
}

function durationMatches(tourDuration: string | undefined, selected: string) {
  if (!selected || selected === 'all') return true
  const days = getTourDays(tourDuration)
  if (!days) return false
  if (selected === '1-3') return days >= 1 && days <= 3
  if (selected === '4-7') return days >= 4 && days <= 7
  if (selected === '8+') return days >= 8
  return true
}

function isPublicTour(tour: any) {
  const status = String(tour?.status || 'active').toLowerCase()
  return status === 'active' || status === 'published' || status === 'true' || status === ''
}

function destinationText(tour: any) {
  if (Array.isArray(tour?.destinations)) return tour.destinations.map(String).join(' ')
  if (typeof tour?.destinations === 'string') return tour.destinations
  return String(tour?.location || '')
}

export default function ToursClient() {
  const { formatPrice } = useCurrency()
  const { page } = useCmsPage('/tours')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedStyle, setSelectedStyle] = useState(() => searchParams.get('style') || searchParams.get('category') || 'all')
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [duration, setDuration] = useState(() => searchParams.get('duration') || 'all')
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '')
  const [guestFilter, setGuestFilter] = useState(() => {
    const fromUrl = parseInt(searchParams.get('guests') || '0', 10)
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 0
  })
  const [tours, setTours] = useState<any[]>([])

  useEffect(() => {
    const fromUrl = parseInt(searchParams.get('guests') || '0', 10)
    setGuestFilter(Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 0)
    const style = searchParams.get('style') || searchParams.get('category')
    if (style) setSelectedStyle(style)
    const durationParam = searchParams.get('duration')
    if (durationParam) setDuration(durationParam)
    const search = searchParams.get('search')
    if (search) setSearchQuery(search)
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tours')
        const json = await res.json()
        if (json.success) setTours(Array.isArray(json.data) ? json.data : [])
      } catch {
        setTours([])
      }
    }
    load()
  }, [])

  const publicTours = useMemo(() => tours.filter(isPublicTour), [tours])

  const priceBounds = useMemo(() => {
    const prices = publicTours.map((tour) => parseMoney(tour.price)).filter((price) => price > 0)
    if (!prices.length) return { min: 0, max: 0 }
    return { min: 0, max: Math.max(...prices) }
  }, [publicTours])

  const effectivePriceRange = priceRange ?? [priceBounds.min, priceBounds.max || 0]

  useEffect(() => {
    if (priceBounds.max > 0 && !priceRange) {
      setPriceRange([priceBounds.min, priceBounds.max])
    }
  }, [priceBounds.min, priceBounds.max, priceRange])

  const styleOptions = useMemo(() => {
    const found = new Set(
      publicTours.map((tour) => String(tour.style || '').trim()).filter(Boolean)
    )
    const known = KNOWN_STYLES.filter(
      (option) => option.id === 'all' || [...found].some((style) => styleMatches(style, option.id))
    )
    const extras = [...found]
      .filter((style) => !KNOWN_STYLES.some((option) => normalizeStyle(option.id) === normalizeStyle(style)))
      .sort((a, b) => a.localeCompare(b))
      .map((style) => ({ id: style, name: style }))
    return known.length > 1 || extras.length ? [...known, ...extras] : KNOWN_STYLES
  }, [publicTours])

  const filteredTours = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return publicTours.filter((tour) => {
      const styleMatch = styleMatches(tour.style || tour.category, selectedStyle)
      const numericPrice = parseMoney(tour.price)
      const priceMatch =
        !priceBounds.max || numericPrice <= 0
          ? true
          : numericPrice >= effectivePriceRange[0] && numericPrice <= effectivePriceRange[1]
      const durationMatch = durationMatches(tour.duration, duration)
      const guestMatch = !guestFilter || tourFitsGuestCountFromTour(tour, guestFilter)
      const searchMatch =
        !query ||
        String(tour.name || '').toLowerCase().includes(query) ||
        destinationText(tour).toLowerCase().includes(query) ||
        String(tour.style || '').toLowerCase().includes(query)
      return styleMatch && priceMatch && durationMatch && guestMatch && searchMatch
    })
  }, [
    publicTours,
    selectedStyle,
    effectivePriceRange,
    priceBounds.max,
    duration,
    guestFilter,
    searchQuery,
  ])

  const filtersActive =
    selectedStyle !== 'all' ||
    duration !== 'all' ||
    guestFilter > 0 ||
    searchQuery.trim() !== '' ||
    (priceBounds.max > 0 && effectivePriceRange[1] < priceBounds.max)

  const clearFilters = () => {
    setSelectedStyle('all')
    setDuration('all')
    setGuestFilter(0)
    setSearchQuery('')
    if (priceBounds.max > 0) setPriceRange([priceBounds.min, priceBounds.max])
  }

  const priceStep =
    priceBounds.max > 100000 ? 5000 : priceBounds.max > 10000 ? 1000 : priceBounds.max > 1000 ? 100 : 10

  const buildTourUrl = (tourId: string) => {
    const params = new URLSearchParams()
    if (guestFilter > 0) params.set('guests', String(guestFilter))
    const query = params.toString()
    return `/tours/${tourId}${query ? `?${query}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      
      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'Bookable trips',
          title: 'Explore amazing tours',
          subtitle: 'Discover incredible destinations with our curated tour packages',
        }}
      />

      <div className="w-full max-w-[1920px] mx-auto lp-gutter py-8 sm:py-12">
        <div className="grid grid-cols-1 min-[1180px]:grid-cols-4 gap-6 sm:gap-8">
          <div className="min-[1180px]:col-span-1">
            <div className="lp-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[var(--lagoon)]" />
                  <h3 className="text-lg font-semibold text-[var(--ink)]">Filters</h3>
                </div>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-[var(--lagoon)] hover:text-[var(--lagoon-deep)]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Search</h4>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tour name or destination"
                  className="w-full p-2.5 border border-black/10 rounded-full text-base min-h-[44px] bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Style</h4>
                <div className="space-y-2">
                  {styleOptions.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedStyle === category.id}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="mr-2 w-4 h-4 accent-[var(--lagoon)] touch-manipulation"
                      />
                      <span className="text-sm text-[var(--ink-soft)]">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {priceBounds.max > 0 ? (
                <div className="mb-6">
                  <h4 className="font-medium mb-3 text-[var(--ink)]">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceStep}
                      value={Math.min(Math.max(effectivePriceRange[1], priceBounds.min), priceBounds.max)}
                      onChange={(e) => setPriceRange([priceBounds.min, Number(e.target.value)])}
                      className="w-full h-2 accent-[var(--lagoon)] touch-manipulation"
                    />
                    <div className="flex justify-between text-sm text-[var(--ink-soft)]">
                      <span>{formatPrice(priceBounds.min)}</span>
                      <span>Up to {formatPrice(effectivePriceRange[1])}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Group size</h4>
                <div className="relative flex items-center">
                  <button
                    type="button"
                    aria-label="Decrease guests"
                    onClick={() => setGuestFilter((g) => Math.max(0, g - 1))}
                    className="w-9 h-9 rounded-full border border-black/10 text-[var(--lagoon-deep)] font-bold hover:bg-[var(--sun)] transition-colors flex items-center justify-center shrink-0"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Any"
                    value={guestFilter || ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        setGuestFilter(0)
                        return
                      }
                      const n = parseInt(raw, 10)
                      if (!Number.isFinite(n)) return
                      setGuestFilter(Math.max(0, Math.min(999, n)))
                    }}
                    className="mx-2 w-full py-2 text-center border border-black/10 rounded-full bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="Increase guests"
                    onClick={() => setGuestFilter((g) => Math.min(999, g + 1))}
                    className="w-9 h-9 rounded-full border border-black/10 text-[var(--lagoon-deep)] font-bold hover:bg-[var(--sun)] transition-colors flex items-center justify-center shrink-0"
                  >
                    +
                  </button>
                </div>
                <p className="mt-2 text-xs text-[var(--ink-soft)]">
                  {guestFilter > 0
                    ? `Showing packages for ${guestFilter} guest${guestFilter === 1 ? '' : 's'}`
                    : 'Leave empty to show all group sizes'}
                </p>
              </div>

              <div className="mb-2">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Duration</h4>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2.5 border border-black/10 rounded-full text-base min-h-[44px] touch-manipulation bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent"
                >
                  <option value="all">All Durations</option>
                  <option value="1-3">1-3 days</option>
                  <option value="4-7">4-7 days</option>
                  <option value="8+">8+ days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="min-[1180px]:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 className="lp-section-title text-2xl sm:text-3xl">
                {filteredTours.length} tour{filteredTours.length === 1 ? '' : 's'} found
              </h2>
            </div>

            {filteredTours.length === 0 ? (
              <div className="lp-panel p-10 text-center">
                <p className="text-[var(--ink)] text-lg font-semibold mb-2">No tours match these filters</p>
                <p className="text-[var(--ink-soft)] mb-4">Try another style, duration, price, or group size.</p>
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-5 py-2.5 rounded-full bg-[var(--lagoon-deep)] text-white font-semibold hover:bg-[var(--lagoon)]"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1400px]:grid-cols-3 gap-5">
                {filteredTours.map((tour) => (
                  <button
                    key={tour.id}
                    type="button"
                    onClick={() => router.push(buildTourUrl(tour.id))}
                    className="lp-photo-card group text-left h-[420px] cursor-pointer"
                  >
                    <Image
                      src={tour.image || (tour.images?.[0] ?? '/placeholder-image.svg')}
                      alt={tour.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {tour.style && (
                      <div className="absolute top-4 left-4 z-20 bg-[var(--sun)] text-[var(--lagoon-deep)] px-3 py-1 rounded-full text-xs font-bold">
                        {tour.style}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                      <p className="text-white/80 text-xs font-semibold tracking-[0.12em] uppercase mb-2 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {tour.duration}
                      </p>
                      <h3 className="text-xl font-semibold text-white leading-tight mb-2 line-clamp-2">{tour.name}</h3>
                      <p className="text-white/75 text-sm mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">
                          {(tour.location) || (Array.isArray(tour.destinations) ? tour.destinations.slice(0,2).join(', ') : 'Sri Lanka')}
                        </span>
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-1 text-white/90 text-sm">
                          <Star className="w-4 h-4 text-[var(--sun)] fill-current" />
                          <span className="font-semibold">{getTourRating(tour) || '—'}</span>
                          <span className="opacity-70">({getTourReviews(tour)})</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--sun)]">
                          {parseMoney(tour.price) > 0 ? formatPrice(tour.price) : 'Book'}
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <StructuredData data={breadcrumbSchema([
        { name: "Home", url: "https://isleandecho.com" },
        { name: "Tours", url: "https://isleandecho.com/tours" }
      ])} />
    </div>
  )
}
