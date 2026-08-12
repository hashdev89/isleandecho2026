import fs from 'fs'
import path from 'path'
import type { Vehicle } from '@/lib/vehicleTypes'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'vehicles.json')

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'toyota-corolla',
    name: 'Toyota Corolla',
    category: 'economy',
    basePricePerDay: 8500,
    includedKmPerDay: 100,
    extraKmRate: 45,
    oneWayDropoffFee: 2500,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    features: ['Air Conditioning', 'Bluetooth', 'USB Ports', '5 Seats'],
    images: ['/placeholder-image.svg'],
    description:
      'Reliable and fuel-efficient sedan ideal for city drives and coastal routes across Sri Lanka.',
    badge: 'Popular',
    status: 'active',
    featured: true,
    rating: 4.6,
    reviews: 234,
  },
  {
    id: 'toyota-hilux',
    name: 'Toyota Hilux',
    category: 'suv',
    basePricePerDay: 14500,
    includedKmPerDay: 120,
    extraKmRate: 55,
    oneWayDropoffFee: 3500,
    seats: 5,
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
    basePricePerDay: 22000,
    includedKmPerDay: 150,
    extraKmRate: 65,
    oneWayDropoffFee: 5000,
    seats: 14,
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
  {
    id: 'bmw-5-series',
    name: 'BMW 5 Series',
    category: 'luxury',
    basePricePerDay: 28000,
    includedKmPerDay: 100,
    extraKmRate: 85,
    oneWayDropoffFee: 6000,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    features: ['Leather Seats', 'Navigation', 'Premium Audio', '5 Seats'],
    images: ['/placeholder-image.svg'],
    description: 'Premium sedan for executive travel and special occasions with comfort and style.',
    badge: 'Premium',
    status: 'active',
    featured: true,
    rating: 4.9,
    reviews: 67,
  },
]

let vehiclesCache: Vehicle[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000

const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

export async function loadVehicles(): Promise<Vehicle[]> {
  try {
    const now = Date.now()
    if (vehiclesCache && now - cacheTimestamp < CACHE_DURATION) {
      return vehiclesCache
    }

    const remote = await loadAppJson<Vehicle[]>('vehicles.json')
    if (Array.isArray(remote) && remote.length > 0) {
      vehiclesCache = remote
      cacheTimestamp = now
      try {
        ensureDataDir()
        fs.writeFileSync(FALLBACK_FILE, JSON.stringify(remote, null, 2))
      } catch {
        /* local cache is optional */
      }
      return remote
    }

    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8')) as Vehicle[]
      vehiclesCache = parsed.length ? parsed : DEFAULT_VEHICLES
    } else {
      vehiclesCache = DEFAULT_VEHICLES
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(DEFAULT_VEHICLES, null, 2))
    }
    cacheTimestamp = now
    if (vehiclesCache.length) {
      await saveAppJson('vehicles.json', vehiclesCache)
    }
    return vehiclesCache
  } catch (error) {
    console.error('Error loading vehicles:', error)
    return DEFAULT_VEHICLES
  }
}

export async function saveVehicles(vehicles: Vehicle[]) {
  ensureDataDir()
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(vehicles, null, 2))
  vehiclesCache = vehicles
  cacheTimestamp = Date.now()
  await saveAppJson('vehicles.json', vehicles)
}

export function invalidateVehiclesCache() {
  vehiclesCache = null
  cacheTimestamp = 0
}
