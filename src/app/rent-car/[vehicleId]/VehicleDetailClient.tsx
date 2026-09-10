/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Star,
  Fuel,
  Settings,
  Users,
  CheckCircle,
  Calendar,
  Car,
  Luggage,
  DoorOpen,
  Snowflake,
  Info,
  FileText,
} from 'lucide-react'
import Header from '../../../components/Header'
import SiteDatePicker from '../../../components/SiteDatePicker'
import SriLankaCitySelect from '../../../components/SriLankaCitySelect'
import { formatDistanceKm, getRouteSegments, getTotalRouteKm } from '@/lib/geoDistance'
import { formatRentalCurrency } from '@/lib/rentalPricing'
import { getVehiclePrimaryImage, type RentalQuote, type Vehicle } from '@/lib/vehicleTypes'
import {
  RENTAL_WITH_DRIVER_NOTICE,
  findRentalLocation,
  rentalDaysBetween,
  type RentalTripType,
} from '@/lib/rentalLocations'

const MapboxMap = dynamic(() => import('../../../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[var(--foam)] rounded-2xl flex items-center justify-center border border-black/5">
      <p className="text-[var(--ink-soft)]">Loading map...</p>
    </div>
  ),
})

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function VehicleDetailClient({ params }: { params: Promise<{ vehicleId: string }> }) {
  const searchParams = useSearchParams()
  const [vehicleId, setVehicleId] = useState('')
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [quote, setQuote] = useState<(RentalQuote & { availableCharges?: any[] }) | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([])

  const [tripType, setTripType] = useState<RentalTripType>(
    searchParams.get('type') === 'dropoff' ? 'dropoff' : 'multi_day'
  )
  const [pickupLocationId, setPickupLocationId] = useState(searchParams.get('pickup') || '')
  const [dropoffLocationId, setDropoffLocationId] = useState(searchParams.get('dropoff') || '')
  const [startDate, setStartDate] = useState(searchParams.get('pickupDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('returnDate') || '')
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '09:00')
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '18:00')
  const [name, setName] = useState(searchParams.get('name') || '')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  useEffect(() => {
    params.then((p) => setVehicleId(p.vehicleId))
  }, [params])

  useEffect(() => {
    setTripType(searchParams.get('type') === 'dropoff' ? 'dropoff' : 'multi_day')
    setPickupLocationId(searchParams.get('pickup') || '')
    setDropoffLocationId(searchParams.get('dropoff') || '')
    setStartDate(searchParams.get('pickupDate') || '')
    setEndDate(searchParams.get('returnDate') || '')
    setStartTime(searchParams.get('startTime') || '09:00')
    setEndTime(searchParams.get('endTime') || '18:00')
    setName(searchParams.get('name') || '')
  }, [searchParams])

  useEffect(() => {
    if (!vehicleId) return
    const load = async () => {
      try {
        const [vehiclesRes, settingsRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/rental-settings'),
        ])
        const vehiclesJson = await vehiclesRes.json()
        const settingsJson = await settingsRes.json()
        if (vehiclesJson.success) {
          setVehicle((vehiclesJson.data || []).find((v: Vehicle) => v.id === vehicleId) || null)
        }
        if (settingsJson.success && settingsJson.data?.currency) {
          setCurrency(settingsJson.data.currency)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [vehicleId])

  const lockedDays = useMemo(() => rentalDaysBetween(startDate, endDate), [startDate, endDate])
  const pickup = findRentalLocation(pickupLocationId)
  const dropoff = findRentalLocation(dropoffLocationId)

  const routeDestinations = useMemo(() => {
    if (!pickup) return []
    if (tripType === 'dropoff') {
      if (!dropoff) return [{ name: pickup.name, lat: pickup.lat, lng: pickup.lng, region: pickup.region }]
    return [
      { name: pickup.name, lat: pickup.lat, lng: pickup.lng, region: pickup.region },
        {
          name: dropoff.name,
          lat: dropoff.lat,
          lng: dropoff.lng,
          region: dropoff.region,
        },
      ]
    }
    return [{ name: pickup.name, lat: pickup.lat, lng: pickup.lng, region: pickup.region }]
  }, [pickup, dropoff, tripType])

  const routeSegments = useMemo(() => getRouteSegments(routeDestinations), [routeDestinations])
  const totalRouteKm = useMemo(() => getTotalRouteKm(routeDestinations), [routeDestinations])

  const fetchQuote = async (chargeIds = selectedChargeIds) => {
    if (!vehicle || !pickupLocationId || !startDate) {
      setQuote(null)
      return
    }
    if (tripType === 'multi_day' && !endDate) {
      setQuote(null)
      return
    }
    if (tripType === 'dropoff' && !dropoffLocationId) {
      setQuote(null)
      return
    }

    setQuoteLoading(true)
    try {
      const res = await fetch('/api/rentals/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          mode: tripType,
          pickupLocationId,
          dropoffLocationId: tripType === 'dropoff' ? dropoffLocationId : undefined,
          pickupDate: startDate,
          returnDate: tripType === 'multi_day' ? endDate : startDate,
          selectedChargeIds: chargeIds,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setQuote(json.data)
        if (json.data.currency) setCurrency(json.data.currency)
      }
    } catch (error) {
      console.error('Quote error:', error)
    } finally {
      setQuoteLoading(false)
    }
  }

  useEffect(() => {
      void fetchQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, tripType, pickupLocationId, dropoffLocationId, startDate, endDate])

  const toggleCharge = (chargeId: string) => {
    const next = selectedChargeIds.includes(chargeId)
      ? selectedChargeIds.filter((id) => id !== chargeId)
      : [...selectedChargeIds, chargeId]
    setSelectedChargeIds(next)
    void fetchQuote(next)
  }

  const submitRequest = async (asQuotation: boolean) => {
    if (!vehicle) return
    if (!name || !email || !phone) {
      alert('Please fill in your name, email, and phone number')
      return
    }
    if (!pickupLocationId || !startDate) {
      alert('Please select pickup location and start date')
      return
    }
    if (tripType === 'multi_day' && !endDate) {
      alert('Please select an end date')
      return
    }
    if (tripType === 'dropoff' && !dropoffLocationId) {
      alert('Please select a drop-off city')
      return
    }
    if (!asQuotation && (!quote || !quote.priceAvailable)) {
      alert('A fixed price is not available yet. Please use Request Quotation.')
      return
    }

    const pickupLoc = findRentalLocation(pickupLocationId)
    const dropoffLoc = findRentalLocation(dropoffLocationId)
    const dropName =
      tripType === 'dropoff' ? dropoffLoc?.name || '' : pickupLoc?.name || ''

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'vehicle_rental',
          vehicle_id: vehicle.id,
          vehicle_name: vehicle.name,
          tour_id: vehicle.id,
          tour_name: `Car rental (${tripType === 'dropoff' ? 'Drop off' : 'Multi-day'}): ${vehicle.name}`,
          tour_package_id: vehicle.id,
          tour_package_name: `Car rental: ${vehicle.name}`,
          rental_trip_type: tripType,
          with_driver: true,
          pickup_city_id: pickupLocationId,
          pickup_city_name: pickupLoc?.name || '',
          dropoff_city_id: tripType === 'dropoff' ? dropoffLocationId : pickupLocationId,
          dropoff_city_name: dropName,
          dropoff_lat: tripType === 'dropoff' ? dropoffLoc?.lat : pickupLoc?.lat,
          dropoff_lng: tripType === 'dropoff' ? dropoffLoc?.lng : pickupLoc?.lng,
          start_time: startTime,
          end_time: tripType === 'multi_day' ? endTime : startTime,
          route_km: quote?.routeKm || totalRouteKm,
          base_rent: quote?.baseRent || 0,
          extra_km_charge: quote?.extraKmCharge || 0,
          one_way_fee: quote?.oneWayFee || 0,
          dropoff_distance_charge: quote?.dropoffDistanceCharge || 0,
          additional_charges: quote?.additionalCharges || [],
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          start_date: startDate,
          end_date: tripType === 'multi_day' ? endDate : startDate,
          guests: 1,
          total_price: asQuotation && !quote?.priceAvailable ? 0 : quote?.totalPrice || 0,
          currency: quote?.currency || currency,
          special_requests: [
            asQuotation ? '[Request Quotation]' : '',
            `Trip: ${tripType === 'dropoff' ? 'Drop off (with driver)' : 'Multi-day Tour (with driver)'}`,
            `Start ${startDate} ${startTime}`,
            tripType === 'multi_day' ? `End ${endDate} ${endTime} (${lockedDays} days)` : '',
            specialRequests,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'pending',
          payment_status: asQuotation || !quote?.priceAvailable ? 'pending' : 'pending',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Request failed')

      if (asQuotation || !quote?.priceAvailable) {
        alert('Your quotation request was sent. Our team will confirm the price shortly.')
        window.location.href = '/rent-car'
        return
      }
      window.location.href = `/payments/checkout?booking_id=${json.data.id}`
    } catch (error: any) {
      alert(error.message || 'Could not complete request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto lp-gutter py-20 text-center text-[var(--ink-soft)]">
          Loading vehicle…
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto lp-gutter py-20 text-center">
          <h1 className="lp-section-title text-3xl mb-4">Vehicle not found</h1>
          <Link href="/rent-car" className="text-[var(--lagoon)] font-semibold hover:underline">
            Browse all vehicles
          </Link>
        </div>
      </div>
    )
  }

  const passengers = vehicle.passengers ?? vehicle.seats
  const automatic = vehicle.automatic ?? /auto/i.test(vehicle.transmission || '')
  const hasAc =
    vehicle.airConditioning ??
    vehicle.features?.some((f) => /air.?cond|a\/c|\bac\b/i.test(f)) ??
    true

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />

      <section className="relative py-16 sm:py-20 md:py-24 bg-[var(--lagoon-deep)] text-white">
        <div className="max-w-[1920px] mx-auto lp-gutter">
          <p className="lp-kicker mb-3" style={{ ['--lp-kicker-color' as string]: '#d4f06a' }}>
            Rent a car · With driver
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">{vehicle.name}</h1>
          <p className="text-white/80 mb-4 capitalize">{vehicle.category} car (with driver)</p>
          <div className="flex flex-wrap gap-4 text-white/90">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {passengers} passengers
            </span>
            <span className="flex items-center gap-2">
              <Luggage className="w-4 h-4" />
              {vehicle.luggage ?? '—'} luggage
            </span>
            <span className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4" />
              {vehicle.doors ?? '—'} doors
            </span>
            <span className="flex items-center gap-2">
              <Snowflake className="w-4 h-4" />
              {hasAc ? 'Air conditioning' : 'No A/C'}
            </span>
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {automatic ? 'Automatic' : vehicle.transmission}
            </span>
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-300 fill-current" />
              {vehicle.rating} ({vehicle.reviews})
            </span>
            {tripType === 'multi_day' ? (
              <span className="font-semibold text-[var(--sun)]">
                {formatRentalCurrency(vehicle.basePricePerDay, currency)}/day
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="max-w-[1920px] mx-auto lp-gutter py-10">
        <div className="mb-6 rounded-xl border border-[var(--lagoon)]/25 bg-[var(--lagoon)]/10 px-4 py-3 text-sm text-[var(--lagoon-deep)] flex gap-2 items-start">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{RENTAL_WITH_DRIVER_NOTICE}</p>
        </div>

        <div className="grid grid-cols-1 min-[1180px]:grid-cols-3 gap-8 min-[1180px]:gap-12">
          <div className="min-[1180px]:col-span-2 space-y-8">
            <div className="rounded-2xl overflow-hidden border border-black/5">
              <Image
                src={vehicle.images?.[selectedImage] || getVehiclePrimaryImage(vehicle)}
                alt={vehicle.name}
                width={900}
                height={500}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
                unoptimized
              />
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                  {vehicle.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 rounded-lg overflow-hidden border-2 ${
                        selectedImage === i ? 'border-[var(--lagoon)]' : 'border-transparent'
                      }`}
                    >
                      <Image src={img} alt="" width={80} height={56} className="w-20 h-14 object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {vehicle.description && (
              <div>
                <h2 className="lp-section-title text-2xl mb-4">About this vehicle</h2>
                <p className="text-[var(--ink-soft)] leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            <div>
              <h2 className="lp-section-title text-2xl mb-4">Features & specs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="lp-panel p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{passengers} passengers</span>
                </div>
                <div className="lp-panel p-4 text-center">
                  <Luggage className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{vehicle.luggage ?? '—'} luggage</span>
                </div>
                <div className="lp-panel p-4 text-center">
                  <DoorOpen className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{vehicle.doors ?? '—'} doors</span>
                </div>
                <div className="lp-panel p-4 text-center">
                  <Snowflake className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{hasAc ? 'Air conditioning' : 'No A/C'}</span>
                </div>
                <div className="lp-panel p-4 text-center">
                  <Settings className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{automatic ? 'Automatic' : vehicle.transmission}</span>
                </div>
                <div className="lp-panel p-4 text-center">
                  <Fuel className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" />
                  <span className="text-sm">{vehicle.fuelType}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {(vehicle.features || []).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[var(--ink-soft)]">
                    <CheckCircle className="w-5 h-5 text-[var(--lagoon)] shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-[var(--ink-soft)]">
                  <CheckCircle className="w-5 h-5 text-[var(--lagoon)] shrink-0 mt-0.5" />
                  Professional driver included
                </li>
              </ul>
            </div>

            <div>
              <h2 className="lp-section-title text-2xl mb-4">Your route</h2>
              {routeDestinations.length >= 2 && (
                <>
                  <MapboxMap destinations={routeDestinations} tourName={`${vehicle.name} route`} />
                  <div className="mt-4 lp-panel p-4">
                    <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--lagoon)]" />
                      Trip route distances
                    </h3>
                    <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                      {routeSegments.map((seg, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span>
                            {seg.from.name} → {seg.to.name}
                          </span>
                          <span className="font-medium text-[var(--ink)]">
                            {formatDistanceKm(seg.distanceKm)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 pt-3 border-t border-black/10 font-semibold text-[var(--lagoon-deep)]">
                      Total distance: {formatDistanceKm(quote?.routeKm || totalRouteKm)} (approx.)
                    </p>
                  </div>
                </>
              )}
              {tripType === 'dropoff' && !dropoff && (
                <p className="text-sm text-[var(--ink-soft)]">
                  Select a drop-off city to see distance and pricing.
                </p>
              )}
            </div>
          </div>

          <div className="min-[1180px]:sticky min-[1180px]:top-6 min-[1180px]:h-fit space-y-6">
            <div className="lp-panel overflow-hidden">
              <div className="relative h-44 sm:h-48 w-full bg-[var(--foam)]">
                <Image
                  src={getVehiclePrimaryImage(vehicle)}
                  alt={vehicle.name}
                  width={640}
                  height={400}
                  className="block h-full w-full object-cover"
                  unoptimized={getVehiclePrimaryImage(vehicle).startsWith('/uploads')}
                />
              </div>
              <div className="p-6">
              <h3 className="text-xl font-bold text-[var(--ink)] mb-2">
                {tripType === 'dropoff' ? 'Drop off (with driver)' : 'Multi-day Tour (with driver)'}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] mb-4 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" /> Chauffeur included
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripType('multi_day')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                      tripType === 'multi_day'
                        ? 'bg-[var(--lagoon-deep)] text-white border-[var(--lagoon-deep)]'
                        : 'bg-white text-[var(--ink)] border-black/10'
                    }`}
                  >
                    Multi-day
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('dropoff')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border ${
                      tripType === 'dropoff'
                        ? 'bg-[var(--lagoon-deep)] text-white border-[var(--lagoon-deep)]'
                        : 'bg-white text-[var(--ink)] border-black/10'
                    }`}
                  >
                    Drop off
                  </button>
                </div>

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

                <SiteDatePicker
                  label="Start date"
                  value={startDate}
                  placeholder="Select start date"
                  onChange={setStartDate}
                />

                <div>
                  <label className="block text-sm font-semibold mb-2">Start time</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
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
                      <label className="block text-sm font-semibold mb-2">No. of days</label>
                      <input
                        readOnly
                        value={
                          lockedDays
                            ? `${lockedDays} day${lockedDays === 1 ? '' : 's'}`
                            : 'Set start & end dates'
                        }
                        className="w-full px-4 py-3 border border-black/10 rounded-xl bg-gray-100 text-[var(--ink-soft)] cursor-not-allowed"
                      />
                    </div>
                    <SiteDatePicker
                      label="End date"
                      value={endDate}
                      placeholder="Select end date"
                      minDate={startDate}
                      onChange={setEndDate}
                    />
                    <div>
                      <label className="block text-sm font-semibold mb-2">End time</label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
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

                <div>
                  <label className="block text-sm font-semibold mb-2">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Special requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]"
                  />
                </div>

                {tripType === 'multi_day' && quote?.availableCharges && quote.availableCharges.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Optional extras</label>
                    <div className="space-y-2">
                      {quote.availableCharges.map((charge: any) => (
                        <label key={charge.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedChargeIds.includes(charge.id)}
                            onChange={() => toggleCharge(charge.id)}
                            className="accent-[var(--lagoon)]"
                          />
                          <span>{charge.label}</span>
                          <span className="ml-auto text-[var(--ink-soft)]">
                            {formatRentalCurrency(charge.amount, currency)}
                            {charge.type === 'per_day' ? '/day' : charge.type === 'per_km' ? '/km' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {quoteLoading && <p className="text-sm text-[var(--ink-soft)]">Calculating price…</p>}

                {tripType === 'dropoff' && (
                  <div className="rounded-xl bg-[var(--foam)] border border-black/10 p-4 text-sm text-[var(--ink-soft)]">
                    Drop-off totals depend on destination. When distance is known we use{' '}
                    <strong>Total = Distance (km) × Unit rate/km</strong>. You can also request a quotation.
                  </div>
                )}

                {quote && !quoteLoading && quote.priceAvailable && (
                  <div className="rounded-xl bg-[var(--foam)] border border-black/10 p-4 space-y-2">
                    <h4 className="font-semibold text-[var(--ink)]">
                      {tripType === 'dropoff' ? 'Drop-off price' : 'Price estimate'}
                    </h4>
                    {quote.breakdown.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm gap-3">
                        <span className="text-[var(--ink-soft)]">{line.label}</span>
                        <span>{formatRentalCurrency(line.amount, quote.currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-black/10 text-[var(--lagoon-deep)]">
                      <span>Total</span>
                      <span>{formatRentalCurrency(quote.totalPrice, quote.currency)}</span>
                    </div>
                  </div>
                )}

                {tripType === 'dropoff' && quote && !quote.priceAvailable && !quoteLoading && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Automatic pricing is unavailable for this route. Please request a quotation.
                  </div>
                )}

                {tripType === 'multi_day' && quote?.priceAvailable ? (
                  <button
                    type="button"
                    onClick={() => void submitRequest(false)}
                    disabled={!quote || quoteLoading || submitting}
                    className="w-full bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] disabled:opacity-50 text-white py-4 rounded-full font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    {submitting ? 'Submitting…' : 'Reserve vehicle'}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => void submitRequest(true)}
                  disabled={submitting || quoteLoading}
                  className="w-full border-2 border-[var(--lagoon-deep)] text-[var(--lagoon-deep)] hover:bg-[var(--lagoon-deep)] hover:text-white disabled:opacity-50 py-4 rounded-full font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {submitting ? 'Sending…' : 'Request Quotation'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
