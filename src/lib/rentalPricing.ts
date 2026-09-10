import { haversineKm } from '@/lib/geoDistance'
import type {
  AdditionalCharge,
  RentalQuote,
  RentalQuoteBreakdownLine,
  RentalQuoteMode,
  RentalSettings,
  Vehicle,
} from '@/lib/vehicleTypes'

export interface RentalQuoteInput {
  vehicle: Vehicle
  settings: RentalSettings
  mode?: RentalQuoteMode
  pickupLat: number
  pickupLng: number
  pickupCityName: string
  dropoffLat: number
  dropoffLng: number
  dropoffCityName: string
  pickupDate: string
  returnDate: string
  selectedChargeIds?: string[]
}

function rentalDays(pickupDate: string, returnDate: string): number {
  const start = new Date(pickupDate)
  const end = new Date(returnDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

function roundCurrency(n: number): number {
  return Math.round(n * 100) / 100
}

function chargeAmount(charge: AdditionalCharge, days: number, estimatedKm: number): number {
  switch (charge.type) {
    case 'per_day':
      return roundCurrency(charge.amount * days)
    case 'per_km':
      return roundCurrency(charge.amount * estimatedKm)
    case 'flat':
    default:
      return roundCurrency(charge.amount)
  }
}

export function calculateRentalQuote(input: RentalQuoteInput): RentalQuote {
  const {
    vehicle,
    settings,
    mode = 'multi_day',
    pickupLat,
    pickupLng,
    pickupCityName,
    dropoffLat,
    dropoffLng,
    dropoffCityName,
    pickupDate,
    returnDate,
    selectedChargeIds = [],
  } = input

  const multiplier = settings.roadDistanceMultiplier || 1.25
  const oneWayKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng)
  const routeKm = roundCurrency(oneWayKm * multiplier)
  const unitRatePerKm = settings.dropoffUnitRatePerKm ?? settings.defaultExtraKmRate ?? 0

  if (mode === 'dropoff') {
    const dropoffDistanceCharge = roundCurrency(routeKm * unitRatePerKm)
    const priceAvailable = unitRatePerKm > 0 && routeKm > 0
    const breakdown: RentalQuoteBreakdownLine[] = priceAvailable
      ? [
          {
            label: `Distance (${routeKm} km × ${unitRatePerKm} ${settings.currency}/km)`,
            amount: dropoffDistanceCharge,
          },
        ]
      : []

    return {
      mode: 'dropoff',
      days: 1,
      routeKm,
      estimatedDrivingKm: routeKm,
      includedKm: 0,
      extraKm: 0,
      baseRent: 0,
      extraKmCharge: 0,
      oneWayFee: 0,
      dropoffDistanceCharge: priceAvailable ? dropoffDistanceCharge : 0,
      unitRatePerKm,
      additionalCharges: [],
      additionalChargesTotal: 0,
      totalPrice: priceAvailable ? dropoffDistanceCharge : 0,
      priceAvailable,
      breakdown,
      currency: settings.currency || 'USD',
      pickupCityName,
      dropoffCityName,
      withDriver: true,
    }
  }

  const days = rentalDays(pickupDate, returnDate)
  const isOneWay = pickupCityName.trim().toLowerCase() !== dropoffCityName.trim().toLowerCase()
  const estimatedDrivingKm = isOneWay ? roundCurrency(routeKm * 2) : roundCurrency(routeKm)

  const includedKmPerDay = vehicle.includedKmPerDay || settings.defaultIncludedKmPerDay
  const includedKm = includedKmPerDay * days
  const extraKm = Math.max(0, roundCurrency(estimatedDrivingKm - includedKm))

  const extraKmRate = vehicle.extraKmRate || settings.defaultExtraKmRate
  const baseRent = roundCurrency(vehicle.basePricePerDay * days)
  const extraKmCharge = roundCurrency(extraKm * extraKmRate)
  const oneWayFee = isOneWay
    ? roundCurrency(vehicle.oneWayDropoffFee ?? settings.defaultOneWayFee)
    : 0

  const enabledCharges = (settings.additionalCharges || []).filter(
    (c) => c.enabled !== false && selectedChargeIds.includes(c.id)
  )

  const additionalLines: RentalQuoteBreakdownLine[] = enabledCharges.map((charge) => ({
    label: charge.label,
    amount: chargeAmount(charge, days, estimatedDrivingKm),
  }))

  const additionalChargesTotal = roundCurrency(
    additionalLines.reduce((sum, line) => sum + line.amount, 0)
  )

  const breakdown: RentalQuoteBreakdownLine[] = [
    { label: `Base rent with driver (${days} day${days === 1 ? '' : 's'})`, amount: baseRent },
  ]

  if (extraKmCharge > 0) {
    breakdown.push({
      label: `Extra km (${extraKm} km × ${extraKmRate} ${settings.currency})`,
      amount: extraKmCharge,
    })
  }

  if (oneWayFee > 0) {
    breakdown.push({ label: 'One-way drop-off fee', amount: oneWayFee })
  }

  breakdown.push(...additionalLines)

  const totalPrice = roundCurrency(baseRent + extraKmCharge + oneWayFee + additionalChargesTotal)

  return {
    mode: 'multi_day',
    days,
    routeKm,
    estimatedDrivingKm,
    includedKm,
    extraKm,
    baseRent,
    extraKmCharge,
    oneWayFee,
    dropoffDistanceCharge: 0,
    unitRatePerKm: extraKmRate,
    additionalCharges: additionalLines,
    additionalChargesTotal,
    totalPrice,
    priceAvailable: true,
    breakdown,
    currency: settings.currency || 'USD',
    pickupCityName,
    dropoffCityName,
    withDriver: true,
  }
}

export function formatRentalCurrency(amount: number, currency = 'USD'): string {
  const code = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: code === 'USD' || code === 'EUR' ? 2 : 0,
    }).format(amount)
  } catch {
    return `${code} ${amount.toLocaleString('en-US', {
      maximumFractionDigits: code === 'USD' ? 2 : 0,
    })}`
  }
}
