/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Luggage,
  DoorOpen,
  Snowflake,
  Info,
} from 'lucide-react'
import Header from '../../components/Header'
import SiteDatePicker from '../../components/SiteDatePicker'
import SriLankaCitySelect from '../../components/SriLankaCitySelect'
import { formatRentalCurrency } from '@/lib/rentalPricing'
import { getVehiclePrimaryImage, type Vehicle } from '@/lib/vehicleTypes'
import {
  findRentalLocation,
  RENTAL_TRIP_TYPES,
  RENTAL_WITH_DRIVER_NOTICE,
  rentalDaysBetween,
  type RentalTripType,
} from '@/lib/rentalLocations'
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

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function RentCarClient() {
  const { page } = useCmsPage('/rent-car')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [currency, setCurrency] = useState('USD')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [loading, setLoading] = useState(true)

  const [tripType, setTripType] = useState<RentalTripType>(
    (searchParams.get('type') as RentalTripType) === 'dropoff' ? 'dropoff' : 'multi_day'
  )
  const [pickupLocationId, setPickupLocationId] = useState(searchParams.get('pickup') || '')
  const [dropoffLocationId, setDropoffLocationId] = useState(searchParams.get('dropoff') || '')
  const [startDate, setStartDate] = useState(searchParams.get('pickupDate') || searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('returnDate') || searchParams.get('endDate') || '')
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '09:00')
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '18:00')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'dropoff' || type === 'multi_day') setTripType(type)
    setPickupLocationId(searchParams.get('pickup') || '')
    setDropoffLocationId(searchParams.get('dropoff') || '')
    setStartDate(searchParams.get('pickupDate') || searchParams.get('startDate') || '')
    setEndDate(searchParams.get('returnDate') || searchParams.get('endDate') || '')
    setStartTime(searchParams.get('startTime') || '09:00')
    setEndTime(searchParams.get('endTime') || '18:00')
  }, [searchParams])

  useEffect(() => {
    const load = async () => {
      try {
        const [vehiclesRes, settingsRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/rental-settings'),
        ])
        const vehiclesJson = await vehiclesRes.json()
        const settingsJson = await settingsRes.json()
        if (vehiclesJson.success) setVehicles(vehiclesJson.data || [])
        if (settingsJson.success && settingsJson.data?.currency) {
          setCurrency(settingsJson.data.currency)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const lockedDays = useMemo(
    () => (tripType === 'multi_day' ? rentalDaysBetween(startDate, endDate) : 0),
    [tripType, startDate, endDate]
  )

  const filteredVehicles = vehicles.filter((vehicle) => {
    const categoryMatch = selectedCategory === 'all' || vehicle.category === selectedCategory
    const priceMatch =
      vehicle.basePricePerDay >= priceRange[0] && vehicle.basePricePerDay <= priceRange[1]
    return categoryMatch && priceMatch
  })

  const buildQuery = (vehicleId?: string) => {
    const params = new URLSearchParams()
    params.set('type', tripType)
    if (pickupLocationId) params.set('pickup', pickupLocationId)
    if (startDate) params.set('pickupDate', startDate)
    if (startTime) params.set('startTime', startTime)
    if (tripType === 'multi_day') {
      if (endDate) params.set('returnDate', endDate)
      if (endTime) params.set('endTime', endTime)
      if (lockedDays) params.set('days', String(lockedDays))
    } else if (dropoffLocationId) {
      params.set('dropoff', dropoffLocationId)
    }
    const query = params.toString()
    if (vehicleId) return `/rent-car/${vehicleId}${query ? `?${query}` : ''}`
    return `/rent-car${query ? `?${query}` : ''}`
  }

  const applySearch = () => {
    router.push(buildQuery())
  }

  const pickupName = findRentalLocation(pickupLocationId)?.name
  const dropoffName = findRentalLocation(dropoffLocationId)?.name

  const vehiclePassengers = (v: Vehicle) => v.passengers ?? v.seats
  const isAutomatic = (v: Vehicle) =>
    v.automatic ?? /auto/i.test(v.transmission || '')
  const hasAc = (v: Vehicle) =>
    v.airConditioning ??
    v.features?.some((f) => /air.?cond|a\/c|ac\b/i.test(f)) ??
    true

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />

      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'With driver only',
          title: 'Rent a car in Sri Lanka',
          subtitle:
            'Choose a multi-day chauffeur tour or a one-way drop-off transfer — all vehicles include a professional driver.',
        }}
      />

      <div className="w-full max-w-[1920px] mx-auto lp-gutter py-8 sm:py-12">
        <div className="mb-4 rounded-xl border border-[var(--lagoon)]/25 bg-[var(--lagoon)]/10 px-4 py-3 text-sm text-[var(--lagoon-deep)] flex gap-2 items-start">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>With driver only.</strong> {RENTAL_WITH_DRIVER_NOTICE}
          </p>
        </div>

        <div className="lp-panel p-4 sm:p-6 md:p-8 mb-8 overflow-visible">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lagoon-deep)] mb-3">
            Select trip type
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {RENTAL_TRIP_TYPES.map((option) => {
              const active = tripType === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTripType(option.id)}
                  className={`text-left rounded-2xl border px-4 py-4 transition-colors ${
                    active
                      ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon-deep)] text-white'
                      : 'border-black/10 bg-[var(--foam)] text-[var(--ink)] hover:border-[var(--lagoon)]'
                  }`}
                >
                  <span className="block font-semibold">{option.title}</span>
                  <span className={`block text-sm mt-1 ${active ? 'text-white/80' : 'text-[var(--ink-soft)]'}`}>
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 min-[1200px]:grid-cols-3 gap-3 sm:gap-5 overflow-visible">
            <SriLankaCitySelect
              label="Pick up city"
              valueId={pickupLocationId}
              placeholder="Select pickup city"
              onChange={(city) => setPickupLocationId(city?.id || '')}
            />

            {tripType === 'dropoff' ? (
              <SriLankaCitySelect
                label="Drop off city"
                valueId={dropoffLocationId}
                placeholder="Select drop-off city"
                onChange={(city) => setDropoffLocationId(city?.id || '')}
              />
            ) : null}

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Start date
              </label>
              <SiteDatePicker value={startDate} placeholder="Select start date" onChange={setStartDate} />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                Start time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 md:py-4 border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px]"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {tripType === 'multi_day' ? (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                    No. of days
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={lockedDays ? `${lockedDays} day${lockedDays === 1 ? '' : 's'}` : 'Set start & end dates'}
                    className="w-full px-4 py-3 md:py-4 border border-black/10 rounded-xl bg-gray-100 text-[var(--ink-soft)] min-h-[44px] md:min-h-[52px] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                    End date
                  </label>
                  <SiteDatePicker
                    value={endDate}
                    placeholder="Select end date"
                    minDate={startDate}
                    onChange={setEndDate}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] tracking-wide uppercase">
                    End time
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 md:py-4 border border-black/10 rounded-xl bg-[var(--foam)] text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] min-h-[44px] md:min-h-[52px]"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <p className="text-sm text-[var(--ink-soft)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--lagoon)] shrink-0" />
              {tripType === 'dropoff'
                ? pickupName && dropoffName
                  ? `Drop-off: ${pickupName} → ${dropoffName}`
                  : 'Select pickup and drop-off cities to continue'
                : pickupName && startDate && endDate
                  ? `Multi-day tour from ${pickupName} · ${lockedDays} day${lockedDays === 1 ? '' : 's'}`
                  : 'Select pickup city, start and end dates'}
            </p>
            <button
              type="button"
              onClick={applySearch}
              className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] text-white px-6 py-3 rounded-full font-semibold transition-colors min-h-[44px]"
            >
              Update search
            </button>
          </div>
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
                <h4 className="font-medium mb-3 text-[var(--ink)]">Price per day ({currency})</h4>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                  className="w-full h-2 accent-[var(--lagoon)]"
                />
                <div className="flex justify-between text-sm text-[var(--ink-soft)] mt-2">
                  <span>{formatRentalCurrency(priceRange[0], currency)}</span>
                  <span>{formatRentalCurrency(priceRange[1], currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-[1180px]:col-span-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="lp-section-title text-2xl sm:text-3xl">
                {loading ? 'Loading…' : `${filteredVehicles.length} vehicles available`}
              </h2>
              <p className="text-sm text-[var(--ink-soft)]">All options include a professional driver</p>
            </div>

            <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1400px]:grid-cols-3 gap-5 items-stretch">
              {filteredVehicles.map((vehicle) => {
                const imageSrc = getVehiclePrimaryImage(vehicle)
                return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => router.push(buildQuery(vehicle.id))}
                  className="lp-panel group w-full min-w-0 text-left cursor-pointer overflow-hidden flex flex-col transition-shadow hover:shadow-[0_16px_40px_rgba(11,61,74,0.12)]"
                >
                  <div className="relative w-full h-52 sm:h-56 shrink-0 overflow-hidden bg-[var(--foam)]">
                    <Image
                      src={imageSrc}
                      alt={vehicle.name}
                      width={800}
                      height={520}
                      className="block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      unoptimized={imageSrc.startsWith('/uploads')}
                    />
                    {vehicle.badge && (
                      <span className="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--sun)] text-[var(--lagoon-deep)] shadow-sm">
                        {vehicle.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 gap-3 p-4 sm:p-5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg leading-snug text-[var(--ink)] group-hover:text-[var(--lagoon)] transition-colors line-clamp-2">
                          {vehicle.name}
                        </h3>
                        <div className="shrink-0 flex items-center gap-1 text-sm text-[var(--ink-soft)]">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span>{vehicle.rating || 0}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--lagoon-deep)]">
                        {vehicle.category} · with driver
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-soft)]">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {vehiclePassengers(vehicle)} seats
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <Luggage className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {vehicle.luggage ?? '—'} bags
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {vehicle.doors ?? '—'} doors
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <Snowflake className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {hasAc(vehicle) ? 'A/C' : 'No A/C'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <Settings className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {isAutomatic(vehicle) ? 'Auto' : vehicle.transmission || 'Manual'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foam)] px-2.5 py-1.5">
                        <Fuel className="w-3.5 h-3.5 text-[var(--lagoon)]" />
                        {vehicle.fuelType}
                      </span>
                    </div>

                    <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between gap-3">
                      <div>
                        {tripType === 'dropoff' ? (
                          <p className="text-sm font-semibold text-[var(--lagoon-deep)]">Quote by km</p>
                        ) : (
                          <p className="text-xl font-bold text-[var(--lagoon-deep)] leading-none">
                            {formatRentalCurrency(vehicle.basePricePerDay, currency)}
                            <span className="ml-1 text-sm font-normal text-[var(--ink-soft)]">/day</span>
                          </p>
                        )}
                        <p className="mt-1 text-xs text-[var(--ink-soft)]">Chauffeur included</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--lagoon)]">
                        View
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </button>
              )})}
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
