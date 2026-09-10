import { NextRequest, NextResponse } from 'next/server'

export interface SriLankaPlaceResult {
  id: string
  name: string
  placeName: string
  lat: number
  lng: number
  region?: string
}

/** Curated fallback when Mapbox token is missing */
const FALLBACK_PLACES: SriLankaPlaceResult[] = [
  { id: 'kandy', name: 'Kandy', placeName: 'Kandy, Central Province, Sri Lanka', lat: 7.2906, lng: 80.6337, region: 'Central' },
  { id: 'katunayake', name: 'Katunayake', placeName: 'Katunayake, Western Province, Sri Lanka', lat: 7.1643, lng: 79.873, region: 'Western' },
  { id: 'kegalle', name: 'Kegalle', placeName: 'Kegalle, Sabaragamuwa Province, Sri Lanka', lat: 7.2513, lng: 80.3464, region: 'Sabaragamuwa' },
  { id: 'kalutara', name: 'Kalutara', placeName: 'Kalutara, Western Province, Sri Lanka', lat: 6.5854, lng: 79.9607, region: 'Western' },
  { id: 'colombo', name: 'Colombo', placeName: 'Colombo, Western Province, Sri Lanka', lat: 6.9271, lng: 79.8612, region: 'Western' },
  { id: 'galle', name: 'Galle', placeName: 'Galle, Southern Province, Sri Lanka', lat: 6.0535, lng: 80.221, region: 'Southern' },
  { id: 'ella', name: 'Ella', placeName: 'Ella, Uva Province, Sri Lanka', lat: 6.8667, lng: 81.0466, region: 'Uva' },
  { id: 'nuwara-eliya', name: 'Nuwara Eliya', placeName: 'Nuwara Eliya, Central Province, Sri Lanka', lat: 6.9497, lng: 80.7891, region: 'Central' },
  { id: 'sigiriya', name: 'Sigiriya', placeName: 'Sigiriya, Central Province, Sri Lanka', lat: 7.957, lng: 80.7603, region: 'Central' },
  { id: 'trincomalee', name: 'Trincomalee', placeName: 'Trincomalee, Eastern Province, Sri Lanka', lat: 8.5874, lng: 81.2152, region: 'Eastern' },
  { id: 'jaffna', name: 'Jaffna', placeName: 'Jaffna, Northern Province, Sri Lanka', lat: 9.6615, lng: 80.0255, region: 'Northern' },
  { id: 'negombo', name: 'Negombo', placeName: 'Negombo, Western Province, Sri Lanka', lat: 7.2083, lng: 79.8358, region: 'Western' },
  { id: 'matara', name: 'Matara', placeName: 'Matara, Southern Province, Sri Lanka', lat: 5.9549, lng: 80.555, region: 'Southern' },
  { id: 'anuradhapura', name: 'Anuradhapura', placeName: 'Anuradhapura, North Central Province, Sri Lanka', lat: 8.3114, lng: 80.4037, region: 'North Central' },
  { id: 'bentota', name: 'Bentota', placeName: 'Bentota, Southern Province, Sri Lanka', lat: 6.4259, lng: 79.9951, region: 'Southern' },
  { id: 'mirissa', name: 'Mirissa', placeName: 'Mirissa, Southern Province, Sri Lanka', lat: 5.9483, lng: 80.4715, region: 'Southern' },
  { id: 'hikkaduwa', name: 'Hikkaduwa', placeName: 'Hikkaduwa, Southern Province, Sri Lanka', lat: 6.1395, lng: 80.1005, region: 'Southern' },
  { id: 'dambulla', name: 'Dambulla', placeName: 'Dambulla, Central Province, Sri Lanka', lat: 7.8742, lng: 80.6511, region: 'Central' },
  { id: 'polonnaruwa', name: 'Polonnaruwa', placeName: 'Polonnaruwa, North Central Province, Sri Lanka', lat: 7.9403, lng: 81.0188, region: 'North Central' },
  { id: 'yala', name: 'Yala', placeName: 'Yala National Park, Southern Province, Sri Lanka', lat: 6.3724, lng: 81.5185, region: 'Southern' },
]

function filterFallback(q: string): SriLankaPlaceResult[] {
  const needle = q.toLowerCase()
  return FALLBACK_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      p.placeName.toLowerCase().includes(needle) ||
      (p.region || '').toLowerCase().includes(needle)
  ).slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    if (!q) {
      return NextResponse.json({ success: true, data: [] })
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || ''
    if (!token) {
      return NextResponse.json({ success: true, data: filterFallback(q), source: 'fallback' })
    }

    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
    )
    url.searchParams.set('access_token', token)
    url.searchParams.set('country', 'lk')
    url.searchParams.set('language', 'en')
    url.searchParams.set('limit', '8')
    url.searchParams.set('types', 'place,locality,neighborhood,address,poi,district,region')

    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) {
      return NextResponse.json({ success: true, data: filterFallback(q), source: 'fallback' })
    }

    const json = await res.json()
    const features = Array.isArray(json.features) ? json.features : []
    const data: SriLankaPlaceResult[] = features
      .map((f: {
        id?: string
        text?: string
        place_name?: string
        center?: [number, number]
        context?: { id?: string; text?: string }[]
      }) => {
        const [lng, lat] = f.center || []
        if (typeof lat !== 'number' || typeof lng !== 'number') return null
        const region = f.context?.find((c) => String(c.id || '').startsWith('region'))?.text
        return {
          id: f.id || `${lat},${lng}`,
          name: f.text || f.place_name || 'Location',
          placeName: f.place_name || f.text || '',
          lat,
          lng,
          region,
        } as SriLankaPlaceResult
      })
      .filter(Boolean)

    // Merge curated matches first when query is short (e.g. "K" → Kandy, Katunayake…)
    const curated = filterFallback(q)
    const seen = new Set(data.map((d) => d.name.toLowerCase()))
    const merged = [
      ...curated.filter((c) => {
        if (seen.has(c.name.toLowerCase())) return false
        seen.add(c.name.toLowerCase())
        return true
      }),
      ...data,
    ].slice(0, 10)

    return NextResponse.json({ success: true, data: merged, source: 'mapbox' })
  } catch (error) {
    console.error('GET /api/places/sri-lanka error:', error)
    return NextResponse.json({ success: false, error: 'Place search failed' }, { status: 500 })
  }
}
