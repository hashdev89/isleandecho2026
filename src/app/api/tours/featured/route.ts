import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

interface Tour {
  id: string
  name: string
  duration: string
  price: string
  featured?: boolean
  [key: string]: unknown
}

// Cache for featured tours
let featuredToursCache: Tour[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'tours.json')

const ensureDataDir = () => {
  const dataDir = path.dirname(FALLBACK_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

const loadFallbackTours = (): Tour[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading fallback tours:', error)
  }
  return []
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Use cache only when we have data (don't cache empty – allows retry without waiting)
    const now = Date.now()
    if (featuredToursCache && featuredToursCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      const responseTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        data: featuredToursCache,
        message: 'Featured tours retrieved from cache',
        responseTime: `${responseTime}ms`
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
      })
    }

    // Check if Supabase is configured
    const isSupabaseConfigured = supabaseUrl && 
                                supabaseKey &&
                                supabaseUrl !== 'https://placeholder.supabase.co' &&
                                supabaseKey !== 'placeholder-service-key' &&
                                supabaseUrl.includes('supabase.co') &&
                                supabaseKey.length > 50
    
    if (!isSupabaseConfigured) {
      const fallbackTours = loadFallbackTours()
      const featured = fallbackTours.filter(t => t.featured === true)
      if (featured.length > 0) {
        featuredToursCache = featured
        cacheTimestamp = now
      } else {
        featuredToursCache = null
      }
      const responseTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        data: featured,
        message: 'Featured tours retrieved from fallback storage',
        responseTime: `${responseTime}ms`
      }, {
        headers: featured.length > 0
          ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
          : { 'Cache-Control': 'no-store, must-revalidate' },
      })
    }
    
    // Fetch featured tours from Supabase; if none, fall back to recent active tours
    const { data: featuredData, error: featuredError } = await supabaseAdmin
      .from('tours')
      .select('*')
      .eq('featured', true)
      .eq('status', 'active')
      .order('createdat', { ascending: false })
      .limit(20)
    
    let data = featuredData
    
    if (featuredError) {
      console.error('Supabase error (featured):', featuredError)
      data = []
    }
    
    // If no featured tours, show recent active tours so the section isn't empty
    if (!data || data.length === 0) {
      const { data: recentData, error: recentError } = await supabaseAdmin
        .from('tours')
        .select('*')
        .eq('status', 'active')
        .order('createdat', { ascending: false })
        .limit(8)
      if (!recentError && recentData && recentData.length > 0) {
        data = recentData
      }
    }
    
    if (!data || data.length === 0) {
      // Still empty: try file fallback (don't cache empty)
      featuredToursCache = null
      const fallbackTours = loadFallbackTours()
      const fromFile = fallbackTours.filter(t => t.featured === true)
      if (fromFile.length > 0) {
        featuredToursCache = fromFile
        cacheTimestamp = now
        const responseTime = Date.now() - startTime
        return NextResponse.json({
          success: true,
          data: fromFile,
          message: 'Featured tours from fallback storage',
          responseTime: `${responseTime}ms`
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
        })
      }
      const responseTime = Date.now() - startTime
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No featured tours available',
        responseTime: `${responseTime}ms`
      }, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      })
    }
    
    // Transform database field names to frontend format
    const featured = (data || []).map((tour: Tour) => ({
      ...tour,
      keyExperiences: (tour as any).key_experiences || [],
      createdAt: (tour as any).created_at || (tour as any).createdat || new Date().toISOString(),
      updatedAt: (tour as any).updated_at || (tour as any).updatedat || new Date().toISOString(),
      importantInfo: (tour as any).important_info || (tour as any).importantInfo || {},
      groupSize: (tour as any).group_size ?? (tour as any).groupsize ?? (tour as any).groupSize ?? ((tour as any).important_info as Record<string, unknown>)?.groupSize ?? '',
      bestTime: (tour as any).best_time ?? (tour as any).besttime ?? (tour as any).bestTime ?? ((tour as any).important_info as Record<string, unknown>)?.bestTime ?? ''
    }))
    if (featured.length > 0) {
      featuredToursCache = featured
      cacheTimestamp = now
    } else {
      featuredToursCache = null
    }
    const responseTime = Date.now() - startTime
    return NextResponse.json({ 
      success: true, 
      data: featured,
      message: 'Featured tours retrieved successfully',
      responseTime: `${responseTime}ms`
    }, {
      headers: featured.length > 0
        ? { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
        : { 'Cache-Control': 'no-store, must-revalidate' },
    })
  } catch (error) {
    console.error('Error fetching featured tours:', error)
    featuredToursCache = null
    const fallbackTours = loadFallbackTours()
    const featured = fallbackTours.filter(t => t.featured === true)
    const responseTime = Date.now() - startTime
    return NextResponse.json({ 
      success: true, 
      data: featured,
      message: featured.length > 0 ? 'Featured tours from fallback due to error' : 'No featured tours available',
      responseTime: `${responseTime}ms`
    }, {
      headers: featured.length > 0
        ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
        : { 'Cache-Control': 'no-store, must-revalidate' },
    })
  }
}

