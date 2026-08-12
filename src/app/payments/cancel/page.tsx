'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'
import Header from '../../../components/Header'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto lp-gutter py-16">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            You cancelled the payment process. No charges were made to your account.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/tours"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Booking
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

