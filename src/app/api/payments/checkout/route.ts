import { NextResponse } from 'next/server'
import { createPayHereCheckout, type PayHerePurpose } from '@/lib/payhereCheckout'

interface CheckoutRequest {
  bookingId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress?: string
  customerCity?: string
  customerCountry?: string
  tourName: string
  purpose?: PayHerePurpose
}

export async function POST(req: Request) {
  try {
    const body: CheckoutRequest = await req.json()

    if (!body.bookingId || !body.customerName || !body.customerEmail || !body.tourName) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      )
    }

    const checkout = await createPayHereCheckout({
      bookingId: body.bookingId,
      amount: body.amount,
      currency: body.currency,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerCity: body.customerCity,
      customerCountry: body.customerCountry,
      itemName: body.tourName,
      purpose: body.purpose || 'full',
    })

    return NextResponse.json({
      success: true,
      data: checkout,
    })
  } catch (error: unknown) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
