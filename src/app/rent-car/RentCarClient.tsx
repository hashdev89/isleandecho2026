/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Filter,
  ArrowRight,
  Star,
  Fuel,
  Settings,
  Users,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import Header from '../../components/Header'
import SiteDatePicker from '../../components/SiteDatePicker'
import { formatRentalCurrency } from '@/lib/rentalPricing'
import type { Vehicle } from '@/lib/vehicleTypes'
import { useClickOutside } from '@/hooks/useClickOutside'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'

const CATEGORIES = [
  { id: 'all', name: 'All Vehicles' },
  { id: 'economy', name: 'Economy' },
  { id: 'compact', name: 'Compact' },
  { id: 'suv', name: 'SUV' },
  { id: 'luxury', name: 'Luxury' },
  { id: 'van', name: 'Van / Bus' },
]

export default function RentCarClient() {
  const { page } = useCmsPage('/rent-car')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [destinations, setDestinations] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [loading, setLoading] = useState(true)

  const [pickupCityId, setPickupCityId] = useState(searchParams.get('pickup') || '')
  const [dropoffCityId, setDropoffCityId] = useState(searchParams.get('dropoff') || '')
  const [pickupDate, setPickupDate] = useState(searchParams.get('pickupDate') || '')
  const [returnDate, setReturnDate] = useState(searchParams.get('returnDate') || '')
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false)
  const pickupDropdownRef = useRef<HTMLDivElement>(null)
  const dropoffDropdownRef = useRef<HTMLDivElement>(null)
  const closePickupDropdown = useCallback(() => setShowPickupDropdown(false), [])
  const closeDropoffDropdown = useCallback(() => setShowDropoffDropdown(false), [])
  useClickOutside(pickupDropdownRef, showPickupDropdown, closePickupDropdown)
  useClickOutside(dropoffDropdownRef, showDropoffDropdown, closeDropoffDropdown)

  useEffect(() => {
    setPickupCityId(searchParams.get('pickup') || '')
    setDropoffCityId(searchParams.get('dropoff') || '')
    setPickupDate(searchParams.get('pickupDate') || '')
    setReturnDate(searchParams.get('returnDate') || '')
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      try {
        const [vehiclesRes, destRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/destinations?includeTourCount=false'),
        ])
        const vehiclesJson = await vehiclesRes.json()
        const destJson = await destRes.json()
        if (vehiclesJson.success) setVehicles(vehiclesJson.data || [])
        if (destJson.success) setDestinations(destJson.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cityOptions = useMemo(
    () => destinations.filter((d) => d.status !== 'inactive'),
    [destinations]
  )

  const filteredVehicles = vehicles.filter((vehicle) => {
    const categoryMatch = selectedCategory === 'all' || vehicle.category === selectedCategory
    const priceMatch =
      vehicle.basePricePerDay >= priceRange[0] && vehicle.basePricePerDay <= priceRange[1]
    return categoryMatch && priceMatch
  })

  const buildVehicleUrl = (vehicleId: string) => {
    const params = new URLSearchParams()
    if (pickupCityId) params.set('pickup', pickupCityId)
    if (dropoffCityId) params.set('dropoff', dropoffCityId)
    if (pickupDate) params.set('pickupDate', pickupDate)
    if (returnDate) params.set('returnDate', returnDate)
    const query = params.toString()
    return `/rent-car/${vehicleId}${query ? `?${query}` : ''}`
  }

  const applySearch = () => {
    const params = new URLSearchParams()
    if (pickupCityId) params.set('pickup', pickupCityId)
    if (dropoffCityId) params.set('dropoff', dropoffCityId)
    if (pickupDate) params.set('pickupDate', pickupDate)
    if (returnDate) params.set('returnDate', returnDate)
    router.push(`/rent-car${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const pickupName = cityOptions.find((d) => d.id === pickupCityId)?.name
  const dropoffName = cityOptions.find((d) => d.id === dropoffCityId)?.name

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      
      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'Self-drive & chauffeur options',
          title: 'Rent a car in Sri Lanka',
          subtitle: 'Choose your route, see estimated kilometres, and book the right vehicle for your trip',
        }}
      />

      <div className="w-full max-w-[1920px] mx-auto lp-gutter py-8 sm:py-12">
        <div className="lp-panel p-4 sm:p-6 md:p-8 mb-8 overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 min-[1400px]:grid-cols-4 gap-3 sm:gap-5 md:gap-6 overflow-visible">
            <div className={`relative ${showPickupDropdown ? 'z-[100]' : 'z-10'}`} ref={pickupDropdownRef}>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Pickup City
              </label>
              <div className="relative overflow-visible">
                <button
                  type="button"
                  onClick={() => {
                    if (showPickupDropdown) {
                      setShowPickupDropdown(false)
                    } else {
                      setShowDropoffDropdown(false)
                      setShowPickupDropdown(true)
                    }
                  }}
                  aria-expanded={showPickupDropdown}
                  aria-haspopup="listbox"
                  className="w-full pl-4 pr-10 py-3 md:py-4 text-left border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px] flex items-center cursor-pointer hover:border-[var(--lagoon)] transition-colors"
                >
                  <span className="block truncate">
                    {(() => {
                      if (!pickupCityId) return 'Select pickup city'
                      const city = cityOptions.find((c) => c.id === pickupCityId)
                      if (!city) return 'Select pickup city'
                      return `${city.name}${city.region ? ` — ${city.region}` : ''}`
                    })()}
                  </span>
                </button>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 transition-transform ${showPickupDropdown ? 'rotate-180' : ''}`} />
                {showPickupDropdown && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white shadow-2xl py-1"
                  >
                    <li>
                      <button
                        type="button"
                        role="option"
                        aria-selected={!pickupCityId}
                        onClick={() => {
                          setPickupCityId('')
                          setShowPickupDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                      >
                        Select pickup city
                      </button>
                    </li>
                    {cityOptions.map((city) => {
                      const label = `${city.name}${city.region ? ` — ${city.region}` : ''}`
                      const isSelected = pickupCityId === city.id
                      return (
                        <li key={city.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            title={label}
                            onClick={() => {
                              setPickupCityId(city.id)
                              setShowPickupDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors break-words ${
                              isSelected
                                ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                : 'text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className={`relative ${showDropoffDropdown ? 'z-[100]' : 'z-10'}`} ref={dropoffDropdownRef}>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Drop-off City
              </label>
              <div className="relative overflow-visible">
                <button
                  type="button"
                  onClick={() => {
                    if (showDropoffDropdown) {
                      setShowDropoffDropdown(false)
                    } else {
                      setShowPickupDropdown(false)
                      setShowDropoffDropdown(true)
                    }
                  }}
                  aria-expanded={showDropoffDropdown}
                  aria-haspopup="listbox"
                  className="w-full pl-4 pr-10 py-3 md:py-4 text-left border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px] flex items-center cursor-pointer hover:border-[var(--lagoon)] transition-colors"
                >
                  <span className="block truncate">
                    {(() => {
                      if (!dropoffCityId) return 'Select drop-off city'
                      const city = cityOptions.find((c) => c.id === dropoffCityId)
                      if (!city) return 'Select drop-off city'
                      return `${city.name}${city.region ? ` — ${city.region}` : ''}`
                    })()}
                  </span>
                </button>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 transition-transform ${showDropoffDropdown ? 'rotate-180' : ''}`} />
                {showDropoffDropdown && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white shadow-2xl py-1"
                  >
                    <li>
                      <button
                        type="button"
                        role="option"
                        aria-selected={!dropoffCityId}
                        onClick={() => {
                          setDropoffCityId('')
                          setShowDropoffDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                      >
                        Select drop-off city
                      </button>
                    </li>
                    {cityOptions.map((city) => {
                      const label = `${city.name}${city.region ? ` — ${city.region}` : ''}`
                      const isSelected = dropoffCityId === city.id
                      return (
                        <li key={city.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            title={label}
                            onClick={() => {
                              setDropoffCityId(city.id)
                              setShowDropoffDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors break-words ${
                              isSelected
                                ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                : 'text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                            }`}
                          >
                            {label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Pickup Date
              </label>
              <SiteDatePicker
                value={pickupDate}
                placeholder="Select pickup date"
                onChange={setPickupDate}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Return Date
              </label>
              <SiteDatePicker
                value={returnDate}
                placeholder="Select return date"
                minDate={pickupDate}
                onChange={setReturnDate}
              />
            </div>
          </div>
          {(pickupName || dropoffName) && (
            <p className="mt-4 text-sm text-[var(--ink-soft)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--lagoon)] shrink-0" />
              {pickupName && dropoffName
                ? `Route: ${pickupName} → ${dropoffName} (distance shown on vehicle page)`
                : 'Select both cities to calculate route distance'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 min-[1180px]:grid-cols-4 gap-6 sm:gap-8">
          <div className="min-[1180px]:col-span-1">
            <div className="lp-panel p-6">
              <div className="flex items-center mb-6">
                <Filter className="w-5 h-5 mr-2 text-[var(--lagoon)]" />
                <h3 className="text-lg font-semibold text-[var(--ink)]">Filters</h3>
              </div>
              <div className="mb-6">
                <h4 className="font-medium mb-3 text-[var(--ink)]">Vehicle type</h4>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2 w-4 h-4 accent-[var(--lagoon)]"
                      />
                      <span className="text-sm text-[var(--ink-soft)]">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-[var(--ink)]">Price per day (LKR)</h4>
                  <input
                    type="range"
                    min="0"
                  max="50000"
                  step="500"
                    value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                  className="w-full h-2 accent-[var(--lagoon)]"
                />
                <div className="flex justify-between text-sm text-[var(--ink-soft)] mt-2">
                  <span>{formatRentalCurrency(priceRange[0])}</span>
                  <span>{formatRentalCurrency(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-[1180px]:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="lp-section-title text-2xl sm:text-3xl">
                {loading ? 'Loading…' : `${filteredVehicles.length} vehicles available`}
              </h2>
              <button
                type="button"
                onClick={applySearch}
                className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] text-white px-6 py-3 rounded-full font-semibold transition-colors min-h-[44px]"
              >
                Update search
              </button>
            </div>

            <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1400px]:grid-cols-3 gap-5">
              {filteredVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => router.push(buildVehicleUrl(vehicle.id))}
                  className="lp-photo-card group text-left h-[420px] cursor-pointer"
                >
                    <Image
                    src={vehicle.images?.[0] || '/placeholder-image.svg'}
                    alt={vehicle.name}
                      width={400}
                    height={240}
                      className="w-full h-48 object-cover"
                    unoptimized={!!vehicle.images?.[0]?.startsWith('/uploads')}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-[var(--ink)] group-hover:text-[var(--lagoon)] transition-colors">
                        {vehicle.name}
                      </h3>
                      {vehicle.badge && (
                        <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-[var(--sun)] text-[var(--lagoon-deep)]">
                          {vehicle.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-amber-400 fill-current" />
                      <span className="text-sm text-[var(--ink-soft)]">
                        {vehicle.rating || 0} ({vehicle.reviews || 0})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--ink-soft)] mb-4">
                      <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" />{vehicle.fuelType}</span>
                      <span className="flex items-center gap-1"><Settings className="w-3.5 h-3.5" />{vehicle.transmission}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{vehicle.seats} seats</span>
                      <span>{vehicle.includedKmPerDay} km/day incl.</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-[var(--lagoon-deep)]">
                        {formatRentalCurrency(vehicle.basePricePerDay)}<span className="text-sm font-normal text-[var(--ink-soft)]">/day</span>
                        </span>
                      <ArrowRight className="w-5 h-5 text-[var(--lagoon)] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!loading && filteredVehicles.length === 0 && (
              <div className="text-center py-16 text-[var(--ink-soft)]">
                No vehicles match your filters. Try adjusting price or category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
