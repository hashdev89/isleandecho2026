import { NextRequest, NextResponse } from 'next/server'
import { calculateRentalQuote } from '@/lib/rentalPricing'
import { loadRentalSettings } from '@/lib/rentalSettingsData'
import { loadVehicles } from '@/lib/vehiclesData'
import { findRentalLocation } from '@/lib/rentalLocations'
import type { RentalQuoteMode } from '@/lib/vehicleTypes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicleId,
      pickupLocationId,
      pickupCityId,
      dropoffCityId,
      dropoffLocationId,
      dropoffPlace,
      pickupDate,
      returnDate,
      mode = 'multi_day',
      selectedChargeIds = [],
    } = body as {
      vehicleId?: string
      pickupLocationId?: string
      pickupCityId?: string
      dropoffCityId?: string
      dropoffLocationId?: string
      dropoffPlace?: { name?: string; placeName?: string; lat?: number; lng?: number }
      pickupDate?: string
      returnDate?: string
      mode?: RentalQuoteMode
      selectedChargeIds?: string[]
    }

    const tripMode: RentalQuoteMode = mode === 'dropoff' ? 'dropoff' : 'multi_day'
    const pickupId = pickupLocationId || pickupCityId
    const dropoffId = dropoffLocationId || dropoffCityId

    if (!vehicleId || !pickupId || !pickupDate) {
      return NextResponse.json(
        {
          success: false,
          message: 'vehicleId, pickup location, and pickupDate are required',
        },
        { status: 400 }
      )
    }

    if (tripMode === 'multi_day' && !returnDate) {
      return NextResponse.json(
        { success: false, message: 'returnDate is required for multi-day tours' },
        { status: 400 }
      )
    }

    const vehicles = await loadVehicles()
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    const pickup = findRentalLocation(pickupId)
    if (!pickup) {
      return NextResponse.json(
        { success: false, message: 'Invalid pickup city' },
        { status: 400 }
      )
    }

    let dropoffLat = pickup.lat
    let dropoffLng = pickup.lng
    let dropoffName = pickup.name
    let resolvedDropoffId = pickup.id

    if (tripMode === 'dropoff') {
      const fromList = dropoffId ? findRentalLocation(dropoffId) : undefined
      if (fromList) {
        dropoffLat = fromList.lat
        dropoffLng = fromList.lng
        dropoffName = fromList.name
        resolvedDropoffId = fromList.id
      } else if (
        dropoffPlace &&
        typeof dropoffPlace.lat === 'number' &&
        typeof dropoffPlace.lng === 'number' &&
        dropoffPlace.name
      ) {
        // Legacy free-form place support
        dropoffLat = dropoffPlace.lat
        dropoffLng = dropoffPlace.lng
        dropoffName = dropoffPlace.placeName || dropoffPlace.name
        resolvedDropoffId = 'custom'
      } else {
        return NextResponse.json(
          { success: false, message: 'A valid drop-off city is required' },
          { status: 400 }
        )
      }
    }

    const settings = await loadRentalSettings()
    const quote = calculateRentalQuote({
      vehicle,
      settings,
      mode: tripMode,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupCityName: pickup.name,
      dropoffLat,
      dropoffLng,
      dropoffCityName: dropoffName,
      pickupDate,
      returnDate: returnDate || pickupDate,
      selectedChargeIds: Array.isArray(selectedChargeIds) ? selectedChargeIds : [],
    })

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        vehicle: { id: vehicle.id, name: vehicle.name },
        pickupLocationId: pickup.id,
        pickupCityId: pickup.id,
        dropoffCityId: tripMode === 'dropoff' ? resolvedDropoffId : pickup.id,
        dropoffPlace:
          tripMode === 'dropoff'
            ? { name: dropoffName, lat: dropoffLat, lng: dropoffLng }
            : null,
        pickupDate,
        returnDate: returnDate || pickupDate,
        availableCharges: (settings.additionalCharges || []).filter((c) => c.enabled !== false),
        withDriverOnly: true,
      },
    })
  } catch (error) {
    console.error('POST /api/rentals/quote error:', error)
    return NextResponse.json({ success: false, error: 'Failed to calculate quote' }, { status: 500 })
  }
}
