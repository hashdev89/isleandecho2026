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
  roadDistanceMultiplier: number
  additionalCharges: AdditionalCharge[]
  updatedAt?: string
}

export interface RentalQuoteBreakdownLine {
  label: string
  amount: number
}

export interface RentalQuote {
  days: number
  routeKm: number
  estimatedDrivingKm: number
  includedKm: number
  extraKm: number
  baseRent: number
  extraKmCharge: number
  oneWayFee: number
  additionalCharges: RentalQuoteBreakdownLine[]
  additionalChargesTotal: number
  totalPrice: number
  breakdown: RentalQuoteBreakdownLine[]
  currency: string
  pickupCityName: string
  dropoffCityName: string
}
