import { NextRequest, NextResponse } from 'next/server'
import { loadRentalSettings, saveRentalSettings } from '@/lib/rentalSettingsData'
import type { RentalSettings } from '@/lib/vehicleTypes'

export async function GET() {
  try {
    const settings = await loadRentalSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('GET /api/rental-settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as RentalSettings
    const current = await loadRentalSettings()
    const updated: RentalSettings = {
      ...current,
      ...body,
      currency: String(body.currency || current.currency || 'USD').toUpperCase(),
      dropoffUnitRatePerKm: Number(
        body.dropoffUnitRatePerKm ?? current.dropoffUnitRatePerKm ?? 0.45
      ),
      defaultIncludedKmPerDay: Number(
        body.defaultIncludedKmPerDay ?? current.defaultIncludedKmPerDay
      ),
      defaultExtraKmRate: Number(body.defaultExtraKmRate ?? current.defaultExtraKmRate),
      defaultOneWayFee: Number(body.defaultOneWayFee ?? current.defaultOneWayFee),
      roadDistanceMultiplier: Number(
        body.roadDistanceMultiplier ?? current.roadDistanceMultiplier
      ),
      additionalCharges: Array.isArray(body.additionalCharges)
        ? body.additionalCharges
        : current.additionalCharges,
      updatedAt: new Date().toISOString(),
    }
    const saved = await saveRentalSettings(updated)
    return NextResponse.json({ success: true, data: saved, message: 'Rental settings saved' })
  } catch (error) {
    console.error('PUT /api/rental-settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 })
  }
}
