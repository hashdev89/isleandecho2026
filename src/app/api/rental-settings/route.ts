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
      additionalCharges: Array.isArray(body.additionalCharges)
        ? body.additionalCharges
        : current.additionalCharges,
      updatedAt: new Date().toISOString(),
    }
    await saveRentalSettings(updated)
    return NextResponse.json({ success: true, data: updated, message: 'Rental settings saved' })
  } catch (error) {
    console.error('PUT /api/rental-settings error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 })
  }
}
