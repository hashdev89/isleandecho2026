import type { Metadata } from 'next'
import PrivacyPolicyClient from './PrivacyPolicyClient'

export const metadata: Metadata = {
  title: 'Privacy Policy | Isle & Echo',
  description:
    'How Isle & Echo collects, uses, stores, shares and protects your personal information when you visit our website, enquire, book tours or transport, or make a payment.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
