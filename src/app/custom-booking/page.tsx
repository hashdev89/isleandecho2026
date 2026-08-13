/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Users,
  ArrowRight,
  Clock,
  Check,
  X,
  Edit3,
  CheckCircle,
  Navigation,
  Calendar,
} from 'lucide-react'
import Header from '../../components/Header'
import SiteDatePicker from '../../components/SiteDatePicker'
import SafeImage from '../../components/SafeImage'
import dynamic from 'next/dynamic'
import { tourFitsGuestCountFromTour, formatGroupSizeRange, getTourGroupSize } from '@/lib/tourGroupSize'

const MapboxMap = dynamic(() => import('../../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[var(--foam)] rounded-2xl flex items-center justify-center border border-black/5">
      <p className="text-[var(--ink-soft)]">Loading map...</p>
    </div>
  ),
})

interface DestinationDetail {
  id: string
  name: string
  region?: string
}

interface CustomTripData {
  destinations: string[]
  destinationNames?: string[]
  destinationDetails?: DestinationDetail[]
  dateRange: string
  startDate?: string
  endDate?: string
  guests: number
  interests: string[]
  specialRequests?: string
  customerName?: string
  travelType?: string
  fromChat?: boolean
}

interface Destination {
  id: string
  name: string
  region: string
  description: string
  image: string
  coordinates: [number, number]
  activities: string[]
  lat: number
  lng: number
}

const INTEREST_LABELS: Record<string, string> = {
  culture: 'Culture & History',
  nature: 'Nature & Wildlife',
  beach: 'Beaches & Water Sports',
  adventure: 'Adventure & Hiking',
  food: 'Food & Cuisine',
  relaxation: 'Relaxation & Wellness',
  photography: 'Photography',
  shopping: 'Shopping & Markets',
}

const inputClass =
  'w-full px-3 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent bg-[var(--foam)] text-[var(--ink)]'

function slugify(value: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseTripDateRange(dateRange: string): { startDate: string; endDate: string } {
  if (!dateRange?.trim()) return { startDate: '', endDate: '' }
  const parts = dateRange
    .split(/\s+(?:to|-)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length >= 2) return { startDate: parts[0], endDate: parts[1] }
  return { startDate: parts[0] || '', endDate: '' }
}

function interestLabel(id: string) {
  return INTEREST_LABELS[id] || id.replace(/-/g, ' ')
}

function getDefaultActivities(region: string): string[] {
  switch (region) {
    case 'Western Province':
      return ['City Tours', 'Shopping', 'Cultural Sites', 'Nightlife']
    case 'Central Province':
      return ['Temple of the Tooth', 'Cultural Shows', 'Botanical Gardens', 'Tea Factory Tours']
    case 'Southern Province':
      return ['Fort Walking Tours', 'Beach Relaxation', 'Boutique Shopping', 'Sunset Views']
    case 'Cultural Triangle':
      return ['Rock Climbing', 'Ancient Palace Tours', 'Fresco Viewing', 'Sunset Photography']
    case 'Uva Province':
      return ['Hiking', 'Train Journey', 'Tea Plantations', 'Mountain Views']
    case 'North Central Province':
      return ['Ancient City Tours', 'Temple Visits', 'Historical Sites', 'Cultural Tours']
    case 'Wildlife':
      return ['Safari Tours', 'Wildlife Photography', 'Bird Watching', 'Nature Walks']
    case 'Eastern Province':
      return ['Beach Activities', 'Whale Watching', 'Water Sports', 'Cultural Tours']
    case 'Northern Province':
      return ['Cultural Tours', 'Historical Sites', 'Local Cuisine', 'Traditional Arts']
    default:
      return ['Sightseeing', 'Cultural Tours', 'Local Experiences', 'Photography']
  }
}

function resolveDestination(
  key: string,
  catalog: Destination[],
  detail?: DestinationDetail
): Destination | null {
  const needle = String(key || '').trim()
  if (!needle) return null

  const byId = catalog.find((d) => d.id === needle)
  if (byId) return byId

  const bySlug = catalog.find((d) => slugify(d.name) === slugify(needle) || slugify(d.name) === needle)
  if (bySlug) return bySlug

  const byName = catalog.find((d) => d.name.toLowerCase() === needle.toLowerCase())
  if (byName) return byName

  if (detail) {
    const fromDetail =
      catalog.find((d) => d.id === detail.id) ||
      catalog.find((d) => slugify(d.name) === slugify(detail.name)) ||
      catalog.find((d) => d.name.toLowerCase() === detail.name.toLowerCase())
    if (fromDetail) return fromDetail

    return {
      id: detail.id || slugify(detail.name) || needle,
      name: detail.name,
      region: detail.region || '',
      description: `Custom stop in ${detail.name}${detail.region ? `, ${detail.region}` : ''}.`,
      image: '/placeholder-image.svg',
      coordinates: [80.7718, 7.8731],
      activities: getDefaultActivities(detail.region || ''),
      lat: 7.8731,
      lng: 80.7718,
    }
  }

  return null
}

export default function CustomBookingPage() {
  const router = useRouter()
  const [tripData, setTripData] = useState<CustomTripData | null>(null)
  const [bookingData, setBookingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    guests: 1,
    specialRequests: '',
    selectedTour: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [availableTours, setAvailableTours] = useState<any[]>([])
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>([])
  const [destinationsReady, setDestinationsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await fetch('/api/tours')
        const json = await res.json()
        if (json.success) setAvailableTours(json.data || [])
      } catch (error) {
        console.error('Error fetching tours:', error)
      }
    }
    fetchTours()
  }, [])

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('/api/destinations')
        const result = await response.json()
        if (result.success && result.data) {
          const transformed = result.data.map((dest: any) => {
            const lat = Number(dest.lat) || 7.8731
            const lng = Number(dest.lng) || 80.7718
            return {
              id: String(dest.id),
              name: String(dest.name || ''),
              region: String(dest.region || ''),
              description: String(dest.description || ''),
              image: String(dest.image || '/placeholder-image.svg'),
              coordinates: [lng, lat] as [number, number],
              activities: getDefaultActivities(String(dest.region || '')),
              lat,
              lng,
            }
          })
          setAvailableDestinations(transformed)
        }
      } catch (error) {
        console.error('Error fetching destinations:', error)
        setAvailableDestinations([])
      } finally {
        setDestinationsReady(true)
      }
    }
    fetchDestinations()
  }, [])

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('customTripData')
      if (!storedData) {
        router.push('/#plan-trip')
        return
      }
      const parsedData = JSON.parse(storedData) as CustomTripData
      const fromRange = parseTripDateRange(parsedData.dateRange || '')
      const startDate = parsedData.startDate || fromRange.startDate
      const endDate = parsedData.endDate || fromRange.endDate

      setTripData({
        ...parsedData,
        destinations: parsedData.destinations || [],
        interests: parsedData.interests || [],
        guests: parsedData.guests || 1,
        startDate,
        endDate,
        dateRange: parsedData.dateRange || (startDate && endDate ? `${startDate} to ${endDate}` : ''),
      })
      setBookingData((prev) => ({
        ...prev,
        fullName: parsedData.customerName || prev.fullName,
        guests: parsedData.guests || 1,
        startDate: startDate || prev.startDate,
        endDate: endDate || prev.endDate,
        specialRequests: parsedData.specialRequests || prev.specialRequests,
      }))
    } catch (error) {
      console.error('Error loading custom trip data:', error)
      router.push('/')
    }
  }, [router])

  const selectedDestinations = useMemo(() => {
    if (!tripData) return [] as Destination[]

    const detailsByKey = new Map<string, DestinationDetail>()
    for (const detail of tripData.destinationDetails || []) {
      detailsByKey.set(detail.id, detail)
      detailsByKey.set(slugify(detail.name), detail)
      detailsByKey.set(detail.name.toLowerCase(), detail)
    }

    const resolved: Destination[] = []
    const seen = new Set<string>()

    for (const key of tripData.destinations || []) {
      const detail =
        detailsByKey.get(key) ||
        detailsByKey.get(slugify(key)) ||
        tripData.destinationDetails?.find((d) => d.id === key)
      const dest = resolveDestination(key, availableDestinations, detail)
      if (dest && !seen.has(dest.id)) {
        seen.add(dest.id)
        resolved.push(dest)
      }
    }

    // If IDs were empty/mismatched but names were stored, recover from names
    if (resolved.length === 0 && (tripData.destinationNames?.length || tripData.destinationDetails?.length)) {
      const names =
        tripData.destinationDetails?.map((d) => d.name) || tripData.destinationNames || []
      for (const name of names) {
        const detail = tripData.destinationDetails?.find((d) => d.name === name) || {
          id: slugify(name),
          name,
        }
        const dest = resolveDestination(name, availableDestinations, detail)
        if (dest && !seen.has(dest.id)) {
          seen.add(dest.id)
          resolved.push(dest)
        }
      }
    }

    return resolved
  }, [tripData, availableDestinations])

  const guestCountForTours = bookingData.guests || tripData?.guests || 1
  const toursForGuestCount = useMemo(
    () => availableTours.filter((tour) => tourFitsGuestCountFromTour(tour, guestCountForTours)),
    [availableTours, guestCountForTours]
  )

  useEffect(() => {
    if (!bookingData.selectedTour) return
    const selected = availableTours.find((tour) => tour.id === bookingData.selectedTour)
    if (selected && !tourFitsGuestCountFromTour(selected, guestCountForTours)) {
      setBookingData((prev) => ({ ...prev, selectedTour: '' }))
    }
  }, [guestCountForTours, bookingData.selectedTour, availableTours])

  const nightCount = useMemo(() => {
    if (!bookingData.startDate || !bookingData.endDate) {
      return Math.max(selectedDestinations.length - 1, 0)
    }
    const start = new Date(bookingData.startDate)
    const end = new Date(bookingData.endDate)
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(diff, 0)
  }, [bookingData.startDate, bookingData.endDate, selectedDestinations.length])

  const estimatedPrice =
    Math.max(selectedDestinations.length, 1) * 150 + (bookingData.guests || tripData?.guests || 1) * 50

  const heroImage =
    selectedDestinations.find((d) => d.image && d.image !== '/placeholder-image.svg')?.image ||
    selectedDestinations[0]?.image ||
    '/placeholder-image.svg'

  const handleTourSelection = (tourId: string) => {
    if (!tourId) {
      setBookingData((prev) => ({ ...prev, selectedTour: '' }))
      return
    }

    const selectedTour = availableTours.find((tour) => tour.id === tourId)
    if (!selectedTour) return

    setBookingData((prev) => {
      const next = { ...prev, selectedTour: tourId }
      // Only auto-fill dates when the guest has not already chosen Plan Your Trip dates
      if (!prev.startDate && selectedTour.duration) {
        const durationMatch = selectedTour.duration.match(/(\d+)\s*Days?/i)
        if (durationMatch) {
          const days = parseInt(durationMatch[1], 10)
          const startDate = new Date()
          const endDate = new Date()
          endDate.setDate(startDate.getDate() + days)
          next.startDate = startDate.toISOString().split('T')[0]
          next.endDate = endDate.toISOString().split('T')[0]
        }
      } else if (prev.startDate && selectedTour.duration && !prev.endDate) {
        const durationMatch = selectedTour.duration.match(/(\d+)\s*Days?/i)
        if (durationMatch) {
          const days = parseInt(durationMatch[1], 10)
          const startDate = new Date(prev.startDate)
          const endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + days)
          next.endDate = endDate.toISOString().split('T')[0]
        }
      }
      return next
    })
  }

  const handleStartDateChange = (value: string) => {
    setBookingData((prev) => {
      const next = { ...prev, startDate: value }
      if (prev.selectedTour && value) {
        const selectedTour = availableTours.find((tour) => tour.id === prev.selectedTour)
        const durationMatch = selectedTour?.duration?.match(/(\d+)\s*Days?/i)
        if (durationMatch) {
          const days = parseInt(durationMatch[1], 10)
          const startDate = new Date(value)
          const endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + days)
          next.endDate = endDate.toISOString().split('T')[0]
        }
      }
      return next
    })
  }

  const persistTrip = (next: CustomTripData) => {
    setTripData(next)
    localStorage.setItem('customTripData', JSON.stringify(next))
  }

  const removeDestination = (destinationId: string) => {
    if (!tripData) return
    const updated = {
      ...tripData,
      destinations: (tripData.destinations || []).filter((id) => id !== destinationId),
      destinationNames: (tripData.destinationNames || []).filter((_, index) => {
        const id = tripData.destinations?.[index]
        return id !== destinationId
      }),
      destinationDetails: (tripData.destinationDetails || []).filter((d) => d.id !== destinationId),
    }
    // Also drop by resolved destination match
    const removed = selectedDestinations.find((d) => d.id === destinationId)
    if (removed) {
      updated.destinations = updated.destinations.filter(
        (id) => id !== removed.id && slugify(id) !== slugify(removed.name)
      )
      updated.destinationNames = (updated.destinationNames || []).filter(
        (name) => name.toLowerCase() !== removed.name.toLowerCase()
      )
      updated.destinationDetails = (updated.destinationDetails || []).filter(
        (d) => d.id !== removed.id && d.name.toLowerCase() !== removed.name.toLowerCase()
      )
    }
    persistTrip(updated)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!bookingData.startDate || !bookingData.endDate) {
      alert('Please select your travel dates.')
      return
    }
    if (selectedDestinations.length === 0) {
      alert('Please keep at least one destination on your trip.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedTour = bookingData.selectedTour
        ? availableTours.find((tour) => tour.id === bookingData.selectedTour)
        : null
      const destinationNames = selectedDestinations.map((dest) => dest.name)
      const interestNames = (tripData?.interests || []).map((id) => interestLabel(id))
      const notes = [
        destinationNames.length ? `Destinations: ${destinationNames.join(', ')}` : '',
        interestNames.length ? `Interests: ${interestNames.join(', ')}` : '',
        bookingData.specialRequests?.trim() || '',
      ]
        .filter(Boolean)
        .join('\n')

      const tourId = bookingData.selectedTour || 'custom-trip'
      const tourName = selectedTour?.name || 'Custom Sri Lanka trip'

      const bookingPayload = {
        booking_type: 'custom_trip',
        tour_id: tourId,
        tour_name: tourName,
        tour_package_id: tourId,
        tour_package_name: tourName,
        customer_name: bookingData.fullName,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        guests: bookingData.guests,
        special_requests: notes,
        destinations: destinationNames,
        interests: interestNames,
        status: 'pending',
        payment_status: 'pending',
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      const result = await response.json()

      if (result.success) {
        localStorage.removeItem('customTripData')
        const bookingRef = result.data?.id || result.data?.booking_ref
        alert('Your custom trip request was submitted! We will contact you soon to finalize your itinerary.')
        if (bookingRef) {
          router.push(`/payments/checkout?booking_id=${encodeURIComponent(bookingRef)}`)
        } else {
          router.push('/')
        }
        return
      }

      alert(result.error || 'Error submitting booking. Please try again.')
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Error submitting booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tripData || !destinationsReady) {
    return (
      <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
        <Header />
        <div className="w-full lp-gutter py-24 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--lagoon-deep)]" />
          <p className="text-[var(--ink-soft)]">Loading your custom trip...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[var(--foam)] lp-section-ink">
      <Header />

      {/* Hero — matches tour package style */}
      <section
        className="relative w-full flex flex-col justify-center text-white overflow-hidden py-16 sm:py-20 md:py-24"
        style={{ minHeight: '55vh' }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 w-full lp-gutter">
          <div className="max-w-[1920px] mx-auto">
            <p className="lp-kicker mb-3 text-[var(--sun)]">Plan Your Trip</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl">
              Your Custom Sri Lanka Trip
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 opacity-90 max-w-2xl">
              {tripData.fromChat
                ? `Personalized from chat${tripData.travelType ? ` · ${tripData.travelType}` : ''} — refine destinations below and complete your booking.`
                : 'Built from your Plan Your Trip selections — refine the route and send your request.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--sun)]" />
                <span>
                  {nightCount > 0
                    ? `${nightCount + 1} Days / ${nightCount} Nights`
                    : `${Math.max(selectedDestinations.length, 1)} Days`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--sun)]" />
                <span>
                  {bookingData.guests || tripData.guests}{' '}
                  {(bookingData.guests || tripData.guests) === 1 ? 'Person' : 'People'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--sun)]" />
                <span>
                  {selectedDestinations.length} Destination
                  {selectedDestinations.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--sun)] mb-6">
              From ${estimatedPrice}
            </div>
            <button
              type="button"
              onClick={() =>
                document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="bg-[var(--sun)] text-[var(--lagoon-deep)] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:brightness-110 transition-all text-base sm:text-lg min-h-[44px]"
            >
              Book This Custom Trip
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 w-full">
        <div className="w-full lp-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-[1920px] mx-auto">
            {/* Main */}
            <div className="lg:col-span-2 space-y-12">
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h2 className="lp-section-title text-2xl mb-0">Your Destinations</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-[var(--lagoon)] hover:text-[var(--lagoon-deep)] transition-colors text-sm font-semibold"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Done Editing' : 'Edit Trip'}
                  </button>
                </div>

                <div className="lp-panel p-4 sm:p-6">
                  {selectedDestinations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--lagoon)]/30 bg-[var(--lagoon)]/5 p-6 text-center">
                      <p className="text-[var(--ink-soft)] mb-4">
                        No destinations matched yet. Go back to Plan Your Trip and select stops again.
                      </p>
                      <Link
                        href="/#plan-trip"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--lagoon-deep)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--lagoon)]"
                      >
                        Back to Plan Your Trip
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {selectedDestinations.map((dest, index) => (
                          <div
                            key={dest.id}
                            className="rounded-xl p-4 border border-[var(--lagoon)]/20 bg-[var(--lagoon)]/5 relative"
                          >
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeDestination(dest.id)}
                                className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700"
                                aria-label={`Remove ${dest.name}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <div className="flex items-center gap-2 mb-2 min-w-0 pr-6">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--lagoon-deep)] text-[10px] font-bold text-white">
                                {index + 1}
                              </span>
                              <MapPin className="w-4 h-4 text-[var(--lagoon)] shrink-0" />
                              <h3 className="font-semibold text-[var(--ink)] truncate">{dest.name}</h3>
                            </div>
                            <p className="text-sm text-[var(--ink-soft)]">{dest.region || 'Sri Lanka'}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg overflow-hidden border border-black/10">
                        <MapboxMap
                          destinations={selectedDestinations.map((dest) => ({
                            ...dest,
                            lat: dest.lat,
                            lng: dest.lng,
                          }))}
                          tourName="Custom Trip"
                        />
                      </div>

                      <div className="mt-6">
                        <h4 className="font-semibold text-[var(--ink)] mb-3">Map Features</h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full shrink-0" />
                            <span className="text-sm text-[var(--ink-soft)]">Destinations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[var(--lagoon)] rounded-full shrink-0" />
                            <span className="text-sm text-[var(--ink-soft)]">Route</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-3 h-3 text-green-600 shrink-0" />
                            <span className="text-sm text-[var(--ink-soft)]">Interactive navigation</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {selectedDestinations.length > 0 && (
                <div>
                  <h2 className="lp-section-title text-2xl mb-6">Suggested Itinerary</h2>
                  <div className="space-y-5 sm:space-y-6">
                    {selectedDestinations.map((destination, index) => (
                      <div key={destination.id} className="lp-panel p-4 sm:p-6">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--lagoon-deep)] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-[var(--ink)]">
                              {destination.name}
                            </h3>
                            <p className="text-sm text-[var(--ink-soft)]">
                              {destination.region || 'Sri Lanka'}
                            </p>
                          </div>
                        </div>
                        {destination.description && (
                          <p className="text-[var(--ink-soft)] text-sm sm:text-base mb-4 leading-relaxed">
                            {destination.description}
                          </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4">
                            <h4 className="font-semibold text-[var(--ink)] mb-3">Activities</h4>
                            <ul className="space-y-2">
                              {destination.activities.map((activity, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4">
                            <h4 className="font-semibold text-[var(--ink)] mb-3">Highlights</h4>
                            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
                              <li>• Cultural exploration</li>
                              <li>• Local experiences</li>
                              <li>• Professional guide</li>
                              <li>• Comfortable accommodation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(tripData.interests?.length || 0) > 0 && (
                <div>
                  <h2 className="lp-section-title text-2xl mb-6">Your Interests</h2>
                  <div className="lp-panel p-6">
                    <p className="text-[var(--ink-soft)] mb-4">
                      We&apos;ll tailor activities based on your preferences from Plan Your Trip.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tripData.interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--sun)]/40 text-[var(--lagoon-deep)]"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {interestLabel(interest)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedDestinations.some((d) => d.image && d.image !== '/placeholder-image.svg') && (
                <div>
                  <h2 className="lp-section-title text-2xl mb-6">Destination Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {selectedDestinations.slice(0, 6).map((destination, index) => (
                      <button
                        key={destination.id}
                        type="button"
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-[4/3] overflow-hidden rounded-xl border transition-all ${
                          selectedImage === index
                            ? 'ring-2 ring-[var(--lagoon-deep)] border-[var(--lagoon-deep)]'
                            : 'border-black/10 hover:opacity-90'
                        }`}
                      >
                        <SafeImage
                          src={destination.image || '/placeholder-image.svg'}
                          alt={destination.name}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto space-y-6">
              <div id="booking-form" className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Quick Booking</h3>

                {(bookingData.startDate || bookingData.endDate) && (
                  <div className="mb-4 rounded-xl border border-[var(--lagoon)]/20 bg-[var(--lagoon)]/5 p-3 text-sm text-[var(--ink-soft)]">
                    From Plan Your Trip:{' '}
                    <span className="font-semibold text-[var(--ink)]">
                      {bookingData.startDate || '—'}
                      {bookingData.endDate ? ` → ${bookingData.endDate}` : ''}
                    </span>
                    {selectedDestinations.length > 0 && (
                      <>
                        <br />
                        Destinations:{' '}
                        <span className="font-semibold text-[var(--ink)]">
                          {selectedDestinations.map((d) => d.name).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Base tour package{' '}
                      <span className="font-normal text-[var(--ink-soft)]">(optional)</span>
                    </label>
                    <select
                      value={bookingData.selectedTour}
                      onChange={(e) => handleTourSelection(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Custom itinerary only — no preset package</option>
                      {toursForGuestCount.map((tour) => {
                        const paxLabel = formatGroupSizeRange(getTourGroupSize(tour))
                        return (
                          <option key={tour.id} value={tour.id}>
                            {tour.name} - {tour.duration}
                            {paxLabel ? ` (${paxLabel})` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={bookingData.fullName}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, fullName: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                      placeholder="Enter your email"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <SiteDatePicker
                      label="Tour Start Date"
                      value={bookingData.startDate}
                      placeholder="Select start date"
                      onChange={handleStartDateChange}
                    />
                  </div>

                  <div>
                    <SiteDatePicker
                      label="Tour End Date"
                      value={bookingData.endDate}
                      placeholder="Select end date"
                      minDate={bookingData.startDate}
                      onChange={(endDate) => setBookingData({ ...bookingData, endDate })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      value={bookingData.guests}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          setBookingData({ ...bookingData, guests: 1 })
                          return
                        }
                        const n = parseInt(raw, 10)
                        if (!Number.isFinite(n)) return
                        setBookingData({
                          ...bookingData,
                          guests: Math.max(1, Math.min(999, n)),
                        })
                      }}
                      min={1}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Special Requests
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, specialRequests: e.target.value })
                      }
                      rows={3}
                      className={inputClass}
                      placeholder="Any special requirements or preferences..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--lagoon-deep)] text-white py-3 px-4 rounded-full font-semibold hover:bg-[var(--lagoon)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {isSubmitting ? 'Submitting…' : 'Book Custom Trip'}
                  </button>
                </form>
              </div>

              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Trip Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[var(--lagoon)]" />
                    <div>
                      <p className="text-sm text-[var(--ink-soft)]">Duration</p>
                      <p className="font-medium text-[var(--ink)]">
                        {nightCount > 0
                          ? `${nightCount + 1} Days / ${nightCount} Nights`
                          : `${Math.max(selectedDestinations.length, 1)} Days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[var(--lagoon)]" />
                    <div>
                      <p className="text-sm text-[var(--ink-soft)]">Guests</p>
                      <p className="font-medium text-[var(--ink)]">
                        {bookingData.guests || tripData.guests}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[var(--lagoon)]" />
                    <div>
                      <p className="text-sm text-[var(--ink-soft)]">Destinations</p>
                      <p className="font-medium text-[var(--ink)]">
                        {selectedDestinations.length || 0} Locations
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">What&apos;s Included</h3>
                <ul className="space-y-2">
                  {[
                    'Professional English-speaking guide',
                    'All accommodation',
                    'Daily breakfast',
                    'Air-conditioned vehicle',
                    'Airport transfers',
                    'Bottled water',
                  ].map((item) => (
                    <li key={item} className="flex items-center text-sm text-[var(--ink-soft)]">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Not Included</h3>
                <ul className="space-y-2">
                  {[
                    'International flights',
                    'Personal expenses',
                    'Tips for guides',
                    'Travel insurance',
                    'Optional activities',
                  ].map((item) => (
                    <li key={item} className="flex items-center text-sm text-[var(--ink-soft)]">
                      <X className="w-4 h-4 text-red-500 mr-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
