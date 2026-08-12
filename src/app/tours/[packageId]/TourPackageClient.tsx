/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Users,
  Star,
  Clock,
  CheckCircle,
  Navigation,
  Calendar,
  Sparkles,
  Hotel,
  UtensilsCrossed,
  Car,
  Moon,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Header from '../../../components/Header'
import SafeImage from '../../../components/SafeImage'
import dynamic from 'next/dynamic'
import { formatDistanceKm, getRouteSegments, getTotalRouteKm } from '@/lib/geoDistance'
import { tourFitsGuestCount } from '@/lib/tourGroupSize'

// Hero height: use '50vh', '60vh', '70vh', etc. to control how tall the hero is
const TOUR_HERO_MIN_HEIGHT = '60vh'

// Dynamically import MapboxMap to reduce initial bundle size
const MapboxMap = dynamic(() => import('../../../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-[var(--foam)] rounded-2xl flex items-center justify-center border border-black/5">
      <p className="text-[var(--ink-soft)]">Loading map...</p>
    </div>
  ),
})

// Helper function to check if an image is uploaded (not external)
function isUploadedImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Check if it's a local upload path
  if (url.startsWith('/uploads/')) return true
  
  // Check if it's from Supabase storage
  if (url.includes('supabase.co') && url.includes('storage')) return true
  
  // Everything else is considered external
  return false
}

interface TourPackage {
  id: string
  name: string
  duration: string
  price: string
  destinations: string[]
  highlights: string[]
  keyExperiences?: string[]
  description: string
  itinerary: Day[]
  inclusions: string[]
  exclusions: string[]
  importantInfo?: {
    requirements: {
      activity: string
      requirements: string[]
    }[]
    whatToBring: string[]
  }
  accommodation: string[]
  transportation: string
  groupSize: string
  bestTime: string
  style: string
  images: string[]
}

interface Day {
  day: number
  title: string
  description: string
  activities: string[]
  accommodation: string
  meals: string[]
  transportation?: string
  travelTime?: string
  overnightStay?: string
  image?: string
}

export default function TourPackageClient({ params }: { params: Promise<{ packageId: string }> }) {
  const searchParams = useSearchParams()
  const [selectedImage, setSelectedImage] = useState(0)
  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [packageId, setPackageId] = useState<string>('')
  const [availableDestinations, setAvailableDestinations] = useState<Array<{name: string, lat: number, lng: number, region: string}>>([])
  const [bookingData, setBookingData] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    guests: parseInt(searchParams.get('guests') || '1') || 1,
    name: searchParams.get('name') || '',
    email: '',
    phone: '',
    specialRequests: searchParams.get('specialRequests') || ''
  })

  // Function to extract number of days from duration string (e.g., "7 Days / 6 Nights" -> 7)
  const getDaysFromDuration = (duration: string): number => {
    if (!duration) return 0
    const match = duration.match(/(\d+)\s*Days?/i)
    return match ? parseInt(match[1], 10) : 0
  }

  // Function to calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, duration: string): string => {
    if (!startDate || !duration) return ''
    const days = getDaysFromDuration(duration)
    if (days === 0) return ''
    
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + days - 1) // Subtract 1 because start date is day 1
    
    return end.toISOString().split('T')[0]
  }

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setPackageId(resolvedParams.packageId)
    }
    resolveParams()
  }, [params])

  // Function to normalize tour data from API
  const normalizeTourData = (tour: any): TourPackage => {
    // Handle destinations - could be array, JSONB string, or undefined
    let destinations: string[] = []
    if (tour.destinations) {
      if (Array.isArray(tour.destinations)) {
        destinations = tour.destinations
      } else if (typeof tour.destinations === 'string') {
        try {
          destinations = JSON.parse(tour.destinations)
        } catch {
          // If parsing fails, treat as single destination name
          destinations = [tour.destinations]
        }
      }
    }

    return {
      id: tour.id,
      name: tour.name,
      duration: tour.duration,
      price: tour.price,
      style: tour.style || '',
      destinations: destinations,
      highlights: Array.isArray(tour.highlights) ? tour.highlights : (tour.highlights ? JSON.parse(tour.highlights) : []),
      keyExperiences: Array.isArray(tour.keyExperiences || tour.key_experiences) 
        ? (tour.keyExperiences || tour.key_experiences) 
        : [],
      description: tour.description || '',
      itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
      inclusions: Array.isArray(tour.inclusions) ? tour.inclusions : [],
      exclusions: Array.isArray(tour.exclusions) ? tour.exclusions : [],
      importantInfo: tour.importantInfo || tour.important_info || undefined,
      accommodation: Array.isArray(tour.accommodation) ? tour.accommodation : [],
      transportation: tour.transportation || '',
      groupSize: tour.groupSize || tour.group_size || (tour.importantInfo as Record<string, string>)?.groupSize || (tour.important_info as Record<string, string>)?.groupSize || '',
      bestTime: tour.bestTime || tour.best_time || (tour.importantInfo as Record<string, string>)?.bestTime || (tour.important_info as Record<string, string>)?.bestTime || '',
      images: Array.isArray(tour.images) ? tour.images : []
    }
  }

  // Fetch destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await fetch('/api/destinations')
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          const mappedDestinations = result.data.map((dest: any) => ({
            name: dest.name,
            lat: dest.lat,
            lng: dest.lng,
            region: dest.region
          }))
          setAvailableDestinations(mappedDestinations)
          console.log('Destinations fetched for map:', mappedDestinations.length)
        }
      } catch (error) {
        console.error('Error fetching destinations:', error)
      }
    }
    fetchDestinations()
  }, [])

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await fetch('/api/tours')
        const data = await response.json()
        if (data.success) {
          const tour = data.data.find((t: any) => t.id === packageId)
          if (tour) {
            setTourPackage(normalizeTourData(tour))
          } else {
            setTourPackage(null)
          }
        }
      } catch (error) {
        console.error('Error fetching tour:', error)
        setTourPackage(null)
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchTour()
    }
  }, [packageId])

  // Auto-calculate end date when tour package is loaded and start date is set
  useEffect(() => {
    if (tourPackage && bookingData.startDate) {
      const calculatedEndDate = calculateEndDate(bookingData.startDate, tourPackage.duration)
      if (calculatedEndDate && calculatedEndDate !== bookingData.endDate) {
        setBookingData(prev => ({
          ...prev,
          endDate: calculatedEndDate
        }))
      }
    }
  }, [tourPackage?.duration, bookingData.startDate])
      
  // Map coordinates from API destinations only (no dummy data)
  const tourDestinations = (tourPackage?.destinations ?? [])
    .map((dest: string) => availableDestinations.find(d => d.name === dest))
    .filter((d): d is { name: string; lat: number; lng: number; region: string } => d != null && typeof d.lat === 'number' && typeof d.lng === 'number') || []

  const routeSegments = useMemo(() => getRouteSegments(tourDestinations), [tourDestinations])
  const totalRouteKm = useMemo(() => getTotalRouteKm(tourDestinations), [tourDestinations])

  // Debug logging
  useEffect(() => {
    if (tourPackage) {
      console.log('Tour destinations for map:', {
        tourDestinations: tourPackage.destinations,
        mappedDestinations: tourDestinations,
        availableDestinationsCount: availableDestinations.length
      })
    }
  }, [tourPackage?.destinations, tourDestinations.length, availableDestinations.length])

  // Build gallery images from top-level images + day images (only uploaded images)
  const galleryImages: string[] = [
    ...((tourPackage?.images || []) as string[]).filter(img => isUploadedImage(img)),
    ...(((tourPackage?.itinerary || [])
      .map((d) => d.image)
      .filter((src): src is string => typeof src === 'string' && src.length > 0 && isUploadedImage(src)) as string[])),
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  const [showLightbox, setShowLightbox] = useState(false)

  const openLightbox = (index: number) => {
    setSelectedImage(index)
    setShowLightbox(true)
  }

  const closeLightbox = () => setShowLightbox(false)

  const prevImage = () => {
    if (galleryImages.length === 0) return
    setSelectedImage((idx) => (idx - 1 + galleryImages.length) % galleryImages.length)
  }

  const nextImage = () => {
    if (galleryImages.length === 0) return
    setSelectedImage((idx) => (idx + 1) % galleryImages.length)
  }

  useEffect(() => {
    if (!showLightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [showLightbox, galleryImages.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto lp-gutter py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[var(--lagoon)] mx-auto"></div>
          <p className="text-[var(--ink-soft)] mt-4">Loading tour details...</p>
        </div>
      </div>
    )
  }

  if (!tourPackage) {
    return (
      <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto lp-gutter py-16 text-center">
          <h1 className="lp-section-title text-3xl text-[var(--ink)] mb-4">Tour Package Not Found</h1>
          <p className="text-[var(--ink-soft)]">The tour package you&apos;re looking for doesn&apos;t exist.</p>
          <div className="mt-8">
            <Link href="/tours" className="bg-[var(--lagoon-deep)] text-white px-6 py-3 rounded-full hover:bg-[var(--lagoon)] transition-colors">
              View All Tours
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleBooking = async () => {
    try {
      // Validate required fields
      if (!bookingData.name || !bookingData.email || !bookingData.phone || !bookingData.startDate || !bookingData.endDate) {
        alert('Please fill in all required fields')
        return
      }

      const totalPrice = parseFloat(tourPackage?.price?.replace(/[^0-9.]/g, '') || '0')
      
      const payload = {
        booking_type: 'tour',
        tour_id: tourPackage.id,
        tour_name: tourPackage.name,
        tour_package_id: tourPackage.id,
        tour_package_name: tourPackage.name,
        customer_name: bookingData.name,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        guests: bookingData.guests,
        total_price: totalPrice,
        status: 'pending',
        special_requests: bookingData.specialRequests,
        payment_status: 'pending',
      }
      
      // Create booking first
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      
      if (!json.success) throw new Error(json.error || 'Failed to create booking')
      
      const bookingId = json.data.id
      
      // Redirect to payment checkout page
      window.location.href = `/payments/checkout?booking_id=${bookingId}`
    } catch (e: any) {
      console.error('Booking failed:', e)
      alert(`Booking failed: ${e.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[var(--foam)] lp-section-ink">
      <Header />
      
      {/* Hero Section - tour image background, ~70% black overlay, content only */}
      <section
        className="relative w-full flex flex-col justify-center text-white overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28"
        style={{ minHeight: TOUR_HERO_MIN_HEIGHT }}
      >
        {/* Background image from tour images */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${tourPackage.images?.find((img: string) => isUploadedImage(img)) || tourPackage.images?.[0] || '/placeholder-image.svg'})`,
          }}
        />
        {/* ~70% black overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--lagoon-deep)]/90 via-[var(--lagoon-deep)]/55 to-black/25 z-[1]" aria-hidden />
        {/* Content on top of overlay — match bottom section horizontal padding */}
        <div className="relative z-10 w-full max-w-[1920px] mx-auto lp-gutter">
          <div>
            <h1 className="lp-section-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 sm:mb-6">{tourPackage.name}</h1>
            {tourPackage.style && (
              <span className="inline-block mb-4 bg-[var(--sun)] text-[var(--lagoon-deep)] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                {tourPackage.style}
              </span>
            )}
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 max-w-3xl">{tourPackage.description}</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tourPackage.duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tourPackage.groupSize}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">4.8/5 (127 reviews)</span>
              </div>
            </div>
            {parseFloat(tourPackage?.price?.replace(/[^0-9.]/g, '') || '0') > 0 && (
              <div className="text-2xl sm:text-3xl font-bold text-[var(--sun)] mb-4 sm:mb-6">{tourPackage.price}</div>
            )}
          </div>
        </div>
      </section>

      {/* Tour Details - full width content */}
      <section className="py-16 w-full">
        <div className="w-full lp-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-[1920px] mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">

              {/* Key Experiences */}
              {tourPackage.keyExperiences && tourPackage.keyExperiences.length > 0 && (
                <div>
                  <h2 className="lp-section-title text-2xl mb-6">Key Experiences</h2>
                  <div className="lp-panel p-6">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                      {(tourPackage.keyExperiences || []).map((item, index) => (
                        <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                            <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2} />
                          </span>
                          <span className="min-w-0 flex-1 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tour Destinations: cards first, then map, then map features */}
              <div>
                <h2 className="lp-section-title text-2xl mb-6">Tour Destinations</h2>
                <div className="lp-panel p-4 sm:p-6">
                  {/* Destination cards – right under the title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {tourDestinations.map((dest, index) => {
                      const leg = index > 0 ? routeSegments[index - 1] : null
                      return (
                      <div key={index} className="rounded-xl p-4 border border-[var(--lagoon)]/20 bg-[var(--lagoon)]/5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--lagoon-deep)] text-[10px] font-bold text-white">
                              {index + 1}
                            </span>
                            <MapPin className="w-4 h-4 text-[var(--lagoon)] shrink-0" />
                            <h3 className="font-semibold text-[var(--ink)] truncate">{dest.name}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--ink-soft)] mb-2">{dest.region}</p>
                        {leg && (
                          <p className="text-xs font-semibold text-[var(--lagoon-deep)]">
                            {formatDistanceKm(leg.distanceKm)} from {leg.from.name}
                          </p>
                        )}
                      </div>
                    )})}
                  </div>

                  {/* Map – below the cards */}
                  <div className="rounded-lg overflow-hidden border border-black/10">
                    <MapboxMap 
                      key={`tour-map-${tourPackage.id}-${tourDestinations.map(d => d.name).join(',')}`}
                      destinations={tourDestinations}
                      tourName={tourPackage.name}
                    />
                  </div>

                  {routeSegments.length > 0 && (
                    <div className="mt-6 rounded-xl border border-[var(--lagoon)]/20 bg-[var(--foam)] p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h4 className="font-semibold text-[var(--ink)]">Trip route distances</h4>
                        <p className="text-sm font-bold text-[var(--lagoon-deep)]">
                          Total coverage: {formatDistanceKm(totalRouteKm)}
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {routeSegments.map((segment, index) => (
                          <li
                            key={`${segment.from.name}-${segment.to.name}-${index}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm text-[var(--ink-soft)] border-b border-black/5 last:border-0 pb-2 last:pb-0"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <Navigation className="w-4 h-4 text-[var(--lagoon)] shrink-0" />
                              <span className="truncate">
                                {segment.from.name} → {segment.to.name}
                              </span>
                            </span>
                            <span className="font-semibold text-[var(--lagoon-deep)] sm:ml-4 shrink-0">
                              {formatDistanceKm(segment.distanceKm)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-[var(--ink-soft)]">
                        Distances are straight-line estimates between stops and help show how much ground this tour covers.
                      </p>
                    </div>
                  )}

                  {/* Map legend */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-[var(--ink)] mb-3">Map Features</h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full shrink-0" />
                        <span className="text-sm text-[var(--ink-soft)]">Tour Destinations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-[var(--lagoon)] rounded-full shrink-0" />
                        <span className="text-sm text-[var(--ink-soft)]">Tour Route</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-[var(--lagoon-deep)] rounded-full shrink-0" />
                        <span className="text-sm text-[var(--ink-soft)]">Distance between stops</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Navigation className="w-3 h-3 text-green-600 shrink-0" />
                        <span className="text-sm text-[var(--ink-soft)]">Interactive navigation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div>
                <h2 className="lp-section-title text-xl sm:text-2xl mb-4 sm:mb-6">Detailed Itinerary</h2>
                <div className="space-y-5 sm:space-y-6">
                  {(tourPackage.itinerary || []).map((day) => (
                    <div key={day.day} className="lp-panel p-4 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--lagoon-deep)] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                          {day.day}
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-[var(--ink)]">{day.title}</h3>
                      </div>
                      <p className="text-[var(--ink-soft)] text-sm sm:text-base mb-4 sm:mb-5 leading-relaxed">{day.description}</p>
                      {day.image && isUploadedImage(day.image) && (
                        <div className="mb-5 sm:mb-6 rounded-lg overflow-hidden">
                          <Image
                            src={day.image}
                            alt={`Day ${day.day} - ${day.title}`}
                            width={800}
                            height={400}
                            className="w-full h-48 sm:h-56 md:h-64 object-cover"
                          />
                        </div>
                      )}
                      {/* Bento: large = top row Highlights full width, bottom row 4 columns. Mobile = stacked grid. */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mt-6">
                        {/* Highlights - full width top row on xl */}
                        <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4 sm:p-5 flex flex-col min-h-0 xl:col-span-4">
                          <h4 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-sm sm:text-base mb-3">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                            Highlights
                          </h4>
                          <ul className="space-y-2 flex-1">
                            {(day.activities || []).length > 0 ? (
                              (day.activities || []).map((activity, index) => (
                                <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                                    <CheckCircle className="h-4 w-4 text-green-500" strokeWidth={2} />
                                  </span>
                                  <span className="min-w-0 flex-1 leading-relaxed">{activity}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-[var(--ink-soft)]">—</li>
                            )}
                          </ul>
                        </div>
                        {/* Accommodation - bottom row, 1 of 4 columns on xl */}
                        <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4 sm:p-5 flex flex-col min-h-0 xl:col-span-1">
                          <h4 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-sm sm:text-base mb-3">
                            <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--lagoon)] shrink-0" />
                            Accommodation
                          </h4>
                          <p className="text-sm text-[var(--ink-soft)] flex-1">
                            {day.accommodation || '—'}
                          </p>
                        </div>
                        {/* Meals - bottom row, 1 of 4 columns on xl */}
                        <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4 sm:p-5 flex flex-col min-h-0 xl:col-span-1">
                          <h4 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-sm sm:text-base mb-3">
                            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                            Meals
                          </h4>
                          <ul className="space-y-2 flex-1">
                            {(day.meals || []).length > 0 ? (
                              (day.meals || []).map((meal, index) => (
                                <li key={index} className="text-sm text-[var(--ink-soft)]">{meal}</li>
                              ))
                            ) : (
                              <li className="text-sm text-[var(--ink-soft)]">—</li>
                            )}
                          </ul>
                        </div>
                        {/* Transport - bottom row, 1 of 4 columns on xl */}
                        <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4 sm:p-5 flex flex-col min-h-0 xl:col-span-1">
                          <h4 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-sm sm:text-base mb-3">
                            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400 shrink-0" />
                            Transport
                          </h4>
                          <div className="space-y-2 flex-1 text-sm text-[var(--ink-soft)]">
                            {day.transportation ? (
                              <p><span className="font-medium text-[var(--ink)]">Transport:</span> {day.transportation}</p>
                            ) : null}
                            {day.travelTime ? (
                              <p><span className="font-medium text-[var(--ink)]">Travel time:</span> {day.travelTime}</p>
                            ) : null}
                            {!day.transportation && !day.travelTime && <p className="text-gray-400 dark:text-gray-500">—</p>}
                          </div>
                        </div>
                        {/* Stay - bottom row, 1 of 4 columns on xl */}
                        <div className="rounded-xl border border-black/10 bg-[var(--foam)] p-4 sm:p-5 flex flex-col min-h-0 sm:col-span-2 xl:col-span-1">
                          <h4 className="font-semibold text-[var(--ink)] flex items-center gap-2 text-sm sm:text-base mb-3">
                            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--lagoon)] shrink-0" />
                            Stay
                          </h4>
                          <p className="text-sm text-[var(--ink-soft)] flex-1">
                            {day.overnightStay || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Gallery */}
              <div>
                <h2 className="lp-section-title text-2xl mb-6">Tour Gallery</h2>
                {galleryImages.length === 0 ? (
                  <p className="text-sm text-[var(--ink-soft)]">No gallery images yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {galleryImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/5 transition hover:ring-[var(--lagoon)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]"
                      >
                        <SafeImage
                          src={image}
                          alt={`${tourPackage.name} - Image ${index + 1}`}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {showLightbox && galleryImages.length > 0 && typeof document !== 'undefined'
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-8"
                      onClick={closeLightbox}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Tour gallery"
                    >
                      <button
                        type="button"
                        aria-label="Close gallery"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-[210] inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                        className="absolute left-3 sm:left-6 top-1/2 z-[210] -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <div
                        className="relative max-h-[85vh] w-full max-w-5xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SafeImage
                          src={galleryImages[selectedImage]}
                          alt={`${tourPackage.name} - Image ${selectedImage + 1}`}
                          width={1280}
                          height={720}
                          className="mx-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
                        />
                        <p className="mt-3 text-center text-sm text-white/90">
                          {selectedImage + 1} / {galleryImages.length}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        className="absolute right-3 sm:right-6 top-1/2 z-[210] -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>,
                    document.body
                  )
                : null}


            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto space-y-6">
              {/* Quick Booking */}
              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Quick Booking</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={bookingData.name || ''}
                      onChange={(e) => {
                        console.log('Name input changed:', e.target.value)
                        setBookingData({...bookingData, name: e.target.value})
                      }}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent bg-[var(--foam)] text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Email Address</label>
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Tour Start Date
                      {tourPackage.duration && (
                        <span className="text-xs text-[var(--ink-soft)] ml-2">({tourPackage.duration})</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.startDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value
                          const calculatedEndDate = calculateEndDate(newStartDate, tourPackage?.duration || '')
                          setBookingData({
                            ...bookingData,
                            startDate: newStartDate,
                            endDate: calculatedEndDate || bookingData.endDate
                          })
                        }}
                        className="w-full px-3 py-2 pr-10 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)] cursor-pointer"
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="Select start date"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {bookingData.startDate && tourPackage?.duration && (
                      <p className="text-xs text-[var(--ink-soft)] mt-1">
                        End date will be automatically set to {calculateEndDate(bookingData.startDate, tourPackage.duration) || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Tour End Date
                      <span className="text-xs text-[var(--ink-soft)] ml-2">(Auto-calculated)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={bookingData.endDate}
                        onChange={(e) => setBookingData({...bookingData, endDate: e.target.value})}
                        className="w-full px-3 py-2 pr-10 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)] cursor-pointer"
                        min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                        placeholder="Select end date"
                        title="End date is automatically calculated based on package duration. You can manually adjust if needed."
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    {bookingData.startDate && bookingData.endDate && (
                      <p className="text-xs text-[var(--lagoon)] mt-1 font-medium">
                        Date Range: {new Date(bookingData.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} - {new Date(bookingData.endDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Number of Guests</label>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        aria-label="Decrease guests"
                        onClick={() => setBookingData({ ...bookingData, guests: Math.max(1, (bookingData.guests || 1) - 1) })}
                        className="absolute left-2 z-10 w-8 h-8 rounded-full bg-white border border-black/10 text-[var(--lagoon-deep)] font-bold hover:bg-[var(--sun)] transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={bookingData.guests}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') {
                            setBookingData({ ...bookingData, guests: 1 })
                            return
                          }
                          const n = parseInt(raw, 10)
                          if (!Number.isFinite(n)) return
                          setBookingData({ ...bookingData, guests: Math.max(1, Math.min(999, n)) })
                        }}
                        className="w-full pl-11 pr-11 py-2 text-center border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        aria-label="Increase guests"
                        onClick={() => setBookingData({ ...bookingData, guests: Math.min(999, (bookingData.guests || 1) + 1) })}
                        className="absolute right-2 z-10 w-8 h-8 rounded-full bg-white border border-black/10 text-[var(--lagoon-deep)] font-bold hover:bg-[var(--sun)] transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-[var(--ink-soft)]">Type any guest count for larger groups</p>
                    {tourPackage.groupSize && !tourFitsGuestCount(tourPackage.groupSize, bookingData.guests) && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        This package is listed for {tourPackage.groupSize}. Adjust guest count or contact us for a custom quote.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Special Requests</label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                      placeholder="Any special requests or dietary requirements?"
                      rows={3}
                      className="w-full px-3 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] bg-[var(--foam)] text-[var(--ink)]"
                    />
                  </div>
                  <button 
                    onClick={handleBooking}
                    className="w-full bg-[var(--lagoon-deep)] text-white py-3 rounded-full font-bold hover:bg-[var(--lagoon)] transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* Tour Info */}
              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Tour Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-soft)]">Duration:</span>
                    <span className="font-semibold text-sm">{tourPackage.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-soft)]">Group Size:</span>
                    <span className="font-semibold text-sm">{tourPackage.groupSize}</span>
                  </div>
                  {tourPackage.style && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ink-soft)]">Style:</span>
                      <span className="font-semibold px-2 py-1 bg-[var(--sun)]/40 text-[var(--lagoon-deep)] rounded-full text-xs">{tourPackage.style}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-soft)]">Best Time:</span>
                    <span className="font-semibold text-sm">{tourPackage.bestTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--ink-soft)]">Transportation:</span>
                    <span className="font-semibold text-sm">{tourPackage.transportation}</span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="lp-panel p-6">
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">What&apos;s Included</h3>
                <ul className="space-y-2 mb-6">
                  {(tourPackage.inclusions || []).map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                        <CheckCircle className="h-4 w-4 text-green-500" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Not Included</h3>
                <ul className="space-y-2">
                  {(tourPackage.exclusions || []).map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-red-500" aria-hidden>
                        <span className="text-base font-bold leading-none">×</span>
                      </span>
                      <span className="min-w-0 flex-1 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Information */}
              {tourPackage.importantInfo && (
                <div className="lp-panel p-6">
                  <h3 className="lp-section-title text-xl mb-4 text-[var(--ink)]">Important Information</h3>
                  
                  {/* Requirements */}
                  {tourPackage.importantInfo.requirements && tourPackage.importantInfo.requirements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-3 text-[var(--ink)]">Requirements</h4>
                      <div className="space-y-4">
                        {tourPackage.importantInfo.requirements.map((req, index) => (
                          <div key={index} className="border-l-4 border-[var(--lagoon)] pl-4">
                            <h5 className="font-medium text-[var(--ink)] mb-2">{req.activity}</h5>
                            <ul className="space-y-1">
                              {req.requirements.map((requirement, reqIndex) => (
                                <li key={reqIndex} className="text-sm text-[var(--ink-soft)]">
                                  • {requirement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What to Bring */}
                  {tourPackage.importantInfo.whatToBring && tourPackage.importantInfo.whatToBring.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-[var(--ink)]">What to Bring</h4>
                      <ul className="space-y-2">
                        {tourPackage.importantInfo.whatToBring.map((item, index) => (
                          <li key={index} className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                              <CheckCircle className="h-4 w-4 text-green-500" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
