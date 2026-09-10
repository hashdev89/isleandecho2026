import fs from 'fs'
import path from 'path'
import type { Vehicle } from '@/lib/vehicleTypes'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'vehicles.json')

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'toyota-axio-hybrid',
    name: 'Toyota Axio Hybrid',
    category: 'compact',
    basePricePerDay: 55,
    includedKmPerDay: 100,
    extraKmRate: 0.35,
    oneWayDropoffFee: 20,
    seats: 5,
    passengers: 4,
    luggage: 2,
    doors: 4,
    airConditioning: true,
    automatic: true,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    features: ['Air Conditioning', 'Automatic', 'Hybrid', 'Bluetooth', 'USB Ports'],
    images: ['/placeholder-image.svg'],
    description:
      'Efficient sedan with driver — ideal for city transfers and comfortable multi-day touring.',
    badge: 'Popular',
    status: 'active',
    featured: true,
    rating: 4.8,
    reviews: 112,
  },
  {
    id: 'toyota-corolla',
    name: 'Toyota Corolla',
    category: 'economy',
    basePricePerDay: 48,
    includedKmPerDay: 100,
    extraKmRate: 0.3,
    oneWayDropoffFee: 20,
    seats: 5,
    passengers: 4,
    luggage: 2,
    doors: 4,
    airConditioning: true,
    automatic: true,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    features: ['Air Conditioning', 'Bluetooth', 'USB Ports', '5 Seats'],
    images: ['/placeholder-image.svg'],
    description:
      'Reliable and fuel-efficient sedan ideal for city drives and coastal routes across Sri Lanka.',
    badge: 'Value',
    status: 'active',
    featured: true,
    rating: 4.6,
    reviews: 234,
  },
  {
    id: 'toyota-hilux',
    name: 'Toyota Hilux',
    category: 'suv',
    basePricePerDay: 85,
    includedKmPerDay: 120,
    extraKmRate: 0.4,
    oneWayDropoffFee: 30,
    seats: 5,
    passengers: 4,
    luggage: 3,
    doors: 4,
    airConditioning: true,
    automatic: true,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    features: ['4WD', 'Air Conditioning', 'Dual Airbags', '5 Seats'],
    images: ['/placeholder-image.svg'],
    description: 'Rugged pickup perfect for hill country roads, wildlife parks, and long-distance travel.',
    badge: 'Adventure',
    status: 'active',
    featured: true,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 'micro-bus-14',
    name: 'Micro Bus (14 Seater)',
    category: 'van',
    basePricePerDay: 120,
    includedKmPerDay: 150,
    extraKmRate: 0.5,
    oneWayDropoffFee: 40,
    seats: 14,
    passengers: 12,
    luggage: 8,
    doors: 4,
    airConditioning: true,
    automatic: false,
    transmission: 'Manual',
    fuelType: 'Diesel',
    features: ['Air Conditioning', 'Luggage Space', '14 Seats', 'Group Travel'],
    images: ['/placeholder-image.svg'],
    description: 'Spacious van for families and small groups touring multiple cities in one trip.',
    badge: 'Groups',
    status: 'active',
    featured: false,
    rating: 4.5,
    reviews: 89,
  },
]

let vehiclesCache: Vehicle[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000

const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true })
    } catch {
      // Vercel / serverless: filesystem is often read-only
    }
  }
}

function readLocalVehicles(): Vehicle[] | null {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) return null
    const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'))
    return Array.isArray(parsed) ? (parsed as Vehicle[]) : null
  } catch {
    return null
  }
}

/** Best-effort local write — returns false on read-only hosts (e.g. Vercel). */
function writeLocalVehicles(vehicles: Vehicle[]): boolean {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(vehicles, null, 2))
    return true
  } catch (error) {
    console.warn('writeLocalVehicles skipped (read-only filesystem):', error)
    return false
  }
}

function vehicleStamp(v: Vehicle): number {
  const t = Date.parse(v.updatedAt || v.createdAt || '')
  return Number.isFinite(t) ? t : 0
}

function collectionStamp(vehicles: Vehicle[]): number {
  if (!vehicles.length) return 0
  return vehicles.reduce((max, v) => Math.max(max, vehicleStamp(v)), 0)
}

/** Prefer newer records per id so local saves are not wiped by stale remote JSON. */
function mergeVehicleLists(primary: Vehicle[], secondary: Vehicle[]): Vehicle[] {
  const map = new Map<string, Vehicle>()
  for (const v of secondary) {
    if (v?.id) map.set(v.id, v)
  }
  for (const v of primary) {
    if (!v?.id) continue
    const existing = map.get(v.id)
    if (!existing || vehicleStamp(v) >= vehicleStamp(existing)) {
      map.set(v.id, v)
    }
  }
  return Array.from(map.values())
}

export async function loadVehicles(): Promise<Vehicle[]> {
  try {
    const now = Date.now()
    if (vehiclesCache && now - cacheTimestamp < CACHE_DURATION) {
      return vehiclesCache
    }

    const local = readLocalVehicles()
    const remote = await loadAppJson<Vehicle[]>('vehicles.json')
    const remoteList = Array.isArray(remote) && remote.length > 0 ? remote : null

    let merged: Vehicle[]
    if (local?.length && remoteList) {
      // Keep whichever side is newer per vehicle; never discard local-only creates
      const localNewer = collectionStamp(local) >= collectionStamp(remoteList)
      merged = localNewer
        ? mergeVehicleLists(local, remoteList)
        : mergeVehicleLists(remoteList, local)
    } else if (local?.length) {
      merged = local
    } else if (remoteList) {
      merged = remoteList
    } else {
      merged = DEFAULT_VEHICLES
    }

    writeLocalVehicles(merged)
    vehiclesCache = merged
    cacheTimestamp = now

    // Push merged list to remote when local was ahead or remote missing entries
    if (
      !remoteList ||
      collectionStamp(merged) > collectionStamp(remoteList) ||
      merged.length !== remoteList.length
    ) {
      void saveAppJson('vehicles.json', merged)
    }

    return merged
  } catch (error) {
    console.error('Error loading vehicles:', error)
    return readLocalVehicles() || DEFAULT_VEHICLES
  }
}

export async function saveVehicles(vehicles: Vehicle[]) {
  const stamped = vehicles.map((v) => ({
    ...v,
    updatedAt: v.updatedAt || new Date().toISOString(),
  }))

  // Update memory first so this request sees the new list immediately
  vehiclesCache = stamped
  cacheTimestamp = Date.now()

  const localOk = writeLocalVehicles(stamped)
  const remoteOk = await saveAppJson('vehicles.json', stamped)

  if (!localOk && !remoteOk) {
    throw new Error(
      'Could not persist vehicles. On live hosting the server filesystem is read-only — configure Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) and ensure the site-content storage bucket allows uploads.'
    )
  }

  if (!remoteOk) {
    console.warn('Vehicles saved locally only; Supabase sync unavailable or failed')
  }

  return stamped
}

export function invalidateVehiclesCache() {
  vehiclesCache = null
  cacheTimestamp = 0
}
