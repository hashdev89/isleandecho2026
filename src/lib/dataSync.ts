// Data synchronization service for updating frontend data from backend

export interface Day {
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

export interface TourData {
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
  featured?: boolean
  rating?: number
  reviews?: number
  status: 'active' | 'draft' | 'archived'
}

export interface DestinationData {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  description: string
  image: string
  status: 'active' | 'inactive'
}

export interface ImageData {
  id: string
  name: string
  url: string
  size: string
  dimensions: string
  category: string
  uploadedAt: string
  usedIn: string[]
}

class DataSyncService {
  private static instance: DataSyncService
  private updateCallbacks: Map<string, ((data: unknown) => void)[]> = new Map()

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService()
    }
    return DataSyncService.instance
  }

  // Subscribe to data updates
  subscribe(dataType: string, callback: (data: unknown) => void) {
    if (!this.updateCallbacks.has(dataType)) {
      this.updateCallbacks.set(dataType, [])
    }
    this.updateCallbacks.get(dataType)!.push(callback)
  }

  // Unsubscribe from data updates
  unsubscribe(dataType: string, callback: (data: unknown) => void) {
    const callbacks = this.updateCallbacks.get(dataType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Notify subscribers of data updates
  private notify(dataType: string, data: unknown) {
    const callbacks = this.updateCallbacks.get(dataType)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Tour Management
  async fetchTours(forceRefresh = false): Promise<TourData[]> {
    try {
      // Always use cache-busting to ensure fresh data (especially after saves)
      const cacheBuster = `?t=${Date.now()}`
      const response = await fetch(`/api/tours${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch tours - HTTP error:', response.status, errorText)
        return []
      }
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Failed to fetch tours - non-JSON response:', text.substring(0, 200))
        return []
      }
      const result = await response.json()
      console.log('Fetched tours from API:', result.success ? result.data.length : 0, 'tours')
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch tours:', error)
      return []
    }
  }

  async createTour(tourData: Omit<TourData, 'id'>): Promise<TourData | null> {
    try {
      console.log('DataSync: Creating tour with data:', tourData)
      console.log('DataSync: Tour data keys:', Object.keys(tourData))
      console.log('DataSync: Required fields validation:', {
        name: tourData.name,
        duration: tourData.duration,
        price: tourData.price
      })
      
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tourData),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('DataSync: Create tour HTTP error:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('DataSync: Create tour - non-JSON response:', text.substring(0, 200))
        throw new Error('Server returned non-JSON response')
      }
      
      const result = await response.json()
      console.log('DataSync: Create tour response:', result)
      
      if (!result.success) {
        const errorMessage = result.message || result.error?.message || 'Failed to create tour'
        console.error('DataSync: Tour creation failed:', {
          status: response.status,
          message: errorMessage,
          error: result.error,
          fullResponse: result
        })
        throw new Error(errorMessage)
      }
      
      this.notify('tours', await this.fetchTours())
      return result.data
    } catch (error) {
      console.error('DataSync: Failed to create tour:', error)
      throw error // Re-throw to let the caller handle it
    }
  }

  async updateTour(tourData: TourData): Promise<TourData | null> {
    try {
      console.log('========== DataSync: Updating tour ==========')
      console.log('Tour ID:', tourData.id)
      console.log('Tour name:', tourData.name)
      console.log('Itinerary count:', tourData.itinerary?.length || 0)
      
      const response = await fetch('/api/tours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tourData),
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response content-type:', response.headers.get('content-type'))
      
      if (!response.ok) {
        // Try to get error text
        let errorText = ''
        try {
          errorText = await response.text()
          console.error('Update tour HTTP error response:', errorText.substring(0, 500))
          
          // Try to parse as JSON if it looks like JSON
          if (errorText.trim().startsWith('{')) {
            try {
              const errorJson = JSON.parse(errorText)
              throw new Error(`HTTP ${response.status}: ${errorJson.message || errorText.substring(0, 200)}`)
            } catch {
              throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`)
            }
          } else {
            // It's HTML or plain text
            throw new Error(`HTTP ${response.status}: Server returned ${errorText.substring(0, 200)}`)
          }
        } catch (textError) {
          console.error('Failed to read error response:', textError)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      const contentType = response.headers.get('content-type')
      console.log('Content-Type header:', contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Update tour - non-JSON response received!')
        console.error('Response text (first 500 chars):', text.substring(0, 500))
        
        // If it's HTML, it's likely an error page
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('Server returned HTML error page instead of JSON. This usually means the API route crashed or returned an error.')
        }
        
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }
      
      const result = await response.json()
      console.log('Update tour response (success):', result.success)
      console.log('Update tour response data:', result.data ? 'Present' : 'Missing')
      
      if (result.success) {
        this.notify('tours', await this.fetchTours())
        return result.data
      } else {
        console.error('Tour update failed:', result.message)
        throw new Error(result.message || 'Failed to update tour')
      }
    } catch (error) {
      const msg = (error instanceof Error ? error.message : null) || String(error) || 'Unknown error'
      console.error('[DataSync] Update tour failed —', msg)
      if (error instanceof Error && error.stack) {
        console.error('[DataSync] Stack:', error.stack)
      }
      throw error
    }
  }

  async deleteTour(tourId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/tours?id=${tourId}`, {
        method: 'DELETE',
      })
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error('Delete tour received non-JSON:', text.substring(0, 200))
        return false
      }
      const result = await response.json()
      if (result.success) {
        this.notify('tours', await this.fetchTours())
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete tour:', error)
      return false
    }
  }

  // Destination Management
  async fetchDestinations(): Promise<DestinationData[]> {
    try {
      const response = await fetch('/api/destinations')
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch destinations:', error)
      return []
    }
  }

  async createDestination(destinationData: Omit<DestinationData, 'id'>): Promise<DestinationData | null> {
    try {
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(destinationData),
      })
      const result = await response.json()
      if (result.success) {
        this.notify('destinations', await this.fetchDestinations())
        return result.data
      }
      return null
    } catch (error) {
      console.error('Failed to create destination:', error)
      return null
    }
  }

  async updateDestination(destinationData: DestinationData): Promise<DestinationData | null> {
    try {
      const response = await fetch('/api/destinations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(destinationData),
      })
      const result = await response.json()
      if (result.success) {
        this.notify('destinations', await this.fetchDestinations())
        return result.data
      }
      return null
    } catch (error) {
      console.error('Failed to update destination:', error)
      return null
    }
  }

  async deleteDestination(destinationId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/destinations?id=${destinationId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        this.notify('destinations', await this.fetchDestinations())
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete destination:', error)
      return false
    }
  }

  // Image Management
  async fetchImages(): Promise<ImageData[]> {
    try {
      const response = await fetch('/api/images')
      const result = await response.json()
      return result.success ? result.data : []
    } catch (error) {
      console.error('Failed to fetch images:', error)
      return []
    }
  }

  async uploadImage(imageFile: File): Promise<ImageData | null> {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (result.success) {
        this.notify('images', await this.fetchImages())
        return result.data
      }
      return null
    } catch (error) {
      console.error('Failed to upload image:', error)
      return null
    }
  }

  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/images?id=${imageId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        this.notify('images', await this.fetchImages())
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  }

  // Frontend Data Update Methods
  updateFrontendTours(tours: TourData[]) {
    // This would update the frontend data files
    console.log('Updating frontend tours data:', tours)
    this.notify('frontend-tours', tours)
  }

  updateFrontendDestinations(destinations: DestinationData[]) {
    // This would update the frontend destinations data
    console.log('Updating frontend destinations data:', destinations)
    this.notify('frontend-destinations', destinations)
  }

  updateFrontendImages(images: ImageData[]) {
    // This would update the frontend images data
    console.log('Updating frontend images data:', images)
    this.notify('frontend-images', images)
  }

  // Sync all data from backend to frontend
  async syncAllData() {
    try {
      console.log('Starting data synchronization...')
      
      const [tours, destinations, images] = await Promise.all([
        this.fetchTours(),
        this.fetchDestinations(),
        this.fetchImages()
      ])

      // Update frontend data
      this.updateFrontendTours(tours)
      this.updateFrontendDestinations(destinations)
      this.updateFrontendImages(images)

      console.log('Data synchronization completed successfully')
      return { tours, destinations, images }
    } catch (error) {
      console.error('Data synchronization failed:', error)
      throw error
    }
  }

  // Real-time updates (WebSocket simulation)
  startRealTimeUpdates() {
    // In a real implementation, this would use WebSockets
    setInterval(async () => {
      try {
        await this.syncAllData()
      } catch (error) {
        console.error('Real-time update failed:', error)
      }
    }, 30000) // Sync every 30 seconds
  }
}

export const dataSync = DataSyncService.getInstance()

// React hooks for data synchronization
export const useDataSync = (dataType: string) => {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let result: unknown[] = []
        
        switch (dataType) {
          case 'tours':
            result = await dataSync.fetchTours()
            break
          case 'destinations':
            result = await dataSync.fetchDestinations()
            break
          case 'images':
            result = await dataSync.fetchImages()
            break
          default:
            throw new Error(`Unknown data type: ${dataType}`)
        }
        
        setData(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to updates
    const handleUpdate = (newData: unknown) => {
      if (Array.isArray(newData)) {
        setData(newData)
      }
    }

    dataSync.subscribe(dataType, handleUpdate)

    return () => {
      dataSync.unsubscribe(dataType, handleUpdate)
    }
  }, [dataType])

  return { data, loading, error }
}

// Import React hooks
import { useState, useEffect } from 'react'
