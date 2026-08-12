import { NextResponse } from 'next/server'
import { verifyPayHerePayment, mapPayHereStatusToPaymentStatus, PayHereStatus } from '@/lib/payhere'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
import { sendInvoiceEmail, notifyBookingUpdated } from '@/lib/emailService'
import { getPayHereCredentials, resolveBookingIdFromOrderId } from '@/lib/payhereCheckout'
import fs from 'fs'
import path from 'path'

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'bookings.json')

function updateFallbackBooking(bookingId: string, updates: Record<string, unknown>) {
  try {
    if (!fs.existsSync(FALLBACK_FILE)) return null
    const bookings = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'))
    const index = bookings.findIndex((b: { id: string }) => b.id === bookingId)
    if (index === -1) return null
    bookings[index] = { ...bookings[index], ...updates }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(bookings, null, 2))
    return bookings[index]
  } catch (error) {
    console.error('Fallback booking update failed:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const merchantId = formData.get('merchant_id') as string
    const orderId = formData.get('order_id') as string
    const paymentId = formData.get('payment_id') as string
    const payhereAmount = formData.get('payhere_amount') as string
    const payhereCurrency = formData.get('payhere_currency') as string
    const statusCode = formData.get('status_code') as string
    const md5sig = formData.get('md5sig') as string
    const method = formData.get('method') as string
    const statusMessage = formData.get('status_message') as string

    const { merchantSecret } = await getPayHereCredentials()

    if (!merchantSecret) {
      console.error('PayHere merchant secret not configured')
      return NextResponse.json({ success: false, error: 'Configuration error' }, { status: 500 })
    }

    const isValid = verifyPayHerePayment(
      merchantId,
      orderId,
      payhereAmount,
      payhereCurrency,
      statusCode,
      merchantSecret,
      md5sig
    )

    if (!isValid) {
      console.error('Invalid PayHere payment notification:', { orderId, md5sig })
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
    }

    const isDeposit = /-DEP$/i.test(orderId)
    const bookingId = resolveBookingIdFromOrderId(orderId)
    const mappedStatus = mapPayHereStatusToPaymentStatus(statusCode)
    const paymentStatus =
      statusCode === PayHereStatus.SUCCESS && isDeposit ? 'deposit_paid' : mappedStatus
    const bookingStatus = statusCode === PayHereStatus.SUCCESS ? 'confirmed' : 'pending'

    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      status: bookingStatus,
      updated_at: new Date().toISOString(),
      payment_method: isDeposit ? 'payhere_deposit' : method || 'payhere',
    }

    if (paymentId) updateData.payment_id = paymentId

    let bookingData = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: updatedBooking, error } = await supabaseAdmin
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating booking in Supabase:', error)
      } else {
        console.log('Booking updated successfully:', bookingId, paymentStatus)
        bookingData = updatedBooking
      }
    }

    const fallbackBooking = updateFallbackBooking(bookingId, updateData)
    if (!bookingData && fallbackBooking) bookingData = fallbackBooking

    if (statusCode === PayHereStatus.SUCCESS && bookingData) {
      try {
        if (!isDeposit) {
          const invoicePdf = await generateInvoicePDF(bookingData)
          await sendInvoiceEmail(
            bookingData.customer_email,
            bookingData.customer_name,
            bookingId,
            invoicePdf
          )
        }
      } catch (invoiceError) {
        console.error('Error generating/sending invoice:', invoiceError)
      }

      try {
        await notifyBookingUpdated(bookingData, {
          status: 'pending',
          payment_status: 'pending',
        })
      } catch (confirmationError) {
        console.error('Error sending payment update emails:', confirmationError)
      }
    }

    console.log('PayHere payment notification received:', {
      orderId,
      bookingId,
      isDeposit,
      paymentId,
      amount: payhereAmount,
      currency: payhereCurrency,
      statusCode,
      paymentStatus,
      method,
      statusMessage,
    })

    return NextResponse.json({ success: true, message: 'Payment notification processed' })
  } catch (error: unknown) {
    console.error('Payment notification error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
