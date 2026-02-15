/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Star,
  Heart,
  Filter,
  ArrowRight,
} from 'lucide-react'
import Header from '../../components/Header'

export default function DestinationsPage() {
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const colors = {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#6EACFF',
      300: '#A7CDFF',
      400: '#4091FE',
      500: '#187BFF',
    },
    secondary: {
      100: '#CAFA7C',
      200: '#C6FF69',
      300: '#B4FF3A',
      400: '#ADFF29',
      500: '#A0FF07',
      600: '#9CFC00',
    },
    text: {
      base: '#0F172A',
      muted: '#94A3B8',
      highlight: '#334155',
    },
  }

  const regions = [
    { id: 'all', name: 'All Sri Lanka' },
    { id: 'Cultural Triangle', name: 'Cultural Triangle' },
    { id: 'Hill Country', name: 'Hill Country' },
    { id: 'Southern Coast', name: 'Beach Destinations' },
    { id: 'Wildlife', name: 'Wildlife & Nature' },
    { id: 'Northern', name: 'Northern Region' },
    { id: 'Customize', name: 'Customize' }
  ]

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
          setDestinations(json.data || [])
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

  const filteredDestinations = (destinations || []).filter(destination => {
    const regionMatch = selectedRegion === 'all' || destination.region === selectedRegion
    const searchMatch = destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (destination.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return regionMatch && searchMatch
  })

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Header – same as tours page */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 sm:py-16 md:py-20 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Explore Sri Lanka Destinations</h1>
            <p className="text-xl max-w-2xl mx-auto">Discover amazing places in Sri Lanka</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div style={{ background: 'white', borderColor: colors.primary[100] }} className="rounded-xl shadow-lg p-6 border mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: colors.primary[50], color: colors.text.base, borderColor: colors.primary[100] }}
              className="w-full pl-12 pr-4 py-4 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary[500] }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div style={{ background: 'white', borderColor: colors.primary[100] }} className="rounded-xl shadow-lg p-6 border">
              <div className="flex items-center mb-6">
                <Filter className="w-5 h-5 mr-2" style={{ color: colors.primary[500] }} />
                <h3 style={{ color: colors.text.base }} className="text-lg font-semibold">Filters</h3>
              </div>

              {/* Region Filter */}
              <div className="mb-6">
                <h4 style={{ color: colors.text.base }} className="font-medium mb-3">Region</h4>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <label key={region.id} className="flex items-center">
                      <input
                        type="radio"
                        name="region"
                        value={region.id}
                        checked={selectedRegion === region.id}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="mr-2"
                      />
                      <span style={{ color: colors.text.muted }} className="text-sm">{region.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Destinations Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ color: colors.text.base }} className="text-2xl font-bold">
                {loading ? 'Loading destinations...' : 
                 error ? 'Error loading destinations' :
                 `${filteredDestinations.length} Destinations Found`}
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading destinations...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Destinations Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDestinations.map((destination) => {
                const badge = destination.region === 'Cultural Triangle' ? 'Heritage' : 
                             destination.region === 'Wildlife' ? 'Nature' :
                             destination.region.includes('Province') ? 'Cultural' : 'Explore'
                const rating = 4.5 + (destination.id?.length ?? 0) % 5 * 0.1
                const reviews = 50 + (destination.id?.length ?? 0) % 200

                return (
                  <div key={destination.id} style={{ border: `1px solid ${colors.primary[100]}` }} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-[420px]">
                    <div className="relative shrink-0 h-44">
                      <Image
                        src={destination.image || '/placeholder-image.svg'}
                        alt={destination.name}
                        width={400}
                        height={176}
                        className="w-full h-full object-cover"
                        unoptimized={!!destination.image}
                      />
                      <div className="absolute top-3 left-3 bg-black text-[#ADFF29] px-3 py-1 rounded-full text-xs font-bold">
                        {badge}
                      </div>
                      <button style={{ background: colors.primary[50] }} className="absolute top-3 right-3 p-2.5 rounded-full shadow-md hover:bg-[#DBEAFE] active:bg-[#DBEAFE]/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation" aria-label="Save">
                        <Heart className="w-5 h-5" style={{ color: colors.primary[500] }} />
                      </button>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
                      <h3 style={{ color: colors.text.base }} className="text-lg font-semibold mb-2 line-clamp-2">{destination.name}</h3>
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 shrink-0" style={{ color: colors.secondary[400] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm ml-1">{rating.toFixed(1)} ({reviews})</span>
                      </div>
                      <p style={{ color: colors.text.muted }} className="text-sm line-clamp-[10] flex-1 min-h-0">
                        {destination.description || 'Explore this destination.'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: colors.primary[500] }}>… more</p>
                      <Link href={`/destinations/${destination.id}`} className="mt-3 shrink-0">
                        <button style={{ background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})` }} className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 active:opacity-80 transition-all flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation">
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredDestinations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">No destinations found matching your criteria.</div>
                <button 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedRegion('all')
                  }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 