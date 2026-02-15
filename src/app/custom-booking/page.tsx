/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  Calendar
} from 'lucide-react'
import Header from '../../components/Header'
import dynamic from 'next/dynamic'

// Dynamically import MapboxMap to reduce initial bundle size
const MapboxMap = dynamic(() => import('../../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
})

interface CustomTripData {
  destinations: string[]
  dateRange: string
  guests: number
  interests: string[]
}

interface Destination {
  id: string
  name: string
  region: string
  description: string
  image: string
  coordinates: [number, number]
  activities: string[]
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
    selectedTour: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [availableTours, setAvailableTours] = useState<any[]>([])

  // Fetch available tours on component mount
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await fetch('/api/tours')
        const json = await res.json()
        if (json.success) {
          setAvailableTours(json.data || [])
        }
      } catch (error) {
        console.error('Error fetching tours:', error)
      }
    }
    fetchTours()
  }, [])

  // Handle tour selection and auto-set dates
  const handleTourSelection = (tourId: string) => {
    const selectedTour = availableTours.find(tour => tour.id === tourId)
    if (selectedTour) {
      setBookingData(prev => ({
        ...prev,
        selectedTour: tourId
      }))
      
      // Auto-set dates based on tour duration
      if (selectedTour.duration) {
        const durationMatch = selectedTour.duration.match(/(\d+)\s*Days?/)
        if (durationMatch) {
          const days = parseInt(durationMatch[1])
          const startDate = new Date() // Start from current day
          const endDate = new Date()
          endDate.setDate(startDate.getDate() + days) // End date is current date + tour duration days
          
          setBookingData(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }))
        }
      }
    }
  }

  // Handle full name change and trigger date update
  const handleFullNameChange = (value: string) => {
    setBookingData(prev => ({
      ...prev,
      fullName: value
    }))
    
    // If tour is selected and full name is entered, update dates
    if (bookingData.selectedTour && value.trim()) {
      const selectedTour = availableTours.find(tour => tour.id === bookingData.selectedTour)
      if (selectedTour && selectedTour.duration) {
        const durationMatch = selectedTour.duration.match(/(\d+)\s*Days?/)
        if (durationMatch) {
          const days = parseInt(durationMatch[1])
          const startDate = new Date() // Start from current day
          const endDate = new Date()
          endDate.setDate(startDate.getDate() + days) // End date is current date + tour duration days
          
          setBookingData(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }))
        }
      }
    }
  }

  // Handle start date change and update end date
  const handleStartDateChange = (value: string) => {
    setBookingData(prev => ({
      ...prev,
      startDate: value
    }))
    
    // Update end date based on selected tour duration
    if (bookingData.selectedTour && value) {
      const selectedTour = availableTours.find(tour => tour.id === bookingData.selectedTour)
      if (selectedTour && selectedTour.duration) {
        const durationMatch = selectedTour.duration.match(/(\d+)\s*Days?/)
        if (durationMatch) {
          const days = parseInt(durationMatch[1])
          const startDate = new Date(value)
          const endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + days) // End date is start date + tour duration days
          
          setBookingData(prev => ({
            ...prev,
            endDate: endDate.toISOString().split('T')[0]
          }))
        }
      }
    }
  }

  // Available destinations with coordinates
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>([])

  // Default activities for destinations
  const getDefaultActivities = (region: string): string[] => {
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

  useEffect(() => {
    // Fetch destinations from API
    const fetchDestinations = async () => {
      try {
        const response = await fetch('/api/destinations')
        const result = await response.json()
        if (result.success && result.data) {
          // Transform API data to match Destination interface
          const transformedDestinations = result.data.map((dest: any) => ({
            id: dest.id,
            name: dest.name,
            region: dest.region,
            description: dest.description,
            image: dest.image,
            coordinates: [dest.lng, dest.lat], // Note: API has lat/lng, we need lng/lat for coordinates
            activities: getDefaultActivities(dest.region)
          }))
          setAvailableDestinations(transformedDestinations)
        }
      } catch (error) {
        console.error('Error fetching destinations:', error)
        // Fallback to empty array if API fails
        setAvailableDestinations([])
      }
    }

    fetchDestinations()
  }, [])

  useEffect(() => {
    // Get trip data from localStorage
    const storedData = localStorage.getItem('customTripData')
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      setTripData(parsedData)
      // Set initial booking data
      setBookingData(prev => ({
        ...prev,
        guests: parsedData.guests || 1,
        startDate: parsedData.dateRange ? parsedData.dateRange.split(' - ')[0] : '',
        endDate: parsedData.dateRange ? parsedData.dateRange.split(' - ')[1] : ''
      }))
    } else {
      // Redirect to home if no trip data
      router.push('/')
    }
  }, [router])

  const selectedDestinations = tripData?.destinations.map(id => 
    availableDestinations.find(dest => dest.id === id)
  ).filter(Boolean) as Destination[] || []

  // Calculate estimated price based on destinations and duration
  const estimatedPrice = selectedDestinations.length * 150 + (tripData?.guests || 1) * 50

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const selectedTour = availableTours.find(tour => tour.id === bookingData.selectedTour)
      const bookingPayload = {
        tour_package_id: bookingData.selectedTour,
        tour_package_name: selectedTour?.name || 'Custom Trip',
        customer_name: bookingData.fullName,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        guests: bookingData.guests,
        special_requests: bookingData.specialRequests,
        status: 'pending',
        payment_status: 'pending'
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      })

      const result = await response.json()
      
      if (result.success) {
        alert('Tour booking submitted successfully! We will contact you soon to finalize your itinerary.')
        // Reset form
        setBookingData({
          fullName: '',
          email: '',
          phone: '',
          startDate: '',
          endDate: '',
          guests: 1,
          specialRequests: '',
          selectedTour: ''
        })
      } else {
        alert('Error submitting booking. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Error submitting booking. Please try again.')
    }
  }

  const removeDestination = (destinationId: string) => {
    if (tripData) {
      const updatedDestinations = tripData.destinations.filter(id => id !== destinationId)
      const updatedTripData = { ...tripData, destinations: updatedDestinations }
      setTripData(updatedTripData)
      localStorage.setItem('customTripData', JSON.stringify(updatedTripData))
    }
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your custom trip...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">Your Custom Trip</h1>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 px-2">Personalized itinerary based on your preferences and selected destinations</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8 px-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{selectedDestinations.length} Days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{tripData.guests} {tripData.guests === 1 ? 'Person' : 'People'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{selectedDestinations.length} Destinations</span>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-4 sm:mb-6 px-2">From ${estimatedPrice}</div>
              <button 
                onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-yellow-400 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-yellow-300 transition-colors text-base sm:text-lg min-h-[44px] touch-manipulation mx-2 sm:mx-0"
              >
                Book This Custom Trip
              </button>
            </div>
            <div className="relative">
              <Image
                src={selectedDestinations[0]?.image || '/placeholder-image.svg'}
                alt="Custom Trip"
                width={800}
                height={384}
                className="rounded-lg shadow-lg w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tour Details */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Interactive 3D Mapbox Map */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tour Route Map</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Done Editing' : 'Edit Trip'}
                  </button>
                </div>
                <div className="bg-white">
                  {/* Mapbox 3D Interactive Map */}
                  <MapboxMap 
                    destinations={selectedDestinations.map(dest => ({
                      ...dest,
                      lat: dest.coordinates[1],
                      lng: dest.coordinates[0],
                    }))}
                    tourName="Custom Trip"
                  />
                  
                  {/* Map Legend */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Tour Destinations</h4>
                      <div className="space-y-2">
                        {selectedDestinations.map((dest, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{dest.name}</span>
                            <span className="text-xs text-gray-500">({dest.region})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Map Features</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Tour Destinations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Tour Route</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Navigation className="w-3 h-3 text-green-600" />
                          <span className="text-sm text-gray-700">Interactive Navigation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Destination Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {selectedDestinations.map((dest, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-green-50">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{dest.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{dest.region}</p>
                        <div className="text-xs text-gray-500">
                          Coordinates: {dest.coordinates[1].toFixed(4)}, {dest.coordinates[0].toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Itinerary */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Detailed Itinerary</h2>
                <div className="space-y-6">
                  {selectedDestinations.map((destination, index) => (
                    <div key={destination.id} className="bg-white">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
                          <p className="text-gray-600">{destination.region}</p>
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => removeDestination(destination.id)}
                            className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600">{destination.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">Activities</h4>
                          <ul className="space-y-1">
                            {destination.activities.map((activity, idx) => (
                              <li key={idx} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Highlights</h4>
                          <ul className="space-y-1">
                            <li className="text-sm text-gray-600">• Cultural exploration</li>
                            <li className="text-sm text-gray-600">• Local experiences</li>
                            <li className="text-sm text-gray-600">• Professional guide</li>
                            <li className="text-sm text-gray-600">• Comfortable accommodation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trip Interests */}
              {tripData.interests.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Interests</h2>
                  <div className="bg-white">
                    <p className="text-gray-600">We&apos;ll tailor activities based on your preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {tripData.interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Destination Gallery</h2>
                <div className="grid grid-cols-3 gap-4">
                  {selectedDestinations.slice(0, 6).map((destination, index) => (
                    <Image
                      key={index}
                      src={destination.image || '/placeholder-image.svg'}
                      alt={`${destination.name} - Image ${index + 1}`}
                      width={200}
                      height={150}
                      className={`rounded-lg cursor-pointer transition-all ${
                        selectedImage === index ? 'ring-4 ring-blue-500' : 'hover:opacity-80'
                      }`}
                      onClick={() => setSelectedImage(index)}
                      loading={index < 3 ? "eager" : "lazy"}
                      unoptimized={!!destination.image}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-6 lg:h-fit lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto space-y-6">
              {/* Quick Booking */}
              <div id="booking-form" className="bg-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Quick Booking</h3>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Tour Package</label>
                    <select
                      value={bookingData.selectedTour}
                      onChange={(e) => handleTourSelection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300"
                      required
                    >
                      <option value="">Choose a tour package...</option>
                      {availableTours.map((tour) => (
                        <option key={tour.id} value={tour.id}>
                          {tour.name} - {tour.duration}
                        </option>
                      ))}
                    </select>
                    {bookingData.selectedTour && (
                      <div className="mt-2 p-3 bg-blue-50">
                        <p className="text-sm text-blue-800">
                          <strong>Selected:</strong> {availableTours.find(t => t.id === bookingData.selectedTour)?.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Duration: {availableTours.find(t => t.id === bookingData.selectedTour)?.duration}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={bookingData.fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tour Start Date</label>
                    <div className="relative">
                    <input
                      type="date"
                      value={bookingData.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300"
                      min={new Date().toISOString().split('T')[0]}
                      required
                        placeholder="Select start date"
                    />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tour End Date</label>
                    <div className="relative">
                    <input
                      type="date"
                      value={bookingData.endDate}
                      onChange={(e) => setBookingData({...bookingData, endDate: e.target.value})}
                        className="w-full px-3 py-2 pr-10 border border-gray-300"
                      min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                      required
                        placeholder="Select end date"
                    />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                    <input
                      type="number"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300"
                      placeholder="Any special requirements or preferences..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Book Custom Trip
                  </button>
                </form>
              </div>

              {/* Tour Information */}
              <div className="bg-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Tour Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium text-gray-900">{selectedDestinations.length} Days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Group Size</p>
                      <p className="font-medium text-gray-900">Custom</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Destinations</p>
                      <p className="font-medium text-gray-900">{selectedDestinations.length} Locations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">What&apos;s Included</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Professional English-speaking guide
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    All accommodation
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Daily breakfast
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Air-conditioned vehicle
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Airport transfers
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Bottled water
                  </li>
                </ul>
              </div>

              {/* Not Included */}
              <div className="bg-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Not Included</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    International flights
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    Personal expenses
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    Tips for guides
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    Travel insurance
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <X className="w-4 h-4 text-red-500 mr-2" />
                    Optional activities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
