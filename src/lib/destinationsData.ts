/**
 * Server-only data layer for destinations.
 * Use this from RSC pages and API routes so we don't depend on NEXT_PUBLIC_BASE_URL
 * (which breaks on Vercel when the page fetches its own API via localhost).
 */
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'destinations.json')
const EXTRAS_FILE = path.join(process.cwd(), 'data', 'destinations-extras.json')

export interface ThingToDo {
  name: string
  description?: string
  duration?: string
  difficulty?: string
}

export interface Destination {
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

type DestinationExtras = Record<string, { things_to_do?: ThingToDo[]; gallery?: string[] }>

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true })
    } catch {
      // On Vercel read-only fs, this may fail; continue
    }
  }
}

function loadDestinationExtras(): DestinationExtras {
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

function loadFallbackDestinations(): Destination[] {
  try {
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Error loading fallback destinations:', error)
  }
  return []
}

/**
 * Returns all destinations (Supabase or file fallback) with extras merged.
 * Safe to call from Server Components and API routes; no HTTP to self.
 */
export async function getDestinationsForServer(): Promise<Destination[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.includes('supabase.co') &&
    supabaseKey.length > 50

  let destinations: Destination[] = []

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabaseAdmin
        .from('destinations')
        .select('*')
        .order('name', { ascending: true })

      if (!error && data && data.length > 0) {
        destinations = data as Destination[]
      } else {
        destinations = loadFallbackDestinations()
      }
    } catch (error) {
      console.error('getDestinationsForServer Supabase error:', error)
      destinations = loadFallbackDestinations()
    }
  } else {
    destinations = loadFallbackDestinations()
  }

  const extras = loadDestinationExtras()
  return destinations.map((dest) => {
    const id = String(dest.id ?? '').trim()
    const e = extras[id]
    const hasThingsFromDb = Array.isArray(dest.things_to_do)
    const hasGalleryFromDb = Array.isArray(dest.gallery)
    if (hasThingsFromDb && hasGalleryFromDb) return dest
    if (!e) return dest
    return {
      ...dest,
      ...(!hasThingsFromDb && e && 'things_to_do' in e && { things_to_do: Array.isArray(e.things_to_do) ? e.things_to_do : [] }),
      ...(!hasGalleryFromDb && e && 'gallery' in e && { gallery: Array.isArray(e.gallery) ? e.gallery : [] }),
    }
  })
}

/**
 * Returns a single destination by id, or null if not found.
 */
export async function getDestinationByIdForServer(id: string): Promise<Destination | null> {
  const list = await getDestinationsForServer()
  return list.find((d) => String(d.id) === String(id)) ?? null
}
