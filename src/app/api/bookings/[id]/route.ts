import { NextResponse } from 'next/server'
import {
  findBookingById,
  loadFallbackBookings,
  saveFallbackBookings,
  updateBookingById,
} from '@/lib/bookingsData'
import { notifyBookingUpdated, type BookingForEmail } from '@/lib/emailService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params

  try {
    console.log('GET /api/bookings/[id] - Fetching booking:', bookingId)
    const booking = await findBookingById(bookingId)

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: booking })
  } catch (error: unknown) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load booking' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params

  try {
    const body = await request.json()
    console.log('PUT /api/bookings/[id] - Updating booking:', bookingId, body)

    const existing = await findBookingById(bookingId)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const updated = await updateBookingById(bookingId, body)
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    try {
      await notifyBookingUpdated(updated as BookingForEmail, {
        status: existing.status,
        payment_status: existing.payment_status,
      })
    } catch (emailError) {
      console.error('Booking updated but follow-up email failed:', emailError)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: unknown) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params

  try {
    console.log('DELETE /api/bookings/[id] - Deleting booking:', bookingId)
    const existing = await findBookingById(bookingId)
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const fallback = loadFallbackBookings()
    const next = fallback.filter(
      (booking) => booking.id !== existing.id && booking.booking_ref !== existing.booking_ref
    )
    saveFallbackBookings(next)

    return NextResponse.json({
      success: true,
      data: existing,
      message: 'Booking removed from fallback storage',
    })
  } catch (error: unknown) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete booking' },
      { status: 500 }
    )
  }
}
