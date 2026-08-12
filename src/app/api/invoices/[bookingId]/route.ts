import { NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
import { findBookingById } from '@/lib/bookingsData'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const resolvedParams = await params
    const bookingId = resolvedParams.bookingId
    
    console.log('GET /api/invoices/[bookingId] - Fetching invoice for booking:', bookingId)
    
    const bookingData = await findBookingById(bookingId)
    
    if (!bookingData) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Generate invoice PDF
    const invoicePdf = await generateInvoicePDF(bookingData as Parameters<typeof generateInvoicePDF>[0])
    
    // Convert Buffer to Uint8Array for NextResponse
    const pdfArray = new Uint8Array(invoicePdf)
    
    // Return PDF as response
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${bookingId}.pdf"`,
        'Content-Length': invoicePdf.length.toString()
      }
    })
  } catch (error: unknown) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}

