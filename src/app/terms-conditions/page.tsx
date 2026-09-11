import type { Metadata } from 'next'
import TermsConditionsClient from './TermsConditionsClient'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Isle & Echo',
  description:
    'Terms & Conditions for Isle & Echo website use, bookings, tours, chauffeur transport, airport transfers and other travel-related services.',
  alternates: {
    canonical: '/terms-conditions',
  },
}

export default function TermsConditionsPage() {
  return <TermsConditionsClient />
}
