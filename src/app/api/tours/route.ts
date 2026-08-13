import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'

interface SupabaseError {
  code?: string
  message: string
  details?: string
  hint?: string
}

interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
}

interface Tour {
  id: string
  name: string
  duration: string
  price: string
  image?: string
  images?: string[]
  rating: number
  reviews: number
  destinations?: string[]
  highlights?: string[]
  keyExperiences?: string[]
  key_experiences?: string[]
  keyexperiences?: string[]
  itinerary?: Record<string, unknown>[]
  inclusions?: string[]
  exclusions?: string[]
  accommodation?: string[]
  importantInfo?: Record<string, unknown>
  importantinfo?: Record<string, unknown>
  important_info?: Record<string, unknown>
  style?: string
  featured?: boolean
  status?: string
  createdAt?: string
  created_at?: string
  createdat?: string
  updatedAt?: string
  updated_at?: string
  updatedat?: string
  description?: string
  transportation?: string
  groupSize?: string
  group_size?: string
  groupsize?: string
  difficulty?: string
  bestTime?: string
  best_time?: string
  besttime?: string
  destinationsRoute?: string
  destinations_route?: string
  includingAll?: string
  including_all?: string
}

// Persistent file-based storage for fallback
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'tours.json')

// In-memory cache for better performance
let toursCache: Tour[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load tours from file only (no dummy data; backend is source of truth)
const loadFallbackTours = (): Tour[] => {
  try {
    const now = Date.now()
    if (toursCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return toursCache
    }
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const tours = JSON.parse(data)
      toursCache = tours
      cacheTimestamp = now
      return tours
    }
    toursCache = []
    cacheTimestamp = now
    return []
  } catch (error) {
    console.error('Error loading fallback tours:', error)
    return []
  }
}

// Save tours to file and update cache
const saveFallbackTours = (tours: Tour[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(tours, null, 2))
    
    // Update cache
    toursCache = tours
    cacheTimestamp = Date.now()
    
    console.log('Tours saved to fallback file and cache updated:', tours.length)
  } catch (error) {
    console.error('Error saving fallback tours:', error)
  }
}

// Clear cache when data is modified
// const clearCache = () => {
//   toursCache = null
//   cacheTimestamp = 0
// }

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('GET /api/tours - Starting request...')
    
    // Check if Supabase is configured (more robust for production)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                supabaseKey &&
                                supabaseUrl !== 'https://placeholder.supabase.co' &&
                                supabaseKey !== 'placeholder-service-key' &&
                                supabaseUrl.includes('supabase.co') &&
                                supabaseKey.length > 50 // Basic validation for service key length
    
    console.log('Supabase configuration check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseKey,
      urlValid: supabaseUrl?.includes('supabase.co'),
      keyLength: supabaseKey?.length || 0,
      isConfigured: isSupabaseConfigured,
      environment: process.env.NODE_ENV
    })
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using fallback data')
      const fallbackTours = loadFallbackTours()
      const responseTime = Date.now() - startTime
      console.log(`Loaded ${fallbackTours.length} fallback tours in ${responseTime}ms`)
      
      return NextResponse.json({ 
        success: true, 
        data: fallbackTours.map(tour => ({
          ...tour,
          keyExperiences: tour.keyExperiences || [],
          createdAt: tour.createdAt || new Date().toISOString(),
          updatedAt: tour.updatedAt || new Date().toISOString()
        })), 
        message: 'Tours retrieved from fallback storage',
        responseTime: `${responseTime}ms`
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      })
    }
    
    console.log('Attempting Supabase query...')
    
    // Try Supabase with timeout (increased for production)
    const supabasePromise = supabaseAdmin
      .from('tours')
      .select('*')
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Supabase query timeout after 5 seconds')), 5000)
    )
    
    let supabaseResult: SupabaseResponse<Tour[]>
    try {
      supabaseResult = await Promise.race([supabasePromise, timeoutPromise]) as SupabaseResponse<Tour[]>
    } catch (timeoutError) {
      console.error('Supabase query timed out:', timeoutError)
      const fallbackTours = loadFallbackTours()
      const responseTime = Date.now() - startTime
      
      return NextResponse.json({ 
        success: true, 
        data: fallbackTours.map(tour => ({
          ...tour,
          keyExperiences: tour.keyExperiences || [],
          createdAt: tour.createdAt || new Date().toISOString(),
          updatedAt: tour.updatedAt || new Date().toISOString()
        })), 
        message: fallbackTours.length ? 'Tours from fallback (timeout)' : 'No tours available',
        responseTime: `${responseTime}ms`
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      })
    }
    
    const { data, error } = supabaseResult
    
    console.log('Supabase query result:', { 
      dataCount: data?.length || 0, 
      error: error ? { code: error.code, message: error.message } : null 
    })
    
    if (error) {
      console.error('Supabase error details:', error)
      throw error
    }
    
    let toursData = data
    
    // Transform database field names to frontend format
          const transformedData = (toursData || []).map((tour: Tour) => {
      // Ensure itinerary preserves all fields including overnightStay and image
      // Normalize itinerary to ensure ALL fields are preserved when loading - preserve ALL days including empty ones
      const normalizedItinerary = Array.isArray(tour.itinerary) 
        ? tour.itinerary.map((day: any, index: number) => {
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
              image: day.image || '' // Ensure image field is preserved when loading
            }
          })
        : []
      
      console.log('Itinerary count when loading:', normalizedItinerary.length)
      console.log('Each day when loading:', normalizedItinerary.map((d, i) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
      
      const importantRaw = tour.important_info ?? tour.importantinfo ?? tour.importantInfo ?? {}
      let importantObj: Record<string, unknown> = {}
      if (typeof importantRaw === 'object' && importantRaw !== null) {
        importantObj = importantRaw as Record<string, unknown>
      } else if (typeof importantRaw === 'string') {
        try {
          const parsed = JSON.parse(importantRaw) as Record<string, unknown>
          if (parsed && typeof parsed === 'object') importantObj = parsed
        } catch {
          // ignore
        }
      }
      return {
      ...tour,
      keyExperiences: tour.key_experiences || tour.keyexperiences || [],
      createdAt: tour.createdat || tour.createdAt,
      updatedAt: tour.updatedat || tour.updatedAt,
      destinations: tour.destinations || [],
      highlights: tour.highlights || [],
      itinerary: normalizedItinerary,
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      accommodation: tour.accommodation || [],
      images: tour.images || [],
      importantInfo: importantObj,
      style: tour.style || 'Adventure',
      rating: Number(tour.rating ?? importantObj.rating ?? 0) || 0,
      reviews: Number(tour.reviews ?? importantObj.reviews ?? 0) || 0,
      destinationsRoute: tour.destinations_route || '',
      includingAll: tour.including_all || '',
      groupSize: String(tour.group_size ?? tour.groupsize ?? tour.groupSize ?? importantObj.groupSize ?? ''),
      bestTime: String(tour.best_time ?? tour.besttime ?? tour.bestTime ?? importantObj.bestTime ?? '')
    }
    })
    
    const responseTime = Date.now() - startTime
    console.log(`Retrieved ${transformedData.length} tours from Supabase in ${responseTime}ms`)
    
    // Update cache
    toursCache = transformedData
    cacheTimestamp = Date.now()
    
    return NextResponse.json({ 
      success: true, 
      data: transformedData, 
      message: 'Tours retrieved successfully',
      responseTime: `${responseTime}ms`
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('API error:', error)
    const fallbackTours = loadFallbackTours()
    return NextResponse.json({
      success: true,
      data: fallbackTours.map((tour: Tour) => ({
        ...tour,
        keyExperiences: tour.keyExperiences || [],
        createdAt: tour.createdAt || new Date().toISOString(),
        updatedAt: tour.updatedAt || new Date().toISOString(),
        groupSize: String(tour.groupSize ?? tour.group_size ?? tour.groupsize ?? (tour.importantInfo as Record<string, unknown>)?.groupSize ?? ''),
        bestTime: String(tour.bestTime ?? tour.best_time ?? tour.besttime ?? (tour.importantInfo as Record<string, unknown>)?.bestTime ?? '')
      })),
      message: fallbackTours.length ? 'Tours from fallback due to error' : 'No tours available',
      responseTime: `${responseTime}ms`
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body as JSON:', parseError)
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    console.log('POST /api/tours - Received data:', body)
    
    // Validate required fields
    if (!body.name || !body.duration || !body.price) {
      console.log('Validation failed - missing required fields:', { name: body.name, duration: body.duration, price: body.price })
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    console.log('Generated tour ID:', id)
    
    const newTour = {
      ...body,
      id,
      featured: body.featured ?? false,
      keyExperiences: body.keyExperiences ?? [],
      status: body.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    console.log('Prepared tour data:', newTour)

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using fallback storage')
      const fallbackTours = loadFallbackTours()
      fallbackTours.push(newTour)
      saveFallbackTours(fallbackTours)
      console.log('Tour added to fallback storage:', newTour)
      console.log('Total tours in fallback storage:', fallbackTours.length)
      return NextResponse.json({ success: true, data: newTour, message: 'Tour created successfully (fallback storage)' }, { status: 201 })
    }

    // Try Supabase first - transform data to match database schema
    const dbTour: Record<string, unknown> = {
      id: id,
      name: newTour.name,
      duration: newTour.duration,
      price: newTour.price,
      status: newTour.status || 'draft',
      featured: newTour.featured || false
    }

    // Add optional fields only if they have values
    if (newTour.style) dbTour.style = newTour.style
    if (newTour.description) dbTour.description = newTour.description
    if (newTour.transportation) dbTour.transportation = newTour.transportation
    if (newTour.difficulty) dbTour.difficulty = newTour.difficulty

    // Handle array fields - ensure they're arrays
    if (newTour.destinations) {
      dbTour.destinations = Array.isArray(newTour.destinations) 
        ? newTour.destinations 
        : []
    } else {
      dbTour.destinations = []
    }
    
    if (newTour.highlights) {
      dbTour.highlights = Array.isArray(newTour.highlights) 
        ? newTour.highlights 
        : []
    } else {
      dbTour.highlights = []
    }
    
    if (newTour.keyExperiences) {
      dbTour.key_experiences = Array.isArray(newTour.keyExperiences) 
        ? newTour.keyExperiences 
        : []
    } else {
      dbTour.key_experiences = []
    }
    
    if (newTour.inclusions) {
      dbTour.inclusions = Array.isArray(newTour.inclusions) 
        ? newTour.inclusions 
        : []
    } else {
      dbTour.inclusions = []
    }
    
    if (newTour.exclusions) {
      dbTour.exclusions = Array.isArray(newTour.exclusions) 
        ? newTour.exclusions 
        : []
    } else {
      dbTour.exclusions = []
    }
    
    if (newTour.accommodation) {
      dbTour.accommodation = Array.isArray(newTour.accommodation) 
        ? newTour.accommodation 
        : []
    } else {
      dbTour.accommodation = []
    }
    
    if (newTour.images) {
      dbTour.images = Array.isArray(newTour.images) 
        ? newTour.images 
        : []
    } else {
      dbTour.images = []
    }

    // Handle JSONB fields
    if (newTour.itinerary) {
      console.log('Received itinerary for create:', JSON.stringify(newTour.itinerary, null, 2))
      if (Array.isArray(newTour.itinerary) && newTour.itinerary.length > 0) {
        console.log('First day in received itinerary:', newTour.itinerary[0])
        console.log('First day overnightStay:', newTour.itinerary[0]?.overnightStay)
      }
      // Normalize itinerary to ensure all fields are present
      const normalizedItineraryCreate = Array.isArray(newTour.itinerary)
        ? newTour.itinerary.map((day: { day?: number; title?: string; description?: string; activities?: unknown[]; accommodation?: string; meals?: unknown[]; transportation?: string; travelTime?: string; overnightStay?: string; image?: string }) => ({
            day: day.day || 0,
            title: day.title || '',
            description: day.description || '',
            activities: Array.isArray(day.activities) ? day.activities : [],
            accommodation: day.accommodation || '',
            meals: Array.isArray(day.meals) ? day.meals : [],
            transportation: day.transportation || '',
            travelTime: day.travelTime || '',
            overnightStay: day.overnightStay || '',
            image: day.image || ''
          }))
        : []
      dbTour.itinerary = normalizedItineraryCreate
      console.log('Itinerary being saved to database:', JSON.stringify(normalizedItineraryCreate, null, 2))
      if (normalizedItineraryCreate.length > 0) {
        console.log('First day activities:', normalizedItineraryCreate[0]?.activities)
        console.log('First day meals:', normalizedItineraryCreate[0]?.meals)
      }
    } else {
      dbTour.itinerary = []
    }
    
    const importantInfoCreate = (newTour.importantInfo && typeof newTour.importantInfo === 'object') ? newTour.importantInfo as Record<string, unknown> : {}
    const groupSizeCreate = String(newTour.groupSize ?? importantInfoCreate.groupSize ?? '').trim()
    const bestTimeCreate = String(newTour.bestTime ?? importantInfoCreate.bestTime ?? '').trim()
    dbTour.group_size = groupSizeCreate
    dbTour.best_time = bestTimeCreate
    const ratingCreate = Number(newTour.rating ?? importantInfoCreate.rating ?? 0) || 0
    const reviewsCreate = Number(newTour.reviews ?? importantInfoCreate.reviews ?? 0) || 0
    dbTour.rating = ratingCreate
    dbTour.reviews = reviewsCreate
    dbTour.important_info = {
      ...importantInfoCreate,
      rating: ratingCreate,
      reviews: reviewsCreate,
      groupSize: groupSizeCreate,
      bestTime: bestTimeCreate
    }

    console.log('Prepared tour data for database:', JSON.stringify(dbTour, null, 2))

    // Check for duplicate ID first
    const { data: existingTour, error: checkError } = await supabaseAdmin
      .from('tours')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn('Error checking for existing tour:', checkError)
    }
    
    if (existingTour) {
      console.error('Tour with ID already exists:', id)
      // Generate new ID with timestamp
      const newId = `${id}-${Date.now()}`
      dbTour.id = newId
      console.log('Using new ID:', newId)
    }

    console.log('Attempting to insert tour with ID:', dbTour.id)
    let insertPayload: Record<string, unknown> = { ...dbTour }
    const maxInsertRetries = 5
    let insertAttempt = 0
    let data: unknown = null
    let error: { code?: string; message?: string; details?: unknown; hint?: string } | null = null

    while (insertAttempt <= maxInsertRetries) {
      const result = await supabaseAdmin.from('tours').insert(insertPayload).select().single()
      data = result.data
      error = result.error

      console.log('Supabase insert result:', { success: !error, data: data ? 'Tour created' : null, error: error?.message })

      if (error?.code === 'PGRST204' && error.message && insertAttempt < maxInsertRetries) {
        const match = error.message.match(/Could not find the '([^']+)' column/)
        if (match) {
          const columnName = match[1]
          console.warn(`Supabase: column "${columnName}" not in schema, retrying without it (attempt ${insertAttempt + 1})`)
          delete insertPayload[columnName]
          insertAttempt++
          continue
        }
      }
      break
    }

    if (error) {
      console.error('Supabase insert error details:', { message: error.message, code: error.code })
      return NextResponse.json({
        success: false,
        message: `Failed to create tour in database: ${error.message}`,
        error: { code: error.code, message: error.message, details: error.details, hint: error.hint }
      }, { status: 500 })
    }

    if (!data) {
      console.error('No data returned from Supabase insert')
      return NextResponse.json({ 
        success: false, 
        message: 'Tour was inserted but no data was returned from database' 
      }, { status: 500 })
    }
    
    // Transform back to frontend format
    const transformedData = {
      ...data,
      keyExperiences: (data as any).key_experiences || [],
      createdAt: (data as any).created_at || (data as any).createdat || newTour.createdAt || new Date().toISOString(),
      updatedAt: (data as any).updated_at || (data as any).updatedat || newTour.updatedAt || new Date().toISOString(),
      groupSize: (data as any).group_size ?? (data as any).groupsize ?? ((data as any).important_info as Record<string, unknown>)?.groupSize ?? newTour.groupSize ?? '',
      bestTime: (data as any).best_time ?? (data as any).besttime ?? ((data as any).important_info as Record<string, unknown>)?.bestTime ?? newTour.bestTime ?? '',
      importantInfo: (data as any).important_info || (data as any).importantInfo || {}
    }
    
    console.log('Tour created successfully in Supabase:', transformedData)
    return NextResponse.json({ 
      success: true, 
      data: transformedData, 
      message: 'Tour created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Create tour error:', error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to create tour: ${errorMessage}` 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  console.log('========== PUT /api/tours - UPDATE REQUEST STARTED ==========')
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body as JSON:', parseError)
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    const { id, ...updateData } = body
    // Ensure groupSize and bestTime are read from top-level body (admin sends them there)
    const groupSize = updateData.groupSize ?? (updateData.importantInfo as Record<string, unknown>)?.groupSize ?? ''
    const bestTime = updateData.bestTime ?? (updateData.importantInfo as Record<string, unknown>)?.bestTime ?? ''
    updateData.groupSize = typeof groupSize === 'string' ? groupSize : String(groupSize ?? '')
    updateData.bestTime = typeof bestTime === 'string' ? bestTime : String(bestTime ?? '')
    console.log('PUT /api/tours - Received update data:', { id, groupSize: updateData.groupSize, bestTime: updateData.bestTime })
    console.log('PUT /api/tours - Itinerary in updateData:', updateData.itinerary)
    if (updateData.itinerary && Array.isArray(updateData.itinerary) && updateData.itinerary.length > 0) {
      console.log('PUT /api/tours - First day of itinerary:', updateData.itinerary[0])
      console.log('PUT /api/tours - First day overnightStay value:', updateData.itinerary[0]?.overnightStay)
      console.log('PUT /api/tours - First day has overnightStay key?', 'overnightStay' in (updateData.itinerary[0] || {}))
    }

    const idStr = id == null ? '' : String(id)
    if (!idStr) {
      console.log('Validation failed - missing tour ID')
      return NextResponse.json(
        { success: false, message: 'Tour ID is required' },
        { status: 400 }
      )
    }

    // Prepare the updated tour data (use string id for Supabase .eq())
    const updatedTour = {
      ...updateData,
      id: idStr,
      updatedAt: new Date().toISOString()
    }
    console.log('Prepared updated tour data:', updatedTour)

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using fallback storage for update')
      const fallbackTours = loadFallbackTours()
      const tourIndex = fallbackTours.findIndex(tour => String(tour.id) === idStr)
      if (tourIndex === -1) {
        console.log('Tour not found in fallback storage:', idStr)
        return NextResponse.json(
          { success: false, message: 'Tour not found' },
          { status: 404 }
        )
      }
      
      fallbackTours[tourIndex] = { ...fallbackTours[tourIndex], ...updatedTour }
      saveFallbackTours(fallbackTours)
      console.log('Tour updated in fallback storage:', fallbackTours[tourIndex])
      console.log('Total tours in fallback storage after update:', fallbackTours.length)
      return NextResponse.json({ 
        success: true, 
        data: fallbackTours[tourIndex], 
        message: 'Tour updated successfully (fallback storage)' 
      })
    }

    // Try Supabase first - transform data to match database schema
    // Include ALL fields from updateData to ensure nothing is lost
    const dbUpdateData: Record<string, unknown> = {
      name: updateData.name || '',
      duration: updateData.duration || '',
      price: updateData.price || '',
      style: updateData.style || '',
      description: updateData.description || '',
      transportation: updateData.transportation || '',
      status: updateData.status || 'draft',
      featured: updateData.featured !== undefined ? updateData.featured : false
    }

    console.log('========== BUILDING UPDATE DATA ==========')
    console.log('Update data received:', Object.keys(updateData))
    console.log('Name:', updateData.name)
    console.log('Duration:', updateData.duration)
    console.log('Price:', updateData.price)
    console.log('Itinerary present:', updateData.itinerary !== undefined)
    console.log('Images present:', updateData.images !== undefined)
    if (updateData.difficulty !== undefined) dbUpdateData.difficulty = updateData.difficulty

    // Sync group size and best time: write to both table columns (group_size, best_time) and important_info
    const groupSizeVal = String(updateData.groupSize ?? (updateData.importantInfo as Record<string, unknown>)?.groupSize ?? '').trim()
    const bestTimeVal = String(updateData.bestTime ?? (updateData.importantInfo as Record<string, unknown>)?.bestTime ?? '').trim()
    dbUpdateData.group_size = groupSizeVal
    dbUpdateData.best_time = bestTimeVal

    // Handle array fields - ALWAYS include them (even if empty) to ensure updates work correctly
    // This is critical - if we only include when undefined, empty arrays won't clear existing data
    dbUpdateData.destinations = Array.isArray(updateData.destinations) 
      ? updateData.destinations 
      : []
    dbUpdateData.highlights = Array.isArray(updateData.highlights) 
      ? updateData.highlights 
      : []
    dbUpdateData.key_experiences = Array.isArray(updateData.keyExperiences || updateData.key_experiences) 
      ? (updateData.keyExperiences || updateData.key_experiences) 
      : []
    dbUpdateData.inclusions = Array.isArray(updateData.inclusions) 
      ? updateData.inclusions 
      : []
    dbUpdateData.exclusions = Array.isArray(updateData.exclusions) 
      ? updateData.exclusions 
      : []
    dbUpdateData.accommodation = Array.isArray(updateData.accommodation) 
      ? updateData.accommodation 
      : []
    dbUpdateData.images = Array.isArray(updateData.images) 
      ? updateData.images 
      : []
    
    console.log('Array fields being saved:')
    console.log('  Destinations count:', (dbUpdateData.destinations as any[]).length)
    console.log('  Highlights count:', (dbUpdateData.highlights as any[]).length)
    console.log('  Key experiences count:', (dbUpdateData.key_experiences as any[]).length)
    console.log('  Inclusions count:', (dbUpdateData.inclusions as any[]).length)
    console.log('  Exclusions count:', (dbUpdateData.exclusions as any[]).length)
    console.log('  Accommodation count:', (dbUpdateData.accommodation as any[]).length)
    console.log('  Images count:', (dbUpdateData.images as any[]).length)
    console.log('  Images:', dbUpdateData.images)

    // Handle JSONB fields - ALWAYS include itinerary if present (even if empty array)
    // This ensures itinerary updates work correctly
    if (updateData.itinerary !== undefined) {
      console.log('========== PROCESSING ITINERARY FOR UPDATE ==========')
      console.log('Received itinerary for update:', JSON.stringify(updateData.itinerary, null, 2))
      if (Array.isArray(updateData.itinerary) && updateData.itinerary.length > 0) {
        console.log('First day in received itinerary:', updateData.itinerary[0])
        console.log('First day overnightStay:', updateData.itinerary[0]?.overnightStay)
        console.log('First day all keys:', Object.keys(updateData.itinerary[0] || {}))
      }
      // Ensure ALL fields are preserved in each day - preserve everything, including empty days
      const normalizedItinerary = Array.isArray(updateData.itinerary)
        ? updateData.itinerary.map((day: any, index: number) => {
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
      
      console.log('Itinerary count being saved:', normalizedItinerary.length)
      console.log('Each day being saved:', normalizedItinerary.map((d: { day: number; title: string }, i: number) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
      dbUpdateData.itinerary = normalizedItinerary
      console.log('Itinerary being saved to database (normalized):', JSON.stringify(normalizedItinerary, null, 2))
      if (normalizedItinerary.length > 0) {
        console.log('First day in normalized itinerary:', normalizedItinerary[0])
        console.log('First day overnightStay in normalized:', normalizedItinerary[0]?.overnightStay)
        console.log('First day image in normalized:', normalizedItinerary[0]?.image)
        console.log('First day activities in normalized:', normalizedItinerary[0]?.activities)
        console.log('First day meals in normalized:', normalizedItinerary[0]?.meals)
        console.log('First day all keys:', Object.keys(normalizedItinerary[0] || {}))
      }
      console.log('========== ITINERARY PROCESSING COMPLETE ==========')
    } else {
      // If itinerary is not provided, log a warning but don't fail
      console.warn('WARNING: Itinerary not in updateData - will preserve existing itinerary')
      console.warn('This might cause issues if you intended to update the itinerary')
    }
    
    // important_info JSONB: always include groupSize/bestTime (same values as table columns for sync)
    const existingImportant = (updateData.importantInfo && typeof updateData.importantInfo === 'object') ? updateData.importantInfo as Record<string, unknown> : { requirements: [], whatToBring: [] }
    const ratingVal = Number(updateData.rating ?? existingImportant.rating ?? 0) || 0
    const reviewsVal = Number(updateData.reviews ?? existingImportant.reviews ?? 0) || 0
    dbUpdateData.rating = ratingVal
    dbUpdateData.reviews = reviewsVal
    dbUpdateData.important_info = {
      ...existingImportant,
      groupSize: groupSizeVal,
      bestTime: bestTimeVal,
      rating: ratingVal,
      reviews: reviewsVal,
    }
    console.log('PUT important_info and group_size/best_time being saved:', { group_size: groupSizeVal, best_time: bestTimeVal, important_info: dbUpdateData.important_info })
    
    console.log('Final dbUpdateData keys:', Object.keys(dbUpdateData))
    console.log('Final dbUpdateData has itinerary:', 'itinerary' in dbUpdateData)
    console.log('Final dbUpdateData has images:', 'images' in dbUpdateData)

    // Remove frontend-only fields (camelCase not used by DB)
    delete dbUpdateData.keyExperiences
    delete dbUpdateData.createdAt
    delete dbUpdateData.updatedAt
    delete dbUpdateData.id
    delete dbUpdateData.groupSize
    delete dbUpdateData.groupsize
    delete dbUpdateData.bestTime
    delete dbUpdateData.besttime
    // group_size and best_time stay in dbUpdateData for the table

    console.log('Prepared tour data for database update:', dbUpdateData)
    console.log('Itinerary in dbUpdateData:', dbUpdateData.itinerary)
    if (dbUpdateData.itinerary && Array.isArray(dbUpdateData.itinerary) && dbUpdateData.itinerary.length > 0) {
      console.log('Final check - First day overnightStay before Supabase update:', dbUpdateData.itinerary[0]?.overnightStay)
    }

    let updatePayload: Record<string, unknown> = { ...dbUpdateData }
    let data: unknown = null
    let error: { code?: string; message?: string; details?: unknown; hint?: string } | null = null
    const maxRetries = 5
    let attempt = 0

    while (attempt <= maxRetries) {
      const result = await supabaseAdmin
        .from('tours')
        .update(updatePayload)
        .eq('id', idStr)
        .select('*')
        .single()
      data = result.data
      error = result.error

      // On PGRST204 (column not in schema), strip that column and retry
      if (error?.code === 'PGRST204' && error.message && attempt < maxRetries) {
        const match = error.message.match(/Could not find the '([^']+)' column/)
        if (match) {
          const columnName = match[1]
          console.warn(`Supabase: column "${columnName}" not in schema, retrying without it (attempt ${attempt + 1})`)
          delete updatePayload[columnName]
          attempt++
          continue
        }
      }
      break
    }

    const dataRow = data as Record<string, unknown> | null
    console.log('========== SUPABASE UPDATE RESULT ==========')
    console.log('Supabase update error:', error)
    console.log('Supabase update data received:', data)
    if (dataRow?.itinerary) {
      console.log('Itinerary in Supabase response:', JSON.stringify(dataRow.itinerary, null, 2))
      console.log('Itinerary count in Supabase response:', Array.isArray(dataRow.itinerary) ? dataRow.itinerary.length : 'not an array')
      if (Array.isArray(dataRow.itinerary) && dataRow.itinerary.length > 0) {
        console.log('First day in Supabase response:', dataRow.itinerary[0])
        console.log('First day keys:', Object.keys((dataRow.itinerary as object[])[0] || {}))
      }
    }
    if (dataRow?.itinerary) {
      console.log('Data returned from Supabase - itinerary:', (data as any).itinerary)
      if (Array.isArray((data as any).itinerary) && (data as any).itinerary.length > 0) {
        console.log('Data returned - First day overnightStay:', (data as any).itinerary[0]?.overnightStay)
      }
    }
    console.log('========== PUT /api/tours - UPDATE REQUEST COMPLETE ==========')

    if (error) {
      console.error('Supabase update error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      const hint = (error.message || '').toLowerCase().includes('does not exist') || (error.message || '').includes('PGRST204')
        ? ' Ensure the tours table in Supabase has required columns (e.g. itinerary, images, important_info).'
        : ''
      return NextResponse.json(
        {
          success: false,
          message: `Tour update failed: ${error.message}.${hint}`,
          error: { code: error.code, message: error.message, details: error.details, hint: error.hint }
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Normalize itinerary in the response - preserve ALL days including empty ones
    type DayShape = { day: number; title: string; description?: string; activities?: unknown[]; accommodation?: string; meals?: unknown[]; transportation?: string; travelTime?: string; overnightStay?: string; image?: string }
    const normalizedResponseItinerary: DayShape[] = Array.isArray(dataRow?.itinerary)
      ? (dataRow!.itinerary as unknown[]).map((day: unknown, index: number) => {
          const d = day as DayShape
          const dayNumber = (d.day && d.day > 0) ? d.day : (index + 1)
          return {
            day: dayNumber,
            title: d.title || '',
            description: d.description || '',
            activities: Array.isArray(d.activities) ? d.activities : [],
            accommodation: d.accommodation || '',
            meals: Array.isArray(d.meals) ? d.meals : [],
            transportation: d.transportation || '',
            travelTime: d.travelTime || '',
            overnightStay: d.overnightStay || '',
            image: d.image || ''
          }
        })
      : []
    
    console.log('Itinerary count in PUT response:', normalizedResponseItinerary.length)
    console.log('Each day in PUT response:', normalizedResponseItinerary.map((d, i) => `Day ${i + 1}: day=${d.day}, title="${d.title}"`))
    
    const putImportant = (dataRow?.important_info ?? dataRow?.importantInfo ?? updateData.importantInfo ?? {}) as Record<string, unknown>
    const putGroupSize = String(dataRow?.group_size ?? dataRow?.groupsize ?? putImportant?.groupSize ?? updateData.groupSize ?? '')
    const putBestTime = String(dataRow?.best_time ?? dataRow?.besttime ?? putImportant?.bestTime ?? updateData.bestTime ?? '')
    const transformedData = {
      ...(dataRow || {}),
      keyExperiences: dataRow?.key_experiences ?? [],
      createdAt: dataRow?.created_at ?? dataRow?.createdat ?? new Date().toISOString(),
      updatedAt: dataRow?.updated_at ?? dataRow?.updatedat ?? new Date().toISOString(),
      groupSize: putGroupSize,
      bestTime: putBestTime,
      importantInfo: putImportant,
      itinerary: normalizedResponseItinerary,
      images: Array.isArray(dataRow?.images) ? dataRow.images : []
    }

    console.log('Tour updated successfully in Supabase:', transformedData)
    return NextResponse.json({ 
      success: true, 
      data: transformedData, 
      message: 'Tour updated successfully' 
    })
  } catch (error) {
    console.error('========== PUT /api/tours - ERROR ==========')
    console.error('Update tour error:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred'
    
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to update tour: ${errorMessage}`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : String(error)
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Tour ID is required' },
        { status: 400 }
      )
    }

    console.log('DELETE /api/tours - Deleting tour with ID:', id)

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, using fallback storage')
      const fallbackTours = loadFallbackTours()
      const initialLength = fallbackTours.length
      const filteredTours = fallbackTours.filter(tour => tour.id !== id)
      
      if (filteredTours.length === initialLength) {
        console.log('Tour not found in fallback storage:', id)
        return NextResponse.json(
          { success: false, message: 'Tour not found' },
          { status: 404 }
        )
      }
      
      saveFallbackTours(filteredTours)
      console.log('Tour deleted from fallback storage:', id)
      console.log('Remaining tours in fallback storage:', filteredTours.length)
      return NextResponse.json({ success: true, data: { id }, message: 'Tour deleted successfully (fallback storage)' })
    }

    const { error } = await supabaseAdmin.from('tours').delete().eq('id', id)
    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
    console.log('Tour deleted successfully from Supabase:', id)
    return NextResponse.json({ success: true, data: { id }, message: 'Tour deleted successfully' })
  } catch (error) {
    console.error('Delete tour error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete tour' },
      { status: 500 }
    )
  }
}
