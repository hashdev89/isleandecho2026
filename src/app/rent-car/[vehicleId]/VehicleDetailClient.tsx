/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Navigation,
  Calendar,
  Car,
  ChevronDown,
} from 'lucide-react'
import Header from '../../../components/Header'
import SiteDatePicker from '../../../components/SiteDatePicker'
import { formatDistanceKm, getRouteSegments, getTotalRouteKm } from '@/lib/geoDistance'
import { formatRentalCurrency } from '@/lib/rentalPricing'
import type { RentalQuote, Vehicle } from '@/lib/vehicleTypes'
import { useClickOutside } from '@/hooks/useClickOutside'

const MapboxMap = dynamic(() => import('../../../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[var(--foam)] rounded-2xl flex items-center justify-center border border-black/5">
      <p className="text-[var(--ink-soft)]">Loading map...</p>
    </div>
  ),
})

export default function VehicleDetailClient({ params }: { params: Promise<{ vehicleId: string }> }) {
  const searchParams = useSearchParams()
  const [vehicleId, setVehicleId] = useState('')
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [destinations, setDestinations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quote, setQuote] = useState<(RentalQuote & { availableCharges?: any[] }) | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedChargeIds, setSelectedChargeIds] = useState<string[]>([])

  const [rentalData, setRentalData] = useState({
    pickupCityId: searchParams.get('pickup') || '',
    dropoffCityId: searchParams.get('dropoff') || '',
    pickupDate: searchParams.get('pickupDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    name: searchParams.get('name') || '',
    email: '',
    phone: '',
    specialRequests: '',
  })
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false)
  const pickupDropdownRef = useRef<HTMLDivElement>(null)
  const dropoffDropdownRef = useRef<HTMLDivElement>(null)
  const closePickupDropdown = useCallback(() => setShowPickupDropdown(false), [])
  const closeDropoffDropdown = useCallback(() => setShowDropoffDropdown(false), [])
  useClickOutside(pickupDropdownRef, showPickupDropdown, closePickupDropdown)
  useClickOutside(dropoffDropdownRef, showDropoffDropdown, closeDropoffDropdown)

  useEffect(() => {
    params.then((p) => setVehicleId(p.vehicleId))
  }, [params])

  useEffect(() => {
    setRentalData((prev) => ({
      ...prev,
      pickupCityId: searchParams.get('pickup') || prev.pickupCityId,
      dropoffCityId: searchParams.get('dropoff') || prev.dropoffCityId,
      pickupDate: searchParams.get('pickupDate') || prev.pickupDate,
      returnDate: searchParams.get('returnDate') || prev.returnDate,
      name: searchParams.get('name') || prev.name,
    }))
  }, [searchParams])

  useEffect(() => {
    if (!vehicleId) return
    const load = async () => {
      try {
        const [vehiclesRes, destRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/destinations?includeTourCount=false'),
        ])
        const vehiclesJson = await vehiclesRes.json()
        const destJson = await destRes.json()
        if (vehiclesJson.success) {
          setVehicle((vehiclesJson.data || []).find((v: Vehicle) => v.id === vehicleId) || null)
        }
        if (destJson.success) setDestinations(destJson.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [vehicleId])

  const routeDestinations = useMemo(() => {
    const pickup = destinations.find((d) => d.id === rentalData.pickupCityId)
    const dropoff = destinations.find((d) => d.id === rentalData.dropoffCityId)
    if (!pickup?.lat || !dropoff?.lat) return []
    return [
      { name: pickup.name, lat: pickup.lat, lng: pickup.lng, region: pickup.region },
      { name: dropoff.name, lat: dropoff.lat, lng: dropoff.lng, region: dropoff.region },
    ]
  }, [destinations, rentalData.pickupCityId, rentalData.dropoffCityId])

  const routeSegments = useMemo(() => getRouteSegments(routeDestinations), [routeDestinations])
  const totalRouteKm = useMemo(() => getTotalRouteKm(routeDestinations), [routeDestinations])

  const fetchQuote = async (chargeIds = selectedChargeIds) => {
    if (!vehicle || !rentalData.pickupCityId || !rentalData.dropoffCityId || !rentalData.pickupDate || !rentalData.returnDate) {
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
          pickupCityId: rentalData.pickupCityId,
          dropoffCityId: rentalData.dropoffCityId,
          pickupDate: rentalData.pickupDate,
          returnDate: rentalData.returnDate,
          selectedChargeIds: chargeIds,
        }),
      })
      const json = await res.json()
      if (json.success) setQuote(json.data)
    } catch (error) {
      console.error('Quote error:', error)
    } finally {
      setQuoteLoading(false)
    }
  }

  useEffect(() => {
    if (vehicle && rentalData.pickupCityId && rentalData.dropoffCityId && rentalData.pickupDate && rentalData.returnDate) {
      void fetchQuote()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, rentalData.pickupCityId, rentalData.dropoffCityId, rentalData.pickupDate, rentalData.returnDate])

  const toggleCharge = (chargeId: string) => {
    const next = selectedChargeIds.includes(chargeId)
      ? selectedChargeIds.filter((id) => id !== chargeId)
      : [...selectedChargeIds, chargeId]
    setSelectedChargeIds(next)
    void fetchQuote(next)
  }

  const handleBooking = async () => {
    if (!vehicle || !quote) return
    if (!rentalData.name || !rentalData.email || !rentalData.phone) {
      alert('Please fill in your name, email, and phone number')
      return
    }
    if (!rentalData.pickupDate || !rentalData.returnDate || !rentalData.pickupCityId || !rentalData.dropoffCityId) {
      alert('Please complete pickup/drop-off cities and dates')
      return
    }

    const pickup = destinations.find((d) => d.id === rentalData.pickupCityId)
    const dropoff = destinations.find((d) => d.id === rentalData.dropoffCityId)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'vehicle_rental',
          vehicle_id: vehicle.id,
          vehicle_name: vehicle.name,
          tour_id: vehicle.id,
          tour_name: `Car rental: ${vehicle.name}`,
          tour_package_id: vehicle.id,
          tour_package_name: `Car rental: ${vehicle.name}`,
          pickup_city_id: rentalData.pickupCityId,
          pickup_city_name: pickup?.name || '',
          dropoff_city_id: rentalData.dropoffCityId,
          dropoff_city_name: dropoff?.name || '',
          route_km: quote.routeKm,
          base_rent: quote.baseRent,
          extra_km_charge: quote.extraKmCharge,
          one_way_fee: quote.oneWayFee,
          additional_charges: quote.additionalCharges,
          customer_name: rentalData.name,
          customer_email: rentalData.email,
          customer_phone: rentalData.phone,
          start_date: rentalData.pickupDate,
          end_date: rentalData.returnDate,
          guests: 1,
          total_price: quote.totalPrice,
          special_requests: rentalData.specialRequests,
          status: 'pending',
          payment_status: 'pending',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Booking failed')
      window.location.href = `/payments/checkout?booking_id=${json.data.id}`
    } catch (error: any) {
      alert(error.message || 'Could not complete booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto lp-gutter py-20 text-center text-[var(--ink-soft)]">Loading vehicle…</div>
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

  const cityOptions = destinations.filter((d) => d.status !== 'inactive')

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />

      <section className="relative py-16 sm:py-20 md:py-24 bg-[var(--lagoon-deep)] text-white">
        <div className="max-w-[1920px] mx-auto lp-gutter">
          <p className="lp-kicker mb-3" style={{ ['--lp-kicker-color' as string]: '#d4f06a' }}>Rent a car</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{vehicle.name}</h1>
          <div className="flex flex-wrap gap-4 text-white/90">
            <span className="flex items-center gap-2"><Car className="w-4 h-4" />{vehicle.category}</span>
            <span className="flex items-center gap-2"><Users className="w-4 h-4" />{vehicle.seats} seats</span>
            <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-300 fill-current" />{vehicle.rating} ({vehicle.reviews})</span>
            <span className="font-semibold text-[var(--sun)]">{formatRentalCurrency(vehicle.basePricePerDay)}/day</span>
          </div>
        </div>
      </section>

      <div className="max-w-[1920px] mx-auto lp-gutter py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl overflow-hidden border border-black/5">
              <Image
                src={vehicle.images?.[selectedImage] || vehicle.images?.[0] || '/placeholder-image.svg'}
                alt={vehicle.name}
                width={900}
                height={500}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
                unoptimized
              />
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                  {vehicle.images.map((img, i) => (
                    <button key={i} type="button" onClick={() => setSelectedImage(i)} className={`shrink-0 rounded-lg overflow-hidden border-2 ${selectedImage === i ? 'border-[var(--lagoon)]' : 'border-transparent'}`}>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="lp-panel p-4 text-center"><Fuel className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" /><span className="text-sm">{vehicle.fuelType}</span></div>
                <div className="lp-panel p-4 text-center"><Settings className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" /><span className="text-sm">{vehicle.transmission}</span></div>
                <div className="lp-panel p-4 text-center"><Users className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" /><span className="text-sm">{vehicle.seats} seats</span></div>
                <div className="lp-panel p-4 text-center"><Navigation className="w-5 h-5 mx-auto mb-2 text-[var(--lagoon)]" /><span className="text-sm">{vehicle.includedKmPerDay} km/day</span></div>
              </div>
              <ul className="space-y-2">
                {vehicle.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[var(--ink-soft)]">
                    <CheckCircle className="w-5 h-5 text-[var(--lagoon)] shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="lp-section-title text-2xl mb-4">Your route</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 overflow-visible">
                <div className={`relative ${showPickupDropdown ? 'z-[100]' : 'z-10'}`} ref={pickupDropdownRef}>
                  <label className="block text-sm font-semibold mb-2 text-[var(--ink)]">Pickup city</label>
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
                      className="w-full pl-4 pr-10 py-3 text-left border border-black/10 rounded-xl bg-white text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] flex items-center cursor-pointer hover:border-[var(--lagoon)] transition-colors"
                    >
                      <span className="block truncate">
                        {(() => {
                          if (!rentalData.pickupCityId) return 'Select city'
                          const city = cityOptions.find((c) => c.id === rentalData.pickupCityId)
                          return city?.name || 'Select city'
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
                            aria-selected={!rentalData.pickupCityId}
                            onClick={() => {
                              setRentalData({ ...rentalData, pickupCityId: '' })
                              setShowPickupDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                          >
                            Select city
                          </button>
                        </li>
                        {cityOptions.map((c) => {
                          const isSelected = rentalData.pickupCityId === c.id
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                title={c.name}
                                onClick={() => {
                                  setRentalData({ ...rentalData, pickupCityId: c.id })
                                  setShowPickupDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors break-words ${
                                  isSelected
                                    ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                    : 'text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                }`}
                              >
                                {c.name}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
                <div className={`relative ${showDropoffDropdown ? 'z-[100]' : 'z-10'}`} ref={dropoffDropdownRef}>
                  <label className="block text-sm font-semibold mb-2 text-[var(--ink)]">Drop-off city</label>
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
                      className="w-full pl-4 pr-10 py-3 text-left border border-black/10 rounded-xl bg-white text-[var(--ink)] focus:ring-2 focus:ring-[var(--lagoon)] flex items-center cursor-pointer hover:border-[var(--lagoon)] transition-colors"
                    >
                      <span className="block truncate">
                        {(() => {
                          if (!rentalData.dropoffCityId) return 'Select city'
                          const city = cityOptions.find((c) => c.id === rentalData.dropoffCityId)
                          return city?.name || 'Select city'
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
                            aria-selected={!rentalData.dropoffCityId}
                            onClick={() => {
                              setRentalData({ ...rentalData, dropoffCityId: '' })
                              setShowDropoffDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                          >
                            Select city
                          </button>
                        </li>
                        {cityOptions.map((c) => {
                          const isSelected = rentalData.dropoffCityId === c.id
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                title={c.name}
                                onClick={() => {
                                  setRentalData({ ...rentalData, dropoffCityId: c.id })
                                  setShowDropoffDropdown(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors break-words ${
                                  isSelected
                                    ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                    : 'text-[var(--ink)] hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                }`}
                              >
                                {c.name}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {routeDestinations.length === 2 && (
                <>
                  <MapboxMap destinations={routeDestinations} tourName={`${vehicle.name} route`} />
                  <div className="mt-4 lp-panel p-4">
                    <h3 className="font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--lagoon)]" />
                      Trip route distances
                    </h3>
                    <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                      {routeSegments.map((seg, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{seg.from.name} → {seg.to.name}</span>
                          <span className="font-medium text-[var(--ink)]">{formatDistanceKm(seg.distanceKm)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 pt-3 border-t border-black/10 font-semibold text-[var(--lagoon-deep)]">
                      Total route: {formatDistanceKm(totalRouteKm)} (approx.)
                    </p>
                    {quote && (
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        Estimated driving allowance: {formatDistanceKm(quote.estimatedDrivingKm)} · Included: {quote.includedKm} km
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:h-fit space-y-6">
            <div className="lp-panel p-6">
              <h3 className="text-xl font-bold text-[var(--ink)] mb-4">Book this vehicle</h3>
              <div className="space-y-4">
                <div>
                  <SiteDatePicker
                    label="Pickup date"
                    value={rentalData.pickupDate}
                    placeholder="Select pickup date"
                    onChange={(pickupDate) => setRentalData({ ...rentalData, pickupDate })}
                  />
                </div>
                <div>
                  <SiteDatePicker
                    label="Return date"
                    value={rentalData.returnDate}
                    placeholder="Select return date"
                    minDate={rentalData.pickupDate}
                    onChange={(returnDate) => setRentalData({ ...rentalData, returnDate })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Full name</label>
                  <input type="text" value={rentalData.name} onChange={(e) => setRentalData({ ...rentalData, name: e.target.value })} className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input type="email" value={rentalData.email} onChange={(e) => setRentalData({ ...rentalData, email: e.target.value })} className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input type="tel" value={rentalData.phone} onChange={(e) => setRentalData({ ...rentalData, phone: e.target.value })} className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Special requests</label>
                  <textarea value={rentalData.specialRequests} onChange={(e) => setRentalData({ ...rentalData, specialRequests: e.target.value })} rows={3} className="w-full px-4 py-3 border border-black/10 rounded-xl bg-[var(--foam)]" />
                </div>

                {quote?.availableCharges && quote.availableCharges.length > 0 && (
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
                          <span className="ml-auto text-[var(--ink-soft)]">{formatRentalCurrency(charge.amount)}{charge.type === 'per_day' ? '/day' : charge.type === 'per_km' ? '/km' : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {quoteLoading && <p className="text-sm text-[var(--ink-soft)]">Calculating price…</p>}

                {quote && !quoteLoading && (
                  <div className="rounded-xl bg-[var(--foam)] border border-black/10 p-4 space-y-2">
                    <h4 className="font-semibold text-[var(--ink)]">Price estimate</h4>
                    {quote.breakdown.map((line, i) => (
                      <div key={i} className="flex justify-between text-sm">
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

                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={!quote || quoteLoading}
                  className="w-full bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] disabled:opacity-50 text-white py-4 rounded-full font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Reserve vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
