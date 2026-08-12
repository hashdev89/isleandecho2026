'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface PayHereCheckoutProps {
  bookingId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
  customerCountry?: string
  tourName: string
  purpose?: 'full' | 'deposit'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PayHereCheckout({
  bookingId,
  amount,
  currency = 'LKR',
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerCity,
  customerCountry = 'Sri Lanka',
  tourName,
  purpose = 'full',
  onSuccess,
  onError
}: PayHereCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Get checkout data from API
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          customerCity,
          customerCountry,
          tourName,
          purpose,
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      // Create and submit form to PayHere
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = result.data.checkoutUrl

      Object.entries(result.data.formData).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      console.error('Payment initialization error:', error)
      const errorMessage = (error as Error).message || 'Failed to initialize payment'
      if (onError) {
        onError(errorMessage)
      } else {
        alert(errorMessage)
      }
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <img 
            src="https://www.payhere.lk/images/payhere-logo-white.png" 
            alt="PayHere" 
            className="h-6 w-auto"
            onError={(e) => {
              // Hide logo if it fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <span>{purpose === 'deposit' ? 'Pay 50% with PayHere' : 'Pay with PayHere'}</span>
        </>
      )}
    </button>
  )
}

