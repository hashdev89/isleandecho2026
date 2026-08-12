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
import { tourFitsGuestCountFromTour, formatGroupSizeRange, getTourGroupSize } from '@/lib/tourGroupSize'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'

export default function ToursClient() {
  const { page } = useCmsPage('/tours')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [duration, setDuration] = useState('all')
  const [guestFilter, setGuestFilter] = useState(() => {
    const fromUrl = parseInt(searchParams.get('guests') || '0', 10)
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 0
  })

  useEffect(() => {
    const fromUrl = parseInt(searchParams.get('guests') || '0', 10)
    if (Number.isFinite(fromUrl) && fromUrl > 0) {
      setGuestFilter(fromUrl)
    }
  }, [searchParams])

  const categories = [
    { id: 'all', name: 'All Tours' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'cultural', name: 'Cultural' },
    { id: 'beach', name: 'Beach' },
    { id: 'mountain', name: 'Mountain' },
    { id: 'city', name: 'City Breaks' },
    { id: 'wildlife', name: 'Wildlife' }
  ]

  const [tours, setTours] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tours')
        const json = await res.json()
        if (json.success) setTours(json.data)
      } catch {}
    }
    load()
  }, [])

  const filteredTours = tours.filter(tour => {
    const categoryMatch = selectedCategory === 'all' || tour.category === selectedCategory
    const numericPrice = typeof tour.price === 'number' ? tour.price : parseFloat(String(tour.price || '').replace(/[^0-9.]/g, ''))
    const priceMatch = !isNaN(numericPrice) ? (numericPrice >= priceRange[0] && numericPrice <= priceRange[1]) : true
    const durationMatch = duration === 'all' || String(tour.duration || '').includes(duration)
    const guestMatch = !guestFilter || tourFitsGuestCountFromTour(tour, guestFilter)
    return categoryMatch && priceMatch && durationMatch && guestMatch
  })

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="lg:col-span-1">
            <div className="lp-panel p-6">
              <div className="flex items-center mb-6">
                <Filter className="w-5 h-5 mr-2 text-[var(--lagoon)]" />
                <h3 className="text-lg font-semibold text-[var(--ink)]">Filters</h3>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Category</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2 w-4 h-4 accent-[var(--lagoon)] touch-manipulation"
                      />
                      <span className="text-sm text-[var(--ink-soft)]">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Price Range</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 accent-[var(--lagoon)] touch-manipulation"
                  />
                  <div className="flex justify-between text-sm text-[var(--ink-soft)]">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

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

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 className="lp-section-title text-2xl sm:text-3xl">
                {filteredTours.length} tours found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                        <span className="font-semibold">{tour.rating ?? '4.8'}</span>
                        <span className="opacity-70">({tour.reviews ?? 120})</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--sun)]">
                        Book <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
