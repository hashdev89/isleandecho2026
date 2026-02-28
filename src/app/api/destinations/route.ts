import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'

// Persistent file-based storage for fallback
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'destinations.json')
// Extras (things_to_do, gallery) - persisted even when using Supabase so they survive refresh
const EXTRAS_FILE = path.join(process.cwd(), 'data', 'destinations-extras.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

type DestinationExtras = Record<string, { things_to_do?: ThingToDo[]; gallery?: string[] }>

const loadDestinationExtras = (): DestinationExtras => {
  try {
    ensureDataDir()
    if (fs.existsSync(EXTRAS_FILE)) {
      const data = fs.readFileSync(EXTRAS_FILE, 'utf8')
      return JSON.parse(data) as DestinationExtras
    }
  } catch (error) {
    console.error('Error loading destination extras:', error)
  }
  return {}
}

const saveDestinationExtras = (extras: DestinationExtras) => {
  try {
    ensureDataDir()
    fs.writeFileSync(EXTRAS_FILE, JSON.stringify(extras, null, 2))
  } catch (error) {
    console.error('Error saving destination extras:', error)
  }
}

export interface ThingToDo {
  name: string
  description?: string
  duration?: string
  difficulty?: string
}

interface Destination {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  description: string
  image: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  things_to_do?: ThingToDo[]
  gallery?: string[]
}

// Load destinations from file
const loadFallbackDestinations = (): Destination[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const parsed = JSON.parse(data)
      console.log('Loaded destinations from file:', parsed.length)
      return parsed
    }
  } catch (error) {
    console.error('Error loading fallback destinations:', error)
  }
  return []
}

// Save destinations to file
const saveFallbackDestinations = (destinations: Destination[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(destinations, null, 2))
    console.log('Destinations saved to fallback file:', FALLBACK_FILE)
  } catch (error) {
    console.error('Error saving fallback destinations:', error)
  }
}

// Helper function to fetch tours from Supabase or fallback
async function fetchToursData(): Promise<Array<{ destinations?: string[] }>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('tours')
        .select('destinations')
      
      if (!error && data) {
        // Handle JSONB destinations - parse if needed
        return data.map((tour: { destinations?: string[] | unknown }) => {
          let destinations = tour.destinations
          
          // If destinations is a string (JSONB stored as string), parse it
          if (typeof destinations === 'string') {
            try {
              destinations = JSON.parse(destinations)
            } catch {
              destinations = []
            }
          }
          
          // Ensure it's an array
          if (!Array.isArray(destinations)) {
            destinations = []
          }
          
          return { destinations: destinations as string[] }
        })
      }
    }
    
    // Fallback: load from file
    const TOURS_FILE = path.join(process.cwd(), 'data', 'tours.json')
    if (fs.existsSync(TOURS_FILE)) {
      const data = fs.readFileSync(TOURS_FILE, 'utf8')
      const tours = JSON.parse(data) as Array<{ destinations?: string[] }>
      return tours
    }
  } catch (error) {
    console.error('Error fetching tours data:', error)
  }
  
  return []
}

// Helper function to calculate tours count for destinations
async function calculateToursCount(destinations: Destination[]): Promise<Map<string, number>> {
  const toursCountMap = new Map<string, number>()
  
  try {
    // Fetch tours data directly
    const tours = await fetchToursData()
    
    // Initialize count for all destinations
    destinations.forEach(dest => {
      toursCountMap.set(dest.name, 0)
    })
    
    // Count tours that reference each destination
    tours.forEach(tour => {
      if (tour.destinations && Array.isArray(tour.destinations)) {
        tour.destinations.forEach((destName: string) => {
          const currentCount = toursCountMap.get(destName) || 0
          toursCountMap.set(destName, currentCount + 1)
        })
      }
    })
    
    console.log('Tours count calculated:', Object.fromEntries(toursCountMap))
  } catch (error) {
    console.error('Error calculating tours count:', error)
  }
  
  return toursCountMap
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeTourCount = searchParams.get('includeTourCount') === 'true'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 200) : undefined
    
    console.log('GET /api/destinations - Fetching destinations...', { includeTourCount, limit })
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') &&
                                  supabaseKey.length > 50
    
    let destinations: Destination[] = []
    
    if (isSupabaseConfigured) {
      console.log('Supabase configured, fetching from database...')
      const { data, error } = await supabaseAdmin
        .from('destinations')
        .select('*')
        .order('name', { ascending: true })
      
      console.log('Supabase destinations query result:', { 
        count: data?.length || 0, 
        error: error?.message 
      })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      if (data && data.length > 0) {
        destinations = data as Destination[]
        console.log(`Retrieved ${destinations.length} destinations from Supabase`)
      } else {
        console.log('No destinations found in Supabase, falling back to file storage')
        destinations = loadFallbackDestinations()
      }
    } else {
      console.log('Supabase not configured, using fallback storage')
      destinations = loadFallbackDestinations()
    }
    
    // Only calculate tours count if requested (for performance)
    let destinationsWithCount = destinations
    if (includeTourCount) {
      const toursCountMap = await calculateToursCount(destinations)
      destinationsWithCount = destinations.map(dest => ({
        ...dest,
        toursCount: toursCountMap.get(dest.name) || 0
      }))
    } else {
      // Set default count to 0 for faster response
      destinationsWithCount = destinations.map(dest => ({
        ...dest,
        toursCount: 0
      }))
    }

    // Merge things_to_do and gallery: use DB if present, else fall back to extras file (for local / before migration)
    const extras = loadDestinationExtras()
    destinationsWithCount = destinationsWithCount.map(dest => {
      const id = String(dest.id ?? '').trim()
      const e = extras[id]
      const hasThingsFromDb = Array.isArray(dest.things_to_do)
      const hasGalleryFromDb = Array.isArray(dest.gallery)
      if (hasThingsFromDb && hasGalleryFromDb) return dest
      if (!e) return dest
      return {
        ...dest,
        ...(!hasThingsFromDb && e && 'things_to_do' in e && { things_to_do: Array.isArray(e.things_to_do) ? e.things_to_do : [] }),
        ...(!hasGalleryFromDb && e && 'gallery' in e && { gallery: Array.isArray(e.gallery) ? e.gallery : [] })
      }
    })
    
    console.log('Current destinations count:', destinationsWithCount.length)
    const limited = limit != null ? destinationsWithCount.slice(0, limit) : destinationsWithCount
    return NextResponse.json({ 
      success: true, 
      data: limited,
      message: isSupabaseConfigured ? 'Destinations retrieved from Supabase' : 'Destinations retrieved from fallback storage'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error: unknown) {
    console.error('Destinations API error:', error)
    console.log('Falling back to persistent storage')
    const fallbackDestinations = loadFallbackDestinations()
    const extras = loadDestinationExtras()
    const destinationsWithCount = fallbackDestinations.map(dest => {
      const id = String(dest.id ?? '').trim()
      const e = extras[id]
      if (!e) return { ...dest, toursCount: 0 }
      return {
        ...dest,
        toursCount: 0,
        ...(e && 'things_to_do' in e && { things_to_do: Array.isArray(e.things_to_do) ? e.things_to_do : [] }),
        ...(e && 'gallery' in e && { gallery: Array.isArray(e.gallery) ? e.gallery : [] })
      }
    })
    return NextResponse.json({ 
      success: true, 
      data: destinationsWithCount,
      message: 'Destinations retrieved from fallback storage due to error' 
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  
  try {
    body = await req.json()
    console.log('POST /api/destinations - Received destination data:', body)
    
    const newDestination = {
      id: (body.id as string) || crypto.randomUUID(),
      name: body.name as string,
      region: body.region as string,
      lat: parseFloat(body.lat as string),
      lng: parseFloat(body.lng as string),
      description: (body.description as string) || '',
      image: (body.image as string) || '',
      status: (body.status as 'active' | 'inactive') || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
      ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
    }
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, saving to fallback storage')
      const fallbackDestinations = loadFallbackDestinations()
      const updatedDestinations = [...fallbackDestinations, newDestination]
      saveFallbackDestinations(updatedDestinations)
      if (Array.isArray(body.things_to_do) || Array.isArray(body.gallery)) {
        const extras = loadDestinationExtras()
        extras[newDestination.id] = {
          ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
          ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
        }
        saveDestinationExtras(extras)
      }
      return NextResponse.json({ 
        success: true, 
        data: newDestination,
        message: 'Destination created in fallback storage' 
      })
    }
    
    const supabaseInsertRow: Record<string, unknown> = {
      id: newDestination.id,
      name: newDestination.name,
      region: newDestination.region,
      lat: newDestination.lat,
      lng: newDestination.lng,
      description: newDestination.description,
      image: newDestination.image,
      status: newDestination.status,
      created_at: newDestination.created_at,
      updated_at: newDestination.updated_at,
      things_to_do: Array.isArray(body.things_to_do) ? body.things_to_do : [],
      gallery: Array.isArray(body.gallery) ? body.gallery : []
    }
    console.log('Attempting to insert destination into Supabase:', supabaseInsertRow)
    const { data, error } = await supabaseAdmin
      .from('destinations')
      .insert([supabaseInsertRow])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Try without created_at/updated_at if columns don't exist
      if (error.message && (error.message.includes('created_at') || error.message.includes('updated_at') || error.code === '42703')) {
        console.log('Retrying insert without timestamp columns...')
        const { created_at, updated_at, ...destinationWithoutTimestamps } = supabaseInsertRow
        const retryResult = await supabaseAdmin
          .from('destinations')
          .insert([destinationWithoutTimestamps])
          .select()
          .single()
        
        if (retryResult.error) {
          console.error('Retry failed:', retryResult.error)
          throw retryResult.error
        }
        const retryId = (retryResult.data as { id?: string })?.id ?? newDestination.id
        if (Array.isArray(body.things_to_do) || Array.isArray(body.gallery)) {
          const extras = loadDestinationExtras()
          extras[retryId] = {
            ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
            ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
          }
          saveDestinationExtras(extras)
        }
        console.log('Destination created successfully (without timestamps)')
        return NextResponse.json({ 
          success: true, 
          data: {
            ...retryResult.data,
            ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do }),
            ...(Array.isArray(body.gallery) && { gallery: body.gallery })
          },
          message: 'Destination created (timestamp columns not available)'
        })
      }
      
      throw error
    }
    
    console.log('Destination created successfully in Supabase:', data)
    const newId = (data as { id?: string })?.id ?? newDestination.id
    if (Array.isArray(body.things_to_do) || Array.isArray(body.gallery)) {
      const extras = loadDestinationExtras()
      extras[newId] = {
        ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
        ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
      }
      saveDestinationExtras(extras)
    }
    const createResponseData = {
      ...data,
      ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do }),
      ...(Array.isArray(body.gallery) && { gallery: body.gallery })
    }
    return NextResponse.json({ success: true, data: createResponseData })
  } catch (error: unknown) {
    console.error('Destination creation error:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create destination'
    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error.message as string) || errorMessage
    }
    
    console.log('Falling back to persistent storage')
    
    // Only try to create fallback if we have valid body data
    if (body && body.name && body.region && body.lat && body.lng) {
      const newDestination = {
        id: (body.id as string) || crypto.randomUUID(),
        name: body.name as string,
        region: body.region as string,
        lat: parseFloat(body.lat as string),
        lng: parseFloat(body.lng as string),
        description: (body.description as string) || '',
        image: (body.image as string) || '',
        status: (body.status as 'active' | 'inactive') || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
        ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
      }
      
      const fallbackDestinations = loadFallbackDestinations()
      const updatedDestinations = [...fallbackDestinations, newDestination]
      saveFallbackDestinations(updatedDestinations)
      
      return NextResponse.json({ 
        success: true, 
        data: newDestination,
        message: `Destination created in fallback storage. Supabase error: ${errorMessage}` 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: errorMessage || 'Invalid destination data provided' 
      }, { status: 400 })
    }
  }
}

export async function PUT(req: Request) {
  let body: Record<string, unknown> = {}
  
  try {
    body = await req.json()
    console.log('PUT /api/destinations - Received destination update:', body)
    
    const id = body.id != null ? String(body.id) : undefined
    if (!id) {
      return NextResponse.json({ success: false, message: 'Destination ID is required' }, { status: 400 })
    }

    const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat ?? 0))
    const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng ?? 0))
    const updated_at = new Date().toISOString()

    // Payload for Supabase (includes things_to_do and gallery once migration is run)
    const supabaseUpdatePayload: Record<string, unknown> = {
      name: (body.name as string) ?? '',
      region: (body.region as string) ?? '',
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      description: (body.description as string) ?? '',
      image: (body.image as string) ?? '',
      status: ((body.status as 'active' | 'inactive') || 'active') as 'active' | 'inactive',
      things_to_do: Array.isArray(body.things_to_do) ? body.things_to_do : [],
      gallery: Array.isArray(body.gallery) ? body.gallery : []
    }

    // Full payload for fallback storage (includes updated_at, things_to_do, gallery)
    const updatePayload = {
      ...supabaseUpdatePayload,
      updated_at,
      ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do }),
      ...(Array.isArray(body.gallery) && { gallery: body.gallery })
    }
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, updating fallback storage')
      const fallbackDestinations = loadFallbackDestinations()
      const existing = fallbackDestinations.find(d => String(d.id) === id)
      const updatedDestination: Destination = {
        ...existing,
        id,
        name: (supabaseUpdatePayload.name as string) ?? existing?.name ?? '',
        region: (supabaseUpdatePayload.region as string) ?? existing?.region ?? '',
        lat: (supabaseUpdatePayload.lat as number) ?? existing?.lat ?? 0,
        lng: (supabaseUpdatePayload.lng as number) ?? existing?.lng ?? 0,
        description: (supabaseUpdatePayload.description as string) ?? existing?.description ?? '',
        image: (supabaseUpdatePayload.image as string) ?? existing?.image ?? '',
        status: ((supabaseUpdatePayload.status as 'active' | 'inactive') ?? existing?.status) ?? 'active',
        created_at: existing?.created_at ?? updated_at,
        updated_at,
        ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do as ThingToDo[] }),
        ...(Array.isArray(body.gallery) && { gallery: body.gallery as string[] })
      }
      const updatedDestinations = fallbackDestinations.map(dest => 
        String(dest.id) === id ? { ...dest, ...updatePayload } : dest
      )
      saveFallbackDestinations(updatedDestinations)

      if ('things_to_do' in body || 'gallery' in body) {
        const extras = loadDestinationExtras()
        const key = String(id).trim()
        extras[key] = {
          ...(extras[key] || {}),
          ...('things_to_do' in body && { things_to_do: Array.isArray(body.things_to_do) ? (body.things_to_do as ThingToDo[]) : [] }),
          ...('gallery' in body && { gallery: Array.isArray(body.gallery) ? (body.gallery as string[]) : [] })
        }
        saveDestinationExtras(extras)
      }
      
      return NextResponse.json({ 
        success: true, 
        data: updatedDestination,
        message: 'Destination updated in fallback storage' 
      })
    }
    
    // Upsert: update if row exists, insert if not (handles id format or source mismatch)
    const row = { id, ...supabaseUpdatePayload }
    const { data, error } = await supabaseAdmin
      .from('destinations')
      .upsert([row], { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error('Supabase destinations upsert error:', error)
      throw error
    }

    const saved = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (!saved) {
      console.error('Supabase destinations upsert: no row returned')
      return NextResponse.json({ 
        success: false, 
        message: 'Could not save destination' 
      }, { status: 500 })
    }

    if ('things_to_do' in body || 'gallery' in body) {
      const extras = loadDestinationExtras()
      const key = String(id).trim()
      extras[key] = {
        ...(extras[key] || {}),
        ...('things_to_do' in body && { things_to_do: Array.isArray(body.things_to_do) ? (body.things_to_do as ThingToDo[]) : [] }),
        ...('gallery' in body && { gallery: Array.isArray(body.gallery) ? (body.gallery as string[]) : [] })
      }
      saveDestinationExtras(extras)
    }

    const responseData = {
      ...saved,
      ...(Array.isArray(body.things_to_do) && { things_to_do: body.things_to_do }),
      ...(Array.isArray(body.gallery) && { gallery: body.gallery })
    }
    return NextResponse.json({ success: true, data: responseData })
  } catch (error: unknown) {
    const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : 'Unknown error'
    console.error('Destination update error:', msg, error)
    
    // When Supabase is configured, do not claim success from fallback — client would read from Supabase and see old data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const isSupabaseConfigured = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co') && supabaseKey.length > 50

    if (isSupabaseConfigured) {
      return NextResponse.json({ 
        success: false, 
        message: `Update failed: ${msg}` 
      }, { status: 500 })
    }
    
    // Supabase not configured: update fallback file
    if (body && body.id != null) {
      const id = String(body.id)
      const lat = typeof body.lat === 'number' ? body.lat : parseFloat(String(body.lat ?? 0))
      const lng = typeof body.lng === 'number' ? body.lng : parseFloat(String(body.lng ?? 0))
      const updatePayload = {
        name: (body.name as string) ?? '',
        region: (body.region as string) ?? '',
        lat: Number.isFinite(lat) ? lat : 0,
        lng: Number.isFinite(lng) ? lng : 0,
        description: (body.description as string) ?? '',
        image: (body.image as string) ?? '',
        status: ((body.status as 'active' | 'inactive') || 'active') as 'active' | 'inactive',
        updated_at: new Date().toISOString()
      }
      const fallbackDestinations = loadFallbackDestinations()
      const updatedDestinations = fallbackDestinations.map(dest => 
        String(dest.id) === id ? { ...dest, ...updatePayload } : dest
      )
      saveFallbackDestinations(updatedDestinations)
      
      return NextResponse.json({ 
        success: true, 
        data: { id, ...updatePayload, created_at: fallbackDestinations.find(d => String(d.id) === id)?.created_at },
        message: 'Destination updated in fallback storage due to error' 
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid destination data or missing id' 
    }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'Destination ID is required' }, { status: 400 })
    }
    
    console.log('DELETE /api/destinations - Deleting destination:', id)
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured, deleting from fallback storage')
      const fallbackDestinations = loadFallbackDestinations()
      const updatedDestinations = fallbackDestinations.filter(dest => dest.id !== id)
      saveFallbackDestinations(updatedDestinations)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Destination deleted from fallback storage' 
      })
    }
    
    const { error } = await supabaseAdmin
      .from('destinations')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    return NextResponse.json({ success: true, message: 'Destination deleted successfully' })
  } catch (error: unknown) {
    console.error('Destination deletion error:', error)
    console.log('Falling back to persistent storage')
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    const fallbackDestinations = loadFallbackDestinations()
    const updatedDestinations = fallbackDestinations.filter(dest => dest.id !== id)
    saveFallbackDestinations(updatedDestinations)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Destination deleted from fallback storage due to error' 
    })
  }
}