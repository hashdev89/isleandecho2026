import { NextRequest, NextResponse } from 'next/server'
import { calculateRentalQuote } from '@/lib/rentalPricing'
import { loadRentalSettings } from '@/lib/rentalSettingsData'
import { loadVehicles } from '@/lib/vehiclesData'
import { getDestinationsForServer } from '@/lib/destinationsData'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vehicleId,
      pickupCityId,
      dropoffCityId,
      pickupDate,
      returnDate,
      selectedChargeIds = [],
    } = body

    if (!vehicleId || !pickupCityId || !dropoffCityId || !pickupDate || !returnDate) {
      return NextResponse.json(
        { success: false, message: 'vehicleId, pickupCityId, dropoffCityId, pickupDate, and returnDate are required' },
        { status: 400 }
      )
    }

    const vehicles = loadVehicles()
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) {
      return NextResponse.json({ success: false, message: 'Vehicle not found' }, { status: 404 })
    }

    const destinations = await getDestinationsForServer()
    const pickup = destinations.find((d) => d.id === pickupCityId)
    const dropoff = destinations.find((d) => d.id === dropoffCityId)

    if (!pickup || !dropoff) {
      return NextResponse.json({ success: false, message: 'Invalid pickup or dropoff city' }, { status: 400 })
    }

    if (!pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) {
      return NextResponse.json(
        { success: false, message: 'Selected cities are missing map coordinates' },
        { status: 400 }
      )
    }

    const settings = loadRentalSettings()
    const quote = calculateRentalQuote({
      vehicle,
      settings,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupCityName: pickup.name,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffCityName: dropoff.name,
      pickupDate,
      returnDate,
      selectedChargeIds: Array.isArray(selectedChargeIds) ? selectedChargeIds : [],
    })

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        vehicle: { id: vehicle.id, name: vehicle.name },
        pickupCityId,
        dropoffCityId,
        pickupDate,
        returnDate,
        availableCharges: (settings.additionalCharges || []).filter((c) => c.enabled !== false),
      },
    })
  } catch (error) {
    console.error('POST /api/rentals/quote error:', error)
    return NextResponse.json({ success: false, error: 'Failed to calculate quote' }, { status: 500 })
  }
}
