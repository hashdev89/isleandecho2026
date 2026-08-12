import { NextResponse } from 'next/server'
import { verifyPayHerePayment, mapPayHereStatusToPaymentStatus, PayHereStatus } from '@/lib/payhere'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
import { sendInvoiceEmail, notifyBookingUpdated } from '@/lib/emailService'
import { getPayHereCredentials, resolveBookingIdFromOrderId } from '@/lib/payhereCheckout'
import { findBookingById, updateBookingById } from '@/lib/bookingsData'

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

    let bookingData = await updateBookingById(bookingId, updateData)
    if (!bookingData) {
      bookingData = await findBookingById(bookingId)
    }

    if (statusCode === PayHereStatus.SUCCESS && bookingData) {
      try {
        if (!isDeposit) {
          const invoicePdf = await generateInvoicePDF(bookingData as Parameters<typeof generateInvoicePDF>[0])
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
        await notifyBookingUpdated(bookingData as import('@/lib/emailService').BookingForEmail, {
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
