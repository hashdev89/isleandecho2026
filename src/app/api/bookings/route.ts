import { NextResponse } from 'next/server'
import { applyBookingFilters, createBooking, loadAllBookings } from '@/lib/bookingsData'
import { notifyBookingCreated, type BookingForEmail } from '@/lib/emailService'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type')
    const userEmail = request.headers.get('x-user-email') || ''
    const userRole = request.headers.get('x-user-role') || ''

    const merged = await loadAllBookings()
    const filtered = applyBookingFilters(merged, userRole, userEmail, typeFilter)

    return NextResponse.json({
      success: true,
      data: filtered,
      message: 'Bookings retrieved',
    })
  } catch (error: unknown) {
    console.error('Bookings API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load bookings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('POST /api/bookings - Received booking data:', body)

    const saved = await createBooking(body)
    const checkoutId = saved.booking_ref || saved.id

    try {
      await notifyBookingCreated(saved as BookingForEmail)
    } catch (emailError) {
      console.error('Booking created but email failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      data: { ...saved, id: checkoutId },
      message: 'Booking created successfully',
    })
  } catch (error: unknown) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create booking' },
      { status: 500 }
    )
  }
}
