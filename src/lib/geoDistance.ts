export interface GeoPoint {
  name: string
  lat: number
  lng: number
  region?: string
}

export interface RouteSegment {
  from: GeoPoint
  to: GeoPoint
  distanceKm: number
  midpoint: { lat: number; lng: number }
}

/** Bandaranaike International Airport (CMB / BIA) — Katunayake */
export const BIA_AIRPORT: GeoPoint = {
  name: 'BIA (Bandaranaike International Airport)',
  lat: 7.180756,
  lng: 79.884117,
  region: 'Katunayake',
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function isBiaAirportPoint(point: GeoPoint): boolean {
  const name = (point.name || '').toLowerCase()
  if (
    /\bbia\b/.test(name) ||
    name.includes('bandaranaike') ||
    (name.includes('airport') &&
      (name.includes('katunayake') || name.includes('colombo') || name.includes('cmb')))
  ) {
    return true
  }
  return haversineKm(point.lat, point.lng, BIA_AIRPORT.lat, BIA_AIRPORT.lng) < 5
}

/**
 * Ensure the route is a complete loop: start at BIA and finish back at BIA.
 * Used for tour packages and Plan Your Trip mileage/maps.
 */
export function withBiaAirportLoop(destinations: GeoPoint[]): GeoPoint[] {
  const stops = destinations.filter(
    (d) =>
      d &&
      typeof d.lat === 'number' &&
      typeof d.lng === 'number' &&
      !Number.isNaN(d.lat) &&
      !Number.isNaN(d.lng)
  )
  if (stops.length === 0) return []

  const route = [...stops]
  if (!isBiaAirportPoint(route[0])) {
    route.unshift({ ...BIA_AIRPORT })
  }
  if (!isBiaAirportPoint(route[route.length - 1])) {
    route.push({ ...BIA_AIRPORT })
  }
  return route
}

export function getRouteSegments(destinations: GeoPoint[]): RouteSegment[] {
  const segments: RouteSegment[] = []
  for (let i = 0; i < destinations.length - 1; i++) {
    const from = destinations[i]
    const to = destinations[i + 1]
    segments.push({
      from,
      to,
      distanceKm: haversineKm(from.lat, from.lng, to.lat, to.lng),
      midpoint: {
        lat: (from.lat + to.lat) / 2,
        lng: (from.lng + to.lng) / 2,
      },
    })
  }
  return segments
}

export function getTotalRouteKm(destinations: GeoPoint[]): number {
  return getRouteSegments(destinations).reduce((sum, seg) => sum + seg.distanceKm, 0)
}

/** Segments for a BIA → stops → BIA loop (packages / Plan Your Trip). */
export function getBiaLoopRouteSegments(destinations: GeoPoint[]): RouteSegment[] {
  return getRouteSegments(withBiaAirportLoop(destinations))
}

export function getBiaLoopTotalKm(destinations: GeoPoint[]): number {
  return getTotalRouteKm(withBiaAirportLoop(destinations))
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 100) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}
