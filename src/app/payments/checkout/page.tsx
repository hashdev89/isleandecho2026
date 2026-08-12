'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import Header from '../../../components/Header'
import PayHereCheckout from '../../../components/PayHereCheckout'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payLaterLoading, setPayLaterLoading] = useState(false)
  const [payLaterDone, setPayLaterDone] = useState(false)
  const [payLaterError, setPayLaterError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setError('Booking ID is required')
      setLoading(false)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      const result = await response.json()
      
      if (result.success) {
        setBooking(result.data)
        if (result.data?.payment_method === 'pay_later') {
          setPayLaterDone(true)
        }
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto lp-gutter py-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-600">{error || 'Booking not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const handlePayLater = async () => {
    setPayLaterLoading(true)
    setPayLaterError(null)
    try {
      const response = await fetch('/api/payments/pay-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: booking.id }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not save pay later option')
      }
      setBooking(result.data)
      setPayLaterDone(true)
    } catch (err) {
      setPayLaterError(err instanceof Error ? err.message : 'Could not save pay later option')
    } finally {
      setPayLaterLoading(false)
    }
  }

  const depositDue = Math.round((Number(booking.total_price) || 0) * 0.5 * 100) / 100
  const formatLkr = (amount: number) =>
    `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (payLaterDone) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto lp-gutter py-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-[var(--lagoon)] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Pay after selected</h1>
            <p className="text-gray-600 mb-6">
              Thank you, {booking.customer_name}. We have emailed you and our team. When your tour is confirmed, you will receive an invoice to pay <strong>50%</strong> ({formatLkr(depositDue)}) to secure the booking.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-left mb-6">
              <p><strong>Booking:</strong> {booking.id}</p>
              <p><strong>Package:</strong> {booking.tour_package_name}</p>
              <p><strong>Total:</strong> {formatLkr(Number(booking.total_price) || 0)}</p>
              <p><strong>Due on confirmation:</strong> {formatLkr(depositDue)}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[var(--lagoon-deep)] text-white font-semibold hover:bg-[var(--lagoon)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-3xl mx-auto lp-gutter py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Complete Your Payment</h1>
          
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tour:</span>
                <span className="font-medium">{booking.tour_package_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">{booking.guests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Travel Dates:</span>
                <div className="text-right">
                  <div className="font-medium text-blue-600">
                    {new Date(booking.start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })} - {new Date(booking.end_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">Total Amount:</span>
                <span className="text-blue-600">{formatLkr(Number(booking.total_price) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-600">50% to confirm later:</span>
                <span className="font-semibold text-[var(--lagoon-deep)]">{formatLkr(depositDue)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Name:</strong> {booking.customer_name}</p>
              <p><strong>Email:</strong> {booking.customer_email}</p>
              <p><strong>Phone:</strong> {booking.customer_phone}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
            
            {/* PayHere Option */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {/* PayHere Logo */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <img 
                      src="https://www.payhere.lk/images/payhere-logo.png" 
                      alt="PayHere Logo" 
                      className="h-12 w-auto"
                      onError={(e) => {
                        // Fallback if logo fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div className="hidden items-center justify-center h-12 w-32 bg-green-600 rounded text-white font-bold text-sm">
                      PayHere
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">PayHere</h3>
                    <p className="text-sm text-gray-600">Secure payment gateway supporting cards, mobile wallets, and more</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Button */}
              <PayHereCheckout
                bookingId={booking.id}
                amount={parseFloat(booking.total_price)}
                currency="LKR"
                customerName={booking.customer_name}
                customerEmail={booking.customer_email}
                customerPhone={booking.customer_phone}
                customerAddress="N/A" // You may want to add address field to booking
                customerCity="N/A" // You may want to add city field to booking
                customerCountry="Sri Lanka"
                tourName={booking.tour_package_name}
                onError={(error) => {
                  alert(`Payment Error: ${error}`)
                }}
              />
            </div>
            
            <p className="text-xs text-gray-500 text-center mb-6">
              You will be redirected to PayHere secure payment gateway to complete your payment.
            </p>

            <div className="border-2 border-dashed border-[var(--lagoon)]/30 rounded-lg p-6 bg-[var(--foam)]">
              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-6 h-6 text-[var(--lagoon)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pay after</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Confirm the request now and pay later. We will email you and our team. When the tour is confirmed, you will receive an invoice to pay <strong>50%</strong> ({formatLkr(depositDue)}) to secure the booking. The balance is due before travel.
                  </p>
                </div>
              </div>
              {payLaterError && <p className="text-sm text-red-600 mb-3">{payLaterError}</p>}
              <button
                type="button"
                onClick={handlePayLater}
                disabled={payLaterLoading}
                className="w-full min-h-[48px] rounded-full bg-white border-2 border-[var(--lagoon-deep)] text-[var(--lagoon-deep)] font-bold hover:bg-[var(--lagoon-deep)] hover:text-white transition-colors disabled:opacity-70"
              >
                {payLaterLoading ? 'Saving…' : 'Pay after — email me the next steps'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

