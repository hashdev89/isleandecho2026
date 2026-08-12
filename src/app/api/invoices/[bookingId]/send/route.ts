import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'
import { generateInvoicePDF, getDepositBreakdown } from '@/lib/invoiceGenerator'
import { sendDepositInvoiceEmail, type BookingForEmail } from '@/lib/emailService'
import { buildDepositPaymentLink } from '@/lib/payhereCheckout'

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

async function getDepositPercent() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data } = await supabaseAdmin
        .from('settings')
        .select('booking_deposit')
        .eq('id', 'main')
        .single()
      if (data?.booking_deposit) return Number(data.booking_deposit)
    } catch {
      // use default
    }
  }
  return 50
}

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json().catch(() => ({}))
    const confirm = Boolean(body.confirm)
    const depositPercent = Number(body.depositPercent) || (await getDepositPercent()) || 50

    let booking: Record<string, unknown> | null = null

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data } = await supabaseAdmin.from('bookings').select('*').eq('id', bookingId).single()
      if (data) booking = data
    }

    if (!booking) {
      booking = loadFallbackBookings().find((b: { id: string }) => b.id === bookingId) || null
    }

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    let resolved: Record<string, unknown> = booking

    if (confirm) {
      const updates = {
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      }
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .update(updates)
          .eq('id', bookingId)
          .select('*')
          .single()
        if (!error && data) resolved = data
      }
      const fallback = loadFallbackBookings()
      const index = fallback.findIndex((b: { id: string }) => b.id === bookingId)
      if (index !== -1) {
        fallback[index] = { ...fallback[index], ...updates }
        saveFallbackBookings(fallback)
        resolved = { ...resolved, ...updates }
      }
    }

    const invoiceBooking = {
      id: String(resolved.id),
      tour_package_name: String(resolved.tour_package_name || resolved.vehicle_name || 'Isle & Echo booking'),
      customer_name: String(resolved.customer_name || ''),
      customer_email: String(resolved.customer_email || ''),
      customer_phone: resolved.customer_phone ? String(resolved.customer_phone) : '',
      start_date: String(resolved.start_date || ''),
      end_date: String(resolved.end_date || ''),
      guests: Number(resolved.guests || 1),
      total_price: Number(resolved.total_price || 0),
      payment_status: String(resolved.payment_status || 'pending'),
      payment_method: resolved.payment_method ? String(resolved.payment_method) : undefined,
      created_at: String(resolved.created_at || new Date().toISOString()),
      vehicle_name: resolved.vehicle_name ? String(resolved.vehicle_name) : undefined,
    }

    const paymentLink = buildDepositPaymentLink(String(resolved.id))
    const amounts = getDepositBreakdown(invoiceBooking.total_price, depositPercent)

    const pdf = await generateInvoicePDF(invoiceBooking, {
      mode: 'deposit',
      depositPercent,
      paymentLink,
    })

    await sendDepositInvoiceEmail(
      resolved as unknown as BookingForEmail,
      pdf,
      {
        total: formatLkr(amounts.total),
        deposit: formatLkr(amounts.deposit),
        balance: formatLkr(amounts.balance),
        percent: amounts.percent,
      },
      paymentLink
    )

    return NextResponse.json({
      success: true,
      message: confirm
        ? 'Tour confirmed. 50% invoice and PayHere payment link emailed to the customer.'
        : '50% invoice and PayHere payment link emailed to the customer.',
      data: {
        booking_id: bookingId,
        status: resolved.status,
        deposit: amounts.deposit,
        percent: amounts.percent,
        payment_link: paymentLink,
      },
    })
  } catch (error) {
    console.error('Send deposit invoice error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
