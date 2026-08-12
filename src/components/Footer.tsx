'use client'

import { useState, useEffect } from 'react'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Apple,
  Play as PlayIcon
} from 'lucide-react'

type FooterContent = {
  newsletterTitle?: string
  newsletterSubtitle?: string
  newsletterButtonText?: string
  contactHeading?: string
  contactPhone?: string
  contactEmail?: string
  companyHeading?: string
  companyLinks?: Array<{ label?: string; url?: string }>
  supportHeading?: string
  supportLinks?: Array<{ label?: string; url?: string }>
  otherServicesHeading?: string
  otherServicesLinks?: Array<{ label?: string; url?: string }>
  copyrightText?: string
  bottomLinks?: Array<{ label?: string; url?: string }>
}

export default function Footer() {
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)

  useEffect(() => {
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.footer) setFooterContent(j.data.footer as FooterContent)
      })
      .catch(() => {})
  }, [])

  const f = footerContent
  const companyLinks = f?.companyLinks && f.companyLinks.length > 0 ? f.companyLinks : [
    { label: 'About Us', url: '/about' }, { label: 'Careers', url: '#' }, { label: 'Blog', url: '/blog' }, { label: 'Press', url: '#' }, { label: 'Gift Cards', url: '#' }
  ]
  const supportLinks = f?.supportLinks && f.supportLinks.length > 0 ? f.supportLinks : [
    { label: 'Contact', url: '/contact' }, { label: 'Legal Notice', url: '#' }, { label: 'Privacy Policy', url: '#' }, { label: 'Terms and Conditions', url: '#' }, { label: 'Sitemap', url: '/sitemap.xml' }
  ]
  const otherServicesLinks = f?.otherServicesLinks && f.otherServicesLinks.length > 0 ? f.otherServicesLinks : [
    { label: 'Car Hire', url: '#' }, { label: 'Activity Finder', url: '#' }, { label: 'Tour List', url: '/tours' }, { label: 'Flight Finder', url: '#' }, { label: 'Cruise Ticket', url: '#' }, { label: 'Holiday Rental', url: '#' }, { label: 'Travel Agents', url: '#' }
  ]
  const bottomLinks = f?.bottomLinks && f.bottomLinks.length > 0 ? f.bottomLinks : [
    { label: 'Privacy', url: '#' }, { label: 'Terms', url: '#' }, { label: 'Site Map', url: '/sitemap.xml' }
  ]

  return (
    <footer className="bg-[var(--lagoon-deep)] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10 py-12">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div>
                <h3 className="text-white text-lg font-semibold">{f?.newsletterTitle || 'Your Travel Journey Starts Here'}</h3>
                <p className="text-white/80 text-sm">{f?.newsletterSubtitle || "Sign up and we'll send the best deals to you"}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your Email"
                className="px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-gray-900 text-base min-h-[44px] touch-manipulation w-full sm:w-auto"
              />
              <button style={{ background: '#A0FF07' }} className="text-gray-900 px-6 py-3 rounded-lg font-semibold hover:opacity-90 active:opacity-80 transition-all min-h-[44px] touch-manipulation w-full sm:w-auto">
                {f?.newsletterButtonText || 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-12">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Contact Us */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">{f?.contactHeading || 'Contact Us'}</h3>
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Phone Number</p>
                <p className="font-semibold text-white">{f?.contactPhone || '+94 741 415 812'}</p>
                <p className="text-gray-400 text-sm mt-4">Email</p>
                <p className="font-semibold text-white">{f?.contactEmail || 'info@isleandecho.com'}</p>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">{f?.companyHeading || 'Company'}</h3>
              <div className="space-y-3">
                {companyLinks.map((item, i) => (
                  <a key={item.label || i} href={item.url || '#'} className="block text-gray-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">{f?.supportHeading || 'Support'}</h3>
              <div className="space-y-3">
                {supportLinks.map((item, i) => (
                  <a key={item.label || i} href={item.url || '#'} className="block text-gray-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Other Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">{f?.otherServicesHeading || 'Other Services'}</h3>
              <div className="space-y-3">
                {otherServicesLinks.map((item, i) => (
                  <a key={item.label || i} href={item.url || '#'} className="block text-gray-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Mobile</h3>
              <div className="space-y-4">
                <button className="flex items-center space-x-3 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors w-full min-h-[44px] touch-manipulation">
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-sm font-semibold">Apple Store</div>
                  </div>
                </button>
                <button className="flex items-center space-x-3 bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition-colors w-full min-h-[44px] touch-manipulation">
                  <PlayIcon className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0 text-sm">
              {f?.copyrightText || '© 2024 by ISLE & ECHO. All rights reserved.'}
            </div>
            <div className="flex items-center space-x-8">
              <div className="flex space-x-6">
                {bottomLinks.map((item, i) => (
                  <a key={item.label || i} href={item.url || '#'} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a key={index} href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
