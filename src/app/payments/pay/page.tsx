'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck } from 'lucide-react'
import Header from '../../../components/Header'
import PayHereCheckout from '../../../components/PayHereCheckout'

function getDepositBreakdown(total: number, percent = 50) {
  const safeTotal = Number(total) || 0
  const safePercent = Math.min(100, Math.max(1, Number(percent) || 50))
  const deposit = Math.round(safeTotal * (safePercent / 100) * 100) / 100
  const balance = Math.round((safeTotal - deposit) * 100) / 100
  return { total: safeTotal, deposit, balance, percent: safePercent }
}

function PayContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id') || ''
  const purpose = (searchParams.get('purpose') || 'deposit') as 'deposit' | 'full'
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID is required')
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`, { cache: 'no-store' })
        const json = await res.json()
        if (!json.success || !json.data) throw new Error(json.error || 'Booking not found')
        setBooking(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--lagoon)]" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[var(--foam)]">
        <Header />
        <div className="max-w-xl mx-auto lp-gutter py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
          <Link href="/contact" className="text-[var(--lagoon)] font-semibold hover:underline">
            Contact Isle & Echo
          </Link>
        </div>
      </div>
    )
  }

  const total = Number(booking.total_price) || 0
  const deposit = getDepositBreakdown(total, 50)
  const amount = purpose === 'deposit' ? deposit.deposit : total
  const formatLkr = (value: number) =>
    `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-[var(--foam)]">
      <Header />
      <div className="max-w-2xl mx-auto lp-gutter py-12 sm:py-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-black/5">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--lagoon)] mb-2">
            Secure payment
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--lagoon-deep)] mb-2">
            {purpose === 'deposit' ? 'Pay 50% to confirm' : 'Complete payment'}
          </h1>
          <p className="text-[var(--ink-soft)] mb-6">
            Order <strong>#{booking.booking_ref || booking.id}</strong> · {booking.tour_package_name}
          </p>

          <div className="rounded-xl bg-[var(--foam)] p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tour total</span>
              <span className="font-semibold">{formatLkr(total)}</span>
            </div>
            {purpose === 'deposit' && (
              <>
                <div className="flex justify-between text-[var(--lagoon-deep)]">
                  <span>Due now (50%)</span>
                  <span className="font-bold">{formatLkr(deposit.deposit)}</span>
                </div>
                <div className="flex justify-between text-[var(--ink-soft)]">
                  <span>Balance before travel</span>
                  <span>{formatLkr(deposit.balance)}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-[var(--ink-soft)] mb-5">
            <ShieldCheck className="w-5 h-5 text-[var(--lagoon)] shrink-0" />
            <p>You will pay securely through PayHere (cards, bank, and mobile wallets).</p>
          </div>

          <PayHereCheckout
            bookingId={booking.id}
            amount={amount}
            currency="LKR"
            customerName={booking.customer_name}
            customerEmail={booking.customer_email}
            customerPhone={booking.customer_phone || ''}
            customerAddress="N/A"
            customerCity="N/A"
            customerCountry="Sri Lanka"
            tourName={booking.tour_package_name || booking.vehicle_name || 'Isle & Echo booking'}
            purpose={purpose}
            onError={(message) => setError(message)}
          />
        </div>
      </div>
    </div>
  )
}

export default function PaymentPayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--foam)]">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--lagoon)]" />
          </div>
        </div>
      }
    >
      <PayContent />
    </Suspense>
  )
}
