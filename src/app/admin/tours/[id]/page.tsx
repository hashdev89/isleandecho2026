'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Save,
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  Map,
  X
} from 'lucide-react'
import MapboxMap from '../../../../components/MapboxMap'
import DestinationSelector from '../../../../components/DestinationSelector'
import DestinationManager from '../../../../components/DestinationManager'
import ImageSelector from '../../../../components/ImageSelector'
import { dataSync, TourData } from '../../../../lib/dataSync'

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

interface TourPackage {
  id: string
  name: string
  duration: string
  price: string
  style: string
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
  images: string[]
  status: 'active' | 'draft' | 'archived'
  featured?: boolean
}

interface Destination {
  name: string
  lat: number
  lng: number
  region: string
}

export default function TourEditor() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string
  const isNew = tourId === 'new'
  const [isLoading, setIsLoading] = useState(true)

  const [tour, setTour] = useState<TourPackage>({
    id: '',
    name: '',
    duration: '',
    price: '',
    style: '',
    destinations: [],
    highlights: [],
    keyExperiences: [],
    description: '',
    itinerary: [],
    inclusions: [],
    exclusions: [],
    accommodation: [],
    transportation: '',
    groupSize: '',
    bestTime: '',
    images: [],
    status: 'draft',
    featured: false
  })

  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>([])

  // Fetch destinations from API
  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations')
      if (!response.ok) {
        console.error('Failed to fetch destinations - HTTP error:', response.status)
        setAvailableDestinations([])
        return
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Failed to fetch destinations - non-JSON response:', text.substring(0, 200))
        setAvailableDestinations([])
        return
      }
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        // Map API data to Destination format
        const mappedDestinations = result.data.map((dest: unknown) => {
          const d = dest as Record<string, unknown>
          return {
            name: (d.name as string) || 'Unknown',
            lat: (d.lat as number) || 0,
            lng: (d.lng as number) || 0,
            region: (d.region as string) || 'Unknown'
          }
        })
        setAvailableDestinations(mappedDestinations)
        console.log('Destinations fetched:', mappedDestinations.length)
      } else {
        console.error('Invalid destinations data received:', result)
        setAvailableDestinations([])
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
      setAvailableDestinations([])
    }
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  const [newInclusion, setNewInclusion] = useState('')
  const [newExclusion, setNewExclusion] = useState('')
  const [newAccommodation, setNewAccommodation] = useState('')
  const [newKeyExperience, setNewKeyExperience] = useState('')
  const [newWhatToBring, setNewWhatToBring] = useState('')
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  const [showDestinationManager, setShowDestinationManager] = useState(false)
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [tourImageSelectorOpen, setTourImageSelectorOpen] = useState(false)
  const [selectedTourImageIndex, setSelectedTourImageIndex] = useState<number | null>(null)

  // Handler to open selector and refresh destinations
  const handleOpenDestinationSelector = () => {
    fetchDestinations()
    setShowDestinationSelector(true)
  }

  // Get map coordinates for selected destinations
  const tourDestinations = (tour.destinations || []).map(destName => {
    const dest = availableDestinations.find(d => d.name === destName)
    if (!dest) {
      console.warn('Destination not found in availableDestinations:', destName)
    }
    return dest || null
  }).filter(Boolean) as Destination[]

  // Debug logging
  useEffect(() => {
    console.log('Tour destinations updated:', tour.destinations)
    console.log('Available destinations count:', availableDestinations.length)
    const mapped = (tour.destinations || []).map(destName => {
      const dest = availableDestinations.find(d => d.name === destName)
      return dest || null
    }).filter(Boolean) as Destination[]
    console.log('Mapped tour destinations count:', mapped.length)
  }, [tour.destinations, availableDestinations])

  useEffect(() => {
    const load = async () => {
      if (isNew) {
        setIsLoading(false)
        return
      }
      
      if (!isNew) {
        try {
          console.log('========== LOADING TOUR ==========')
          console.log('Fetching tours for tourId:', tourId)
          // Always force refresh to get latest data from server (bypass all caches)
          const all = await dataSync.fetchTours(true)
          console.log('All tours fetched:', all?.length || 0, 'tours')
          console.log('All tours:', all)
          
          if (!Array.isArray(all)) {
            console.error('Invalid tours data received:', all)
            return
          }
          
          const found = all.find(t => t.id === tourId)
          if (found) {
            console.log('Found tour data:', found)
            console.log('Tour destinations:', found.destinations)
            console.log('Tour itinerary:', found.itinerary)
            if (found.itinerary && found.itinerary.length > 0) {
              console.log('First day of itinerary:', found.itinerary[0])
              console.log('First day overnightStay:', found.itinerary[0]?.overnightStay)
            }
            // Ensure importantInfo has the correct structure
            // Ensure itinerary preserves ALL days and ALL fields - handle null/undefined/empty objects
            const rawItinerary = Array.isArray(found.itinerary) ? found.itinerary : []
            const normalizedItinerary = rawItinerary
              .filter(day => day !== null && day !== undefined) // Remove null/undefined entries
              .map((day: any, index: number) => {
                  // Handle empty objects or malformed day data
                  if (!day || typeof day !== 'object') {
                    console.warn(`Invalid day object at index ${index}:`, day)
                    return {
                      day: index + 1,
                      title: '',
                      description: '',
                      activities: [],
                      accommodation: '',
                      meals: [],
                      transportation: '',
                      travelTime: '',
                      overnightStay: '',
                      image: ''
                    }
                  }
                  
                  // Ensure day number is set correctly (use index + 1 if day.day is missing or 0)
                  const dayNumber = (day.day && day.day > 0) ? day.day : (index + 1)
                  return {
                    day: dayNumber,
                    title: day.title || '',
                    description: day.description || '',
                    activities: Array.isArray(day.activities) ? day.activities : [],
                    accommodation: day.accommodation || '',
                    meals: Array.isArray(day.meals) ? day.meals : [],
                    transportation: day.transportation || '',
                    travelTime: day.travelTime || '',
                    overnightStay: day.overnightStay || '',
                    image: day.image || ''
                  }
                })
            
            console.log('Raw itinerary from API:', JSON.stringify(rawItinerary, null, 2))
            console.log('Raw itinerary count:', rawItinerary.length)
            console.log('Normalized itinerary when loading:', JSON.stringify(normalizedItinerary, null, 2))
            console.log('Normalized itinerary count when loading:', normalizedItinerary.length)
            console.log('Each day when loading:', normalizedItinerary.map((d, i) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
            
            // Warn if days were lost during normalization
            if (normalizedItinerary.length < rawItinerary.length) {
              console.warn(`WARNING: Lost ${rawItinerary.length - normalizedItinerary.length} days during normalization!`)
            }
            const importantInfo = (found.importantInfo ?? (found as { important_info?: Record<string, unknown> }).important_info) as { requirements?: { activity: string; requirements: string[] }[]; whatToBring?: string[]; groupSize?: string; bestTime?: string } | undefined
            const groupSizeStr = String(found.groupSize ?? importantInfo?.groupSize ?? '').trim()
            const bestTimeStr = String(found.bestTime ?? importantInfo?.bestTime ?? '').trim()
            const normalizedTour = {
              ...found,
              name: found.name || '',
              duration: found.duration || '',
              price: found.price || '',
              style: found.style || '',
              description: found.description || '',
              transportation: found.transportation || '',
              groupSize: groupSizeStr,
              bestTime: bestTimeStr,
              status: found.status || 'draft',
              itinerary: normalizedItinerary,
              images: Array.isArray(found.images) ? found.images : [], // Ensure images array is always present
              importantInfo: {
                requirements: Array.isArray(importantInfo?.requirements)
                  ? importantInfo.requirements.map((req: any) => ({
                      activity: req.activity || '',
                      requirements: Array.isArray(req.requirements) ? req.requirements : []
                    }))
                  : [],
                whatToBring: Array.isArray(importantInfo?.whatToBring) ? importantInfo.whatToBring : []
              }
            }
            console.log('Normalized tour itinerary:', normalizedTour.itinerary)
            console.log('Normalized tour images:', normalizedTour.images)
            console.log('Normalized tour images count:', normalizedTour.images?.length || 0)
            setTour(normalizedTour as TourPackage)
          } else {
            console.log('Tour not found with ID:', tourId)
            // Set a default tour structure to prevent crashes
            setTour({
              id: tourId,
              name: 'New Tour',
              duration: '',
              price: '',
              style: '',
              destinations: [],
              highlights: [],
              keyExperiences: [],
              description: '',
              itinerary: [],
              inclusions: [],
              exclusions: [],
              importantInfo: {
                requirements: [],
                whatToBring: []
              },
              accommodation: [],
              transportation: '',
              groupSize: '',
              bestTime: '',
              images: [],
              featured: false,
              status: 'draft'
            })
          }
          setIsLoading(false)
        } catch (error) {
          console.error('Error loading tour:', error)
          // Set a default tour structure to prevent crashes
          setTour({
            id: tourId,
            name: 'New Tour',
            duration: '',
            price: '',
            style: '',
            destinations: [],
            highlights: [],
            keyExperiences: [],
            description: '',
            itinerary: [],
            inclusions: [],
            exclusions: [],
            importantInfo: {
              requirements: [],
              whatToBring: []
            },
            accommodation: [],
            transportation: '',
            groupSize: '',
            bestTime: '',
            images: [],
            featured: false,
            status: 'draft'
          })
          setIsLoading(false)
        }
      }
    }
    load()
  }, [isNew, tourId])

  // Force re-render when availableDestinations changes
  useEffect(() => {
    console.log('Available destinations updated:', availableDestinations)
  }, [availableDestinations])

  // Force re-render when tour destinations change
  useEffect(() => {
    console.log('Tour destinations updated:', tour.destinations)
  }, [tour.destinations])

  const handleSave = async (saveAsDraft = false) => {
    try {
      // Client-side validation for required fields
      if (!tour.name?.trim()) {
        alert('Please enter a tour name')
        return
      }
      if (!tour.duration?.trim()) {
        alert('Please enter a duration')
        return
      }

      // Ensure itinerary includes ALL days and ALL fields - don't filter anything out
      const currentItinerary = tour.itinerary || []
      console.log('Current itinerary before normalization:', JSON.stringify(currentItinerary, null, 2))
      console.log('Current itinerary count:', currentItinerary.length)
      
      // Ensure we preserve ALL days, even if they're empty or undefined
      const normalizedItinerary = currentItinerary
        .filter(day => day !== null && day !== undefined) // Remove null/undefined entries
        .map((day, index) => {
          // Ensure day number is set correctly (use index + 1 if day.day is missing or 0)
          const dayNumber = (day && typeof day === 'object' && day.day && day.day > 0) ? day.day : (index + 1)
          return {
            day: dayNumber,
            title: (day && day.title) ? String(day.title) : '',
            description: (day && day.description) ? String(day.description) : '',
            activities: Array.isArray(day?.activities) ? day.activities : [],
            accommodation: (day && day.accommodation) ? String(day.accommodation) : '',
            meals: Array.isArray(day?.meals) ? day.meals : [],
            transportation: (day && day.transportation) ? String(day.transportation) : '',
            travelTime: (day && day.travelTime) ? String(day.travelTime) : '',
            overnightStay: (day && day.overnightStay) ? String(day.overnightStay) : '',
            image: (day && day.image) ? String(day.image) : ''
          }
        })
      
      // Ensure we have at least the days that were in the current itinerary
      if (normalizedItinerary.length !== currentItinerary.length) {
        console.warn(`WARNING: Itinerary count mismatch! Current: ${currentItinerary.length}, Normalized: ${normalizedItinerary.length}`)
      }
      
      console.log('Normalized itinerary before save:', JSON.stringify(normalizedItinerary, null, 2))
      console.log('Normalized itinerary count:', normalizedItinerary.length)
      console.log('Each day in normalized itinerary:', normalizedItinerary.map((d, i) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
      
      const payload = { 
        ...tour,
        id: isNew ? tour.id : tourId, // Use route id for updates so backend always finds the record
        itinerary: normalizedItinerary,
        images: Array.isArray(tour.images) ? tour.images : [], // Ensure images array is always present
        // Ensure groupSize and bestTime are always sent (API persists them in important_info)
        groupSize: tour.groupSize ?? '',
        bestTime: tour.bestTime ?? '',
        importantInfo: {
          ...(tour.importantInfo || { requirements: [], whatToBring: [] }),
          groupSize: tour.groupSize ?? '',
          bestTime: tour.bestTime ?? ''
        }
      }
      // Set status based on save type
      if (saveAsDraft) {
        payload.status = 'draft'
      } else {
        payload.status = 'active'
      }
      
      // Debug: Log itinerary and images to verify they're included
      console.log('Full tour payload before processing:', payload)
      console.log('Tour images in payload:', payload.images)
      console.log('Tour images count:', payload.images?.length || 0)
      console.log('Itinerary data:', JSON.stringify(payload.itinerary, null, 2))
      if (payload.itinerary && payload.itinerary.length > 0) {
        console.log('First day itinerary:', payload.itinerary[0])
        console.log('First day overnightStay:', payload.itinerary[0]?.overnightStay)
        // Verify overnightStay is actually in the object
        console.log('First day has overnightStay key:', 'overnightStay' in payload.itinerary[0])
        console.log('First day keys:', Object.keys(payload.itinerary[0]))
      }
      
      if (isNew) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...createData } = payload as Record<string, unknown>
        console.log('Creating tour with data:', createData)
        console.log('Required fields check:', {
          name: createData.name,
          duration: createData.duration,
          price: createData.price,
          status: createData.status
        })
        
        try {
          console.log('Sending createData to API:', JSON.stringify(createData, null, 2))
          console.log('Itinerary in createData:', createData.itinerary)
          if (createData.itinerary && Array.isArray(createData.itinerary) && createData.itinerary.length > 0) {
            console.log('First day in createData:', createData.itinerary[0])
            console.log('First day overnightStay in createData:', createData.itinerary[0]?.overnightStay)
          }
          const created = await dataSync.createTour(createData as Omit<TourPackage, 'id'>)
          if (created) {
            console.log('Tour created successfully:', created)
            console.log('Created tour itinerary:', created.itinerary)
            if (created.itinerary && created.itinerary.length > 0) {
              console.log('First day in created tour:', created.itinerary[0])
              console.log('First day overnightStay in created tour:', created.itinerary[0]?.overnightStay)
            }
            alert(saveAsDraft ? 'Tour saved as draft successfully!' : 'Tour created successfully!')
            router.push('/admin/tours')
          } else {
            console.error('Failed to create tour - dataSync returned null')
            alert('Failed to create tour. Please check the console for errors.')
            return // Don't navigate away on error
          }
        } catch (error) {
          console.error('Error creating tour:', error)
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred'
          alert(`Failed to create tour: ${errorMessage}`)
          return // Don't navigate away on error
        }
      } else {
        try {
          console.log('Sending payload to API for update:', JSON.stringify(payload, null, 2))
          console.log('Itinerary in payload:', payload.itinerary)
          if (payload.itinerary && Array.isArray(payload.itinerary) && payload.itinerary.length > 0) {
            console.log('First day in payload:', payload.itinerary[0])
            console.log('First day overnightStay in payload:', payload.itinerary[0]?.overnightStay)
          }
          console.log('========== SAVING TOUR ==========')
          console.log('Tour ID:', tourId)
          console.log('Payload being sent:', JSON.stringify(payload, null, 2))
          console.log('Payload itinerary count:', payload.itinerary?.length || 0)
          
          const updated = await dataSync.updateTour(payload as TourData)
          
          if (updated) {
            console.log('========== TOUR UPDATE SUCCESS ==========')
            console.log('Updated tour received from API:', updated)
            console.log('Updated tour ID:', updated.id)
            console.log('Updated tour name:', updated.name)
            console.log('Updated tour itinerary:', updated.itinerary)
            console.log('Updated tour itinerary count:', updated.itinerary?.length || 0)
            
            if (updated.itinerary && updated.itinerary.length > 0) {
              console.log('First day in updated tour:', updated.itinerary[0])
              console.log('First day overnightStay in updated tour:', updated.itinerary[0]?.overnightStay)
              console.log('First day activities in updated tour:', updated.itinerary[0]?.activities)
              console.log('First day meals in updated tour:', updated.itinerary[0]?.meals)
              console.log('First day image in updated tour:', updated.itinerary[0]?.image)
            }
            console.log('Updated tour images:', updated.images)
            console.log('Updated tour images count:', updated.images?.length || 0)
            
            // Verify the saved data matches what we sent
            const itineraryMatch = JSON.stringify(payload.itinerary) === JSON.stringify(updated.itinerary)
            const imagesMatch = JSON.stringify(payload.images) === JSON.stringify(updated.images)
            console.log('Itinerary matches saved data:', itineraryMatch)
            console.log('Images match saved data:', imagesMatch)
            
            if (!itineraryMatch) {
              console.warn('WARNING: Saved itinerary does not match sent itinerary!')
              console.warn('Sent itinerary:', JSON.stringify(payload.itinerary, null, 2))
              console.warn('Received itinerary:', JSON.stringify(updated.itinerary, null, 2))
            }
            
            // Normalize the updated tour data - preserve ALL days
            const normalizedItinerary = Array.isArray(updated.itinerary) 
              ? updated.itinerary.map((day: any, index: number) => {
                  // Ensure day number is set correctly (use index + 1 if day.day is missing or 0)
                  const dayNumber = day.day && day.day > 0 ? day.day : (index + 1)
                  return {
                    day: dayNumber,
                    title: day.title || '',
                    description: day.description || '',
                    activities: Array.isArray(day.activities) ? day.activities : [],
                    accommodation: day.accommodation || '',
                    meals: Array.isArray(day.meals) ? day.meals : [],
                    transportation: day.transportation || '',
                    travelTime: day.travelTime || '',
                    overnightStay: day.overnightStay || '',
                    image: day.image || ''
                  }
                })
              : []
            
            console.log('Normalized itinerary after update:', JSON.stringify(normalizedItinerary, null, 2))
            console.log('Normalized itinerary count after update:', normalizedItinerary.length)
            console.log('Each day after update:', normalizedItinerary.map((d, i) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
            
            const updatedImportant = updated.importantInfo as { requirements?: { activity: string; requirements: string[] }[]; whatToBring?: string[]; groupSize?: string; bestTime?: string } | undefined
            const normalizedUpdatedTour = {
              ...updated,
              name: updated.name || '',
              duration: updated.duration || '',
              price: updated.price || '',
              style: updated.style || '',
              description: updated.description || '',
              transportation: updated.transportation || '',
              groupSize: (updated.groupSize ?? updatedImportant?.groupSize ?? '') || '',
              bestTime: (updated.bestTime ?? updatedImportant?.bestTime ?? '') || '',
              status: updated.status || 'draft',
              itinerary: normalizedItinerary,
              images: Array.isArray(updated.images) ? updated.images : [],
              importantInfo: {
                requirements: Array.isArray(updatedImportant?.requirements)
                  ? updatedImportant.requirements.map((req: any) => ({
                      activity: req.activity || '',
                      requirements: Array.isArray(req.requirements) ? req.requirements : []
                    }))
                  : [],
                whatToBring: Array.isArray(updatedImportant?.whatToBring) ? updatedImportant.whatToBring : []
              }
            }
            
            // Update the tour state with the normalized data
            setTour(normalizedUpdatedTour as TourPackage)
            console.log('Tour state updated with normalized data')
            console.log('Tour itinerary after state update:', normalizedUpdatedTour.itinerary)
            console.log('Tour images after state update:', normalizedUpdatedTour.images)
            
            // Save was successful - update state and show success message
            console.log('========== SAVE SUCCESSFUL ==========')
            console.log('Tour has been saved to the database.')
            console.log('Itinerary count saved:', normalizedItinerary.length)
            console.log('Images count saved:', normalizedUpdatedTour.images?.length || 0)
            
            // Show success message
            alert(saveAsDraft ? 'Tour saved as draft successfully!' : 'Tour updated successfully!')
            
            // Optionally verify the save in the background (non-blocking)
            setTimeout(async () => {
              try {
                console.log('Verifying save in background...')
                const allTours = await dataSync.fetchTours(true) // Force refresh
                const reloadedTour = allTours.find((t: any) => t.id === tourId)
                if (reloadedTour) {
                  const reloadedCount = Array.isArray(reloadedTour.itinerary) ? reloadedTour.itinerary.length : 0
                  const savedCount = normalizedItinerary.length
                  if (reloadedCount === savedCount) {
                    console.log('✓ Verification: Itinerary count matches - save confirmed!')
                  } else {
                    console.warn('⚠ Verification: Itinerary count mismatch - saved:', savedCount, 'reloaded:', reloadedCount)
                  }
                }
              } catch (verifyError) {
                console.warn('Verification check failed (non-critical):', verifyError)
              }
            }, 1000)
            // Don't redirect - stay on the page so user can see the updated data
          } else {
            console.error('========== TOUR UPDATE FAILED ==========')
            console.error('Failed to update tour - returned null')
            console.error('This usually means the API returned an error or the response was invalid')
            alert('Failed to update tour. Please check the console for errors.')
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error')
          console.error('[Tour editor] Update failed:', msg)
          alert(`Failed to update tour: ${msg}`)
          return
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error')
      console.error('[Tour editor] Save failed:', msg)
      alert(`Error saving tour: ${msg}`)
    }
  }

  const handleSaveDraft = async () => {
    await handleSave(true)
  }

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setTour({ ...tour, inclusions: [...tour.inclusions, newInclusion.trim()] })
      setNewInclusion('')
    }
  }

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setTour({ ...tour, exclusions: [...tour.exclusions, newExclusion.trim()] })
      setNewExclusion('')
    }
  }

  const addAccommodation = () => {
    if (newAccommodation.trim()) {
      setTour({ ...tour, accommodation: [...tour.accommodation, newAccommodation.trim()] })
      setNewAccommodation('')
    }
  }

  const addKeyExperience = () => {
    if (newKeyExperience.trim()) {
      setTour({ ...tour, keyExperiences: [...(tour.keyExperiences || []), newKeyExperience.trim()] })
      setNewKeyExperience('')
    }
  }

  const handleTourImageSelect = (imageUrl: string) => {
    console.log('Tour image selected:', imageUrl)
    console.log('Current tour images:', tour.images)
    console.log('Selected index:', selectedTourImageIndex)
    
    if (selectedTourImageIndex !== null) {
      // Replace existing image
      const newImages = [...(tour.images || [])]
      newImages[selectedTourImageIndex] = imageUrl
      console.log('Replacing image at index', selectedTourImageIndex, 'New images:', newImages)
      setTour({ ...tour, images: newImages })
    } else {
      // Add new image
      const currentImages = tour.images || []
      const newImages = [...currentImages, imageUrl]
      console.log('Adding new image. Current images:', currentImages, 'New images:', newImages)
      setTour({ ...tour, images: newImages })
    }
    setTourImageSelectorOpen(false)
    setSelectedTourImageIndex(null)
  }

  const removeItem = (list: string[], index: number, field: keyof TourPackage) => {
    const newList = list.filter((_, i) => i !== index)
    setTour({ ...tour, [field]: newList })
  }

  const toggleDestination = (destinationName: string) => {
    const currentDestinations = tour.destinations || []
    const newDestinations = currentDestinations.includes(destinationName)
      ? currentDestinations.filter(d => d !== destinationName)
      : [...currentDestinations, destinationName]
    setTour({ ...tour, destinations: newDestinations })
  }

  const handleDestinationSelect = (destinationName: string) => {
    const currentDestinations = tour.destinations || []
    if (!currentDestinations.includes(destinationName)) {
      const newDestinations = [...currentDestinations, destinationName]
      setTour({ ...tour, destinations: newDestinations })
      console.log('Destination selected:', destinationName, 'New destinations:', newDestinations)
    }
  }

  const handleDestinationDeselect = (destinationName: string) => {
    const currentDestinations = tour.destinations || []
    const newDestinations = currentDestinations.filter(d => d !== destinationName)
    setTour({ ...tour, destinations: newDestinations })
    console.log('Destination deselected:', destinationName, 'New destinations:', newDestinations)
  }

  const handleDestinationAdded = async () => {
    // Refresh the destination selector when a new destination is added
    setShowDestinationSelector(false)
    setShowDestinationManager(false)
    
    // Refetch destinations from API
    await fetchDestinations()
  }

  // Itinerary management functions
  const addDay = () => {
    const currentItinerary = tour.itinerary || []
    const newDay: Day = {
      day: currentItinerary.length + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: '',
      meals: [],
      transportation: '',
      travelTime: '',
      overnightStay: '',
      image: ''
    }
    const newItinerary = [...currentItinerary, newDay]
    console.log('Adding new day. Current itinerary length:', currentItinerary.length, 'New length:', newItinerary.length)
    console.log('New day object:', newDay)
    console.log('Full itinerary after adding:', newItinerary)
    setTour({ ...tour, itinerary: newItinerary })
  }

  const removeDay = (dayIndex: number) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = currentItinerary.filter((_, index) => index !== dayIndex)
    // Renumber days
    const renumberedItinerary = newItinerary.map((day, index) => ({
      ...day,
      day: index + 1
    }))
    setTour({ ...tour, itinerary: renumberedItinerary })
  }

  const updateDay = (dayIndex: number, field: keyof Day, value: string) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    // Ensure all day fields are preserved, including overnightStay and image
    const currentDay = newItinerary[dayIndex] || {
      day: dayIndex + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: '',
      meals: [],
      transportation: '',
      travelTime: '',
      overnightStay: '',
      image: ''
    }
    const updatedDay = { 
      ...currentDay, 
      [field]: value,
      // Explicitly ensure overnightStay is always included
      overnightStay: field === 'overnightStay' ? value : (currentDay.overnightStay || ''),
      // Explicitly ensure image is always included
      image: field === 'image' ? value : (currentDay.image || '')
    }
    newItinerary[dayIndex] = updatedDay
    console.log(`Updating day ${dayIndex}, field: ${field}, value:`, value)
    console.log('Updated day object:', updatedDay)
    console.log('Updated day overnightStay:', updatedDay.overnightStay)
    console.log('Updated day image:', updatedDay.image)
    setTour({ ...tour, itinerary: newItinerary })
  }

  const addDayActivity = (dayIndex: number) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    const currentDay = newItinerary[dayIndex] || {
      day: dayIndex + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: '',
      meals: [],
      transportation: '',
      travelTime: '',
      overnightStay: '',
      image: ''
    }
    if (!currentDay.activities) {
      currentDay.activities = []
    }
    currentDay.activities.push('')
    newItinerary[dayIndex] = { ...currentDay }
    console.log('Added activity to day', dayIndex, 'Activities:', currentDay.activities)
    setTour({ ...tour, itinerary: newItinerary })
  }

  const removeDayActivity = (dayIndex: number, activityIndex: number) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    if (newItinerary[dayIndex].activities) {
      newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, index) => index !== activityIndex)
    }
    setTour({ ...tour, itinerary: newItinerary })
  }

  const updateDayActivity = (dayIndex: number, activityIndex: number, value: string) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    const currentDay = newItinerary[dayIndex] || {
      day: dayIndex + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: '',
      meals: [],
      transportation: '',
      travelTime: '',
      overnightStay: '',
      image: ''
    }
    if (!currentDay.activities) {
      currentDay.activities = []
    }
    currentDay.activities[activityIndex] = value
    newItinerary[dayIndex] = { ...currentDay }
    console.log('Updated activity', activityIndex, 'for day', dayIndex, 'Value:', value, 'All activities:', currentDay.activities)
    setTour({ ...tour, itinerary: newItinerary })
  }

  const addDayMeal = (dayIndex: number) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    const currentDay = newItinerary[dayIndex] || {
      day: dayIndex + 1,
      title: '',
      description: '',
      activities: [],
      accommodation: '',
      meals: [],
      transportation: '',
      travelTime: '',
      overnightStay: '',
      image: ''
    }
    if (!currentDay.meals) {
      currentDay.meals = []
    }
    currentDay.meals.push('')
    newItinerary[dayIndex] = { ...currentDay }
    console.log('Added meal to day', dayIndex, 'Meals:', currentDay.meals)
    setTour({ ...tour, itinerary: newItinerary })
  }

  const removeDayMeal = (dayIndex: number, mealIndex: number) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    if (newItinerary[dayIndex].meals) {
      newItinerary[dayIndex].meals = newItinerary[dayIndex].meals.filter((_, index) => index !== mealIndex)
    }
    setTour({ ...tour, itinerary: newItinerary })
  }

  const updateDayMeal = (dayIndex: number, mealIndex: number, value: string) => {
    const currentItinerary = tour.itinerary || []
    const newItinerary = [...currentItinerary]
    if (newItinerary[dayIndex].meals) {
      newItinerary[dayIndex].meals[mealIndex] = value
    }
    setTour({ ...tour, itinerary: newItinerary })
  }

  // Important Information management functions
  const addRequirement = () => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirement = {
      activity: '',
      requirements: ['']
    }
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: [...(currentImportantInfo.requirements || []), newRequirement]
      }
    })
  }

  const removeRequirement = (reqIndex: number) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirements = (currentImportantInfo.requirements || []).filter((_, index) => index !== reqIndex)
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: newRequirements
      }
    })
  }

  const addRequirementItem = (reqIndex: number) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirements = [...(currentImportantInfo.requirements || [])]
    if (newRequirements[reqIndex]) {
      if (!newRequirements[reqIndex].requirements) {
        newRequirements[reqIndex].requirements = []
      }
      newRequirements[reqIndex].requirements.push('')
    }
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: newRequirements
      }
    })
  }

  const removeRequirementItem = (reqIndex: number, requirementIndex: number) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirements = [...(currentImportantInfo.requirements || [])]
    if (newRequirements[reqIndex] && newRequirements[reqIndex].requirements) {
      newRequirements[reqIndex].requirements = newRequirements[reqIndex].requirements.filter((_, index) => index !== requirementIndex)
    }
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: newRequirements
      }
    })
  }

  const updateRequirement = (reqIndex: number, requirementIndex: number, value: string) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirements = [...(currentImportantInfo.requirements || [])]
    if (newRequirements[reqIndex] && newRequirements[reqIndex].requirements && newRequirements[reqIndex].requirements[requirementIndex] !== undefined) {
      newRequirements[reqIndex].requirements[requirementIndex] = value
    }
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: newRequirements
      }
    })
  }

  const updateRequirementActivity = (reqIndex: number, value: string) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newRequirements = [...(currentImportantInfo.requirements || [])]
    if (newRequirements[reqIndex]) {
      newRequirements[reqIndex].activity = value
    }
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        requirements: newRequirements
      }
    })
  }

  const addWhatToBring = () => {
    if (newWhatToBring.trim()) {
      const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
      setTour({
        ...tour,
        importantInfo: {
          ...currentImportantInfo,
          whatToBring: [...(currentImportantInfo.whatToBring || []), newWhatToBring.trim()]
        }
      })
      setNewWhatToBring('')
    }
  }

  const removeWhatToBring = (index: number) => {
    const currentImportantInfo = tour.importantInfo || { requirements: [], whatToBring: [] }
    const newWhatToBring = (currentImportantInfo.whatToBring || []).filter((_, i) => i !== index)
    setTour({
      ...tour,
      importantInfo: {
        ...currentImportantInfo,
        whatToBring: newWhatToBring
      }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Tour Editor</h2>
          <p className="text-gray-600">Please wait while we load the tour data...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/tours"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Create New Tour' : 'Edit Tour Package'}
            </h1>
            <p className="text-gray-600">
              {isNew ? 'Add a new tour package to your website' : 'Update tour package details'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              handleSaveDraft()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              handleSave(false)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Save & Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tour.name ?? ''}
                  onChange={(e) => setTour({ ...tour, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tour name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tour.duration ?? ''}
                  onChange={(e) => setTour({ ...tour, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5 Days / 4 Nights"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tour.price || ''}
                  onChange={(e) => setTour({ ...tour, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., $899"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                <select
                  value={tour.style ?? ''}
                  onChange={(e) => setTour({ ...tour, style: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select style</option>
                  <option value="Fun & Adventure">Fun & Adventure</option>
                  <option value="Cultural & Heritage">Cultural & Heritage</option>
                  <option value="Nature & Wildlife">Nature & Wildlife</option>
                  <option value="Relaxation & Wellness">Relaxation & Wellness</option>
                  <option value="Family Friendly">Family Friendly</option>
                  <option value="Luxury Experience">Luxury Experience</option>
                  <option value="Budget Travel">Budget Travel</option>
                  <option value="Romantic Getaway">Romantic Getaway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group Size</label>
                <input
                  type="text"
                  value={tour.groupSize || ''}
                  onChange={(e) => setTour({ ...tour, groupSize: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2-12 people"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Best Time</label>
                <input
                  type="text"
                  value={tour.bestTime ?? ''}
                  onChange={(e) => setTour({ ...tour, bestTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., January to April"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={tour.description ?? ''}
                onChange={(e) => setTour({ ...tour, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tour description"
              />
            </div>
          </div>

          {/* Destinations & Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Destinations & Route</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleOpenDestinationSelector}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Select Destinations
                </button>
                <button
                  type="button"
                  onClick={() => setShowDestinationManager(true)}
                  className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Destinations</label>
                {(tour.destinations && tour.destinations.length > 0) ? (
                  <div 
                    key={`destinations-${tour.destinations.join(',')}`}
                    className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3"
                  >
                    {tour.destinations.map((destName, index) => {
                      const dest = availableDestinations.find(d => d.name === destName)
                      return (
                        <div key={`${destName}-${index}`} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{destName}</span>
                            {dest && <span className="text-xs text-gray-500">({dest.region})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleDestination(destName)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="max-h-60 border border-gray-300 rounded-lg p-6 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No destinations selected</p>
                      <p className="text-xs">Click &quot;Select Destinations&quot; to add destinations</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Route Map</label>
                {tourDestinations.length > 0 ? (
                  <div className="h-60 border border-gray-300 rounded-lg overflow-hidden">
                    <MapboxMap 
                      key={`${tour.destinations?.join(',') || 'empty'}-${tourDestinations.length}`}
                      destinations={tourDestinations} 
                      tourName={tour.name} 
                    />
                  </div>
                ) : (
                  <div className="h-60 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Map className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Select destinations to view route map</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Experiences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Key Experiences</h2>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newKeyExperience}
                onChange={(e) => setNewKeyExperience(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add a key experience"
              />
              <button
                onClick={addKeyExperience}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(tour.keyExperiences || []).map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{item}</span>
                  <button
                    onClick={() => removeItem(tour.keyExperiences || [], index, 'keyExperiences')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Tour Images</h2>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedTourImageIndex(null)
                  setTourImageSelectorOpen(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Upload or Select Image</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Upload new images or select from existing uploaded images</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(tour.images || []).map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image || '/placeholder-image.svg'}
                    alt={`Tour image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.svg'
                    }}
                  />
                  <button
                    onClick={() => removeItem(tour.images, index, 'images')}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Itinerary</h2>
            <div className="space-y-4">
              {(tour.itinerary || []).map((day, dayIndex) => (
                <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Day {day.day}</h3>
                    <button
                      onClick={() => removeDay(dayIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Day Title</label>
                      <input
                        type="text"
                        value={day.title || ''}
                        onChange={(e) => updateDay(dayIndex, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Day title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation</label>
                      <input
                        type="text"
                        value={day.accommodation || ''}
                        onChange={(e) => updateDay(dayIndex, 'accommodation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Accommodation"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={day.description || ''}
                      onChange={(e) => updateDay(dayIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Day description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transportation</label>
                      <input
                        type="text"
                        value={day.transportation || ''}
                        onChange={(e) => updateDay(dayIndex, 'transportation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Transportation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Travel Time</label>
                      <input
                        type="text"
                        value={day.travelTime || ''}
                        onChange={(e) => updateDay(dayIndex, 'travelTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Travel time"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overnight Stay</label>
                    <input
                      type="text"
                      value={day.overnightStay || ''}
                      onChange={(e) => updateDay(dayIndex, 'overnightStay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Overnight stay location"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Day Image</label>
                    <div className="space-y-3">
                      {day.image && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                          <img
                            src={day.image}
                            alt={`Day ${day.day} preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const errorDiv = target.nextElementSibling as HTMLElement
                              if (errorDiv) errorDiv.style.display = 'flex'
                            }}
                          />
                          <div className="hidden absolute inset-0 items-center justify-center bg-gray-100 text-gray-400 text-sm">
                            Image not available
                          </div>
                          <button
                            onClick={() => updateDay(dayIndex, 'image', '')}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayIndex(dayIndex)
                          setImageSelectorOpen(true)
                        }}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-700"
                      >
                        <Plus className="w-5 h-5" />
                        <span>{day.image ? 'Change Image' : 'Upload or Select Image'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activities</label>
                    <div className="space-y-2">
                      {(day.activities || []).map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) => updateDayActivity(dayIndex, activityIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Activity"
                          />
                          <button
                            onClick={() => removeDayActivity(dayIndex, activityIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addDayActivity(dayIndex)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add Activity
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meals</label>
                    <div className="space-y-2">
                      {(day.meals || []).map((meal, mealIndex) => (
                        <div key={mealIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={meal}
                            onChange={(e) => updateDayMeal(dayIndex, mealIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Meal"
                          />
                          <button
                            onClick={() => removeDayMeal(dayIndex, mealIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addDayMeal(dayIndex)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add Meal
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addDay}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add New Day
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <select
              value={tour.status}
              onChange={(e) => setTour({ ...tour, status: e.target.value as 'active' | 'draft' | 'archived' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Inclusions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">What&apos;s Included</h3>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add inclusion"
              />
              <button
                onClick={addInclusion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(tour.inclusions || []).map((inclusion, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                  <span className="text-sm">{inclusion}</span>
                  <button
                    onClick={() => removeItem(tour.inclusions || [], index, 'inclusions')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Not Included</h3>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add exclusion"
              />
              <button
                onClick={addExclusion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(tour.exclusions || []).map((exclusion, index) => (
                <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                  <span className="text-sm">{exclusion}</span>
                  <button
                    onClick={() => removeItem(tour.exclusions || [], index, 'exclusions')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Accommodation</h3>
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newAccommodation}
                onChange={(e) => setNewAccommodation(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add accommodation"
              />
              <button
                onClick={addAccommodation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {(tour.accommodation || []).map((acc, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <span className="text-sm">{acc}</span>
                  <button
                    onClick={() => removeItem(tour.accommodation || [], index, 'accommodation')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Transportation */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Transportation</h3>
            <input
              type="text"
              value={tour.transportation ?? ''}
              onChange={(e) => setTour({ ...tour, transportation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Air-conditioned van with professional driver"
            />
          </div>

          {/* Important Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Important Information</h3>
            
            {/* Requirements */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3">Activity Requirements</h4>
              <div className="space-y-4">
                {(tour.importantInfo?.requirements || []).map((req, reqIndex) => (
                  <div key={reqIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={req.activity ?? ''}
                        onChange={(e) => updateRequirementActivity(reqIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Activity name"
                      />
                      <button
                        onClick={() => removeRequirement(reqIndex)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(req.requirements || []).map((requirement, requirementIndex) => (
                        <div key={requirementIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={requirement ?? ''}
                            onChange={(e) => updateRequirement(reqIndex, requirementIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Requirement"
                          />
                          <button
                            onClick={() => removeRequirementItem(reqIndex, requirementIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addRequirementItem(reqIndex)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-3 w-3 inline mr-1" />
                        Add Requirement
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addRequirement}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add Activity Requirement
                </button>
              </div>
            </div>

            {/* What to Bring */}
            <div>
              <h4 className="text-md font-medium mb-3">What to Bring</h4>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newWhatToBring}
                  onChange={(e) => setNewWhatToBring(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add item to bring"
                />
                <button
                  onClick={addWhatToBring}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {(tour.importantInfo?.whatToBring || []).map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <span className="text-sm">{item}</span>
                    <button
                      onClick={() => removeWhatToBring(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Featured</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!!tour.featured}
                onChange={(e) => setTour({ ...tour, featured: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show as featured tour package</span>
            </label>
          </div>
        </div>
      </div>

      {/* Destination Selector Modal */}
      <DestinationSelector
        isOpen={showDestinationSelector}
        onClose={() => setShowDestinationSelector(false)}
        selectedDestinations={tour.destinations}
        onDestinationSelect={handleDestinationSelect}
        onDestinationDeselect={handleDestinationDeselect}
      />

      {/* Destination Manager Modal */}
      <DestinationManager
        isOpen={showDestinationManager}
        onClose={() => setShowDestinationManager(false)}
        onDestinationAdded={handleDestinationAdded}
      />

      {/* Day Image Selector */}
      <ImageSelector
        isOpen={imageSelectorOpen}
        onClose={() => {
          setImageSelectorOpen(false)
          setSelectedDayIndex(null)
        }}
        onSelect={(imageUrl) => {
          console.log('Day image selected:', imageUrl, 'for day index:', selectedDayIndex)
          if (selectedDayIndex !== null) {
            updateDay(selectedDayIndex, 'image', imageUrl)
            console.log('Updated day image. Current itinerary:', tour.itinerary)
          }
          setImageSelectorOpen(false)
          setSelectedDayIndex(null)
        }}
        currentImageUrl={selectedDayIndex !== null ? tour.itinerary[selectedDayIndex]?.image : undefined}
      />

      {/* Tour Images Selector */}
      <ImageSelector
        isOpen={tourImageSelectorOpen}
        onClose={() => {
          setTourImageSelectorOpen(false)
          setSelectedTourImageIndex(null)
        }}
        onSelect={handleTourImageSelect}
        currentImageUrl={selectedTourImageIndex !== null ? tour.images[selectedTourImageIndex] : undefined}
      />
    </div>
  )
}
