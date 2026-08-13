/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react'
import Header from '../../components/Header'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'
import {
  destinationSearchMatches,
  isPublicDestination,
  regionMatches,
  uniqueRegions,
} from '@/lib/destinationFilters'

export default function DestinationsPage() {
  const { page } = useCmsPage('/destinations')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [destinations, setDestinations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/destinations')
        const json = await res.json()
        if (json.success) {
          setDestinations(Array.isArray(json.data) ? json.data : [])
        } else {
          setError('Failed to load destinations')
        }
      } catch (err) {
        setError('Error loading destinations')
        console.error('Error loading destinations:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const publicDestinations = useMemo(
    () => (destinations || []).filter(isPublicDestination),
    [destinations]
  )

  const regions = useMemo(
    () => [{ id: 'all', name: 'All Sri Lanka' }, ...uniqueRegions(publicDestinations).map((region) => ({ id: region, name: region }))],
    [publicDestinations]
  )

  const filteredDestinations = useMemo(
    () =>
      publicDestinations.filter((destination) => {
        const regionMatch = regionMatches(destination.region, selectedRegion)
        const searchMatch = destinationSearchMatches(destination, searchQuery)
        return regionMatch && searchMatch
      }),
    [publicDestinations, selectedRegion, searchQuery]
  )

  const filtersActive = selectedRegion !== 'all' || searchQuery.trim() !== ''

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedRegion('all')
  }

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      
      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'Where to go',
          title: 'Explore Sri Lanka destinations',
          subtitle: 'Discover amazing places across the island',
        }}
      />

      <div className="w-full max-w-[1920px] mx-auto lp-gutter py-10 sm:py-12">
        <div className="lp-panel p-4 sm:p-6 mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-full focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent bg-[var(--foam)] text-[var(--ink)] min-h-[44px]"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--lagoon)]" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
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

              <div>
                <h4 className="font-medium mb-3 text-[var(--ink)]">Region</h4>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <label key={region.id} className="flex items-center">
                      <input
                        type="radio"
                        name="region"
                        value={region.id}
                        checked={selectedRegion === region.id}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="mr-2 accent-[var(--lagoon)]"
                      />
                      <span className="text-sm text-[var(--ink-soft)]">{region.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 className="lp-section-title text-2xl sm:text-3xl">
                {loading ? 'Loading destinations...' : 
                 error ? 'Error loading destinations' :
                 `${filteredDestinations.length} destination${filteredDestinations.length === 1 ? '' : 's'} found`}
              </h2>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--lagoon)]"></div>
                <span className="ml-2 text-[var(--ink-soft)]">Loading destinations...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-[var(--lagoon-deep)] text-white px-5 py-2.5 rounded-full hover:bg-[var(--lagoon)]"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && filteredDestinations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-[var(--ink-soft)] mb-4">No destinations found matching your criteria.</div>
                {filtersActive ? (
                  <button 
                    onClick={clearFilters} 
                    className="bg-[var(--lagoon-deep)] text-white px-5 py-2.5 rounded-full hover:bg-[var(--lagoon)]"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            )}

            {!loading && !error && filteredDestinations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDestinations.map((destination) => {
                const badge = String(destination.region || 'Explore').trim() || 'Explore'

                return (
                  <Link
                    key={destination.id}
                    href={`/destinations/${destination.id}`}
                    className="lp-photo-card group block min-h-[360px]"
                  >
                    <Image
                      src={destination.image || '/placeholder-image.svg'}
                      alt={destination.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-4 left-4 z-20 bg-black/70 text-[var(--sun)] px-3 py-1 rounded-full text-xs font-bold">
                      {badge}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white leading-tight mb-2 line-clamp-2">{destination.name}</h3>
                      <p className="text-white/80 text-sm line-clamp-2 mb-3">
                        {destination.description || 'Explore this destination.'}
                      </p>
                      <span className="inline-flex items-center gap-2 text-[var(--sun)] font-bold text-sm tracking-wide uppercase">
                        Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                )
              })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
