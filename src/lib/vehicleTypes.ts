export type VehicleCategory =
  | 'economy'
  | 'compact'
  | 'midsize'
  | 'suv'
  | 'luxury'
  | 'van'
  | 'sports'

export type VehicleStatus = 'active' | 'draft' | 'archived'

export interface Vehicle {
  id: string
  name: string
  category: VehicleCategory
  basePricePerDay: number
  includedKmPerDay: number
  extraKmRate: number
  oneWayDropoffFee?: number
  seats: number
  /** Passenger capacity shown on cards (defaults to seats) */
  passengers?: number
  luggage?: number
  doors?: number
  airConditioning?: boolean
  automatic?: boolean
  transmission: string
  fuelType: string
  features: string[]
  images: string[]
  description?: string
  badge?: string
  status: VehicleStatus
  featured?: boolean
  rating?: number
  reviews?: number
  createdAt?: string
  updatedAt?: string
}

export function getVehiclePrimaryImage(vehicle: Pick<Vehicle, 'images'>): string {
  const src = vehicle.images?.find((img) => typeof img === 'string' && img.trim().length > 0)
  return src || '/placeholder-image.svg'
}

export type AdditionalChargeType = 'flat' | 'per_day' | 'per_km'

export interface AdditionalCharge {
  id: string
  label: string
  amount: number
  type: AdditionalChargeType
  enabled?: boolean
}

export interface RentalSettings {
  currency: string
  defaultIncludedKmPerDay: number
  defaultExtraKmRate: number
  defaultOneWayFee: number
  /** Unit rate used for Drop off (with driver): Total = distanceKm × this rate */
  dropoffUnitRatePerKm: number
  roadDistanceMultiplier: number
  additionalCharges: AdditionalCharge[]
  updatedAt?: string
}

export interface RentalQuoteBreakdownLine {
  label: string
  amount: number
}

export type RentalQuoteMode = 'multi_day' | 'dropoff'

export interface RentalQuote {
  mode: RentalQuoteMode
  days: number
  routeKm: number
  estimatedDrivingKm: number
  includedKm: number
  extraKm: number
  baseRent: number
  extraKmCharge: number
  oneWayFee: number
  dropoffDistanceCharge: number
  unitRatePerKm: number
  additionalCharges: RentalQuoteBreakdownLine[]
  additionalChargesTotal: number
  totalPrice: number
  /** False when drop-off destination has no rate / needs manual quotation */
  priceAvailable: boolean
  breakdown: RentalQuoteBreakdownLine[]
  currency: string
  pickupCityName: string
  dropoffCityName: string
  withDriver: true
}
