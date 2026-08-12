import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'
import { notifyPayLaterSelected, type BookingForEmail } from '@/lib/emailService'

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'bookings.json')

const loadFallbackBookings = () => {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading fallback bookings:', error)
  }
  return []
}

const saveFallbackBookings = (bookings: unknown[]) => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(bookings, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const { booking_id: bookingId } = await request.json()
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const updates = {
      payment_method: 'pay_later',
      payment_status: 'pending',
      updated_at: new Date().toISOString(),
    }

    let booking: BookingForEmail | null = null

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select('*')
        .single()
      if (!error && data) booking = data as BookingForEmail
    }

    if (!booking) {
      const fallback = loadFallbackBookings()
      const index = fallback.findIndex((b: { id: string }) => b.id === bookingId)
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }
      fallback[index] = { ...fallback[index], ...updates }
      saveFallbackBookings(fallback)
      booking = fallback[index] as BookingForEmail
    }

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    await notifyPayLaterSelected(booking)

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
