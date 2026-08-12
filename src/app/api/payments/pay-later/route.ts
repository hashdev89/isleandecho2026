import { NextRequest, NextResponse } from 'next/server'
import { updateBookingById } from '@/lib/bookingsData'
import { notifyPayLaterSelected, type BookingForEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { booking_id: bookingId } = await request.json()
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const updates = {
      payment_method: 'pay_later',
      payment_status: 'pending',
    }

    const booking = await updateBookingById(bookingId, updates)
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    await notifyPayLaterSelected(booking as BookingForEmail)

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Pay later selected. Confirmation emails sent.',
    })
  } catch (error) {
    console.error('Pay later error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not save pay later option' },
      { status: 500 }
    )
  }
}
