'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Globe
} from 'lucide-react'
import Header from '../../components/Header'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'
import { getSection, isSectionEnabled } from '@/lib/siteContent'

const ContactMap = dynamic(() => import('../../components/ContactMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-[var(--foam)] rounded-2xl h-96 flex items-center justify-center border border-black/5">
      <div className="text-center">
        <Globe className="w-12 h-12 text-[var(--lagoon)] mx-auto mb-4 animate-pulse" />
        <p className="text-[var(--ink-soft)]">Loading map...</p>
      </div>
    </div>
  )
})

export default function ContactPage() {
  const { page } = useCmsPage('/contact')
  const info = getSection(page, 'contactInfo') || {}
  const formIntro = getSection(page, 'contactForm') || {}
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormStatus(null)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not send your message')
      }
      setFormStatus({ type: 'success', message: 'Thank you. Your message is on its way — we will reply shortly.' })
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not send your message. Please try again or email us directly.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: String(info.addressTitle || 'Visit Us'),
      details: String(info.address || '55/A, Kulupana, Pokunuwita, Sri Lanka'),
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: String(info.phoneTitle || 'Call Us'),
      details: String(info.phone || '+94 741 415 812'),
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: String(info.emailTitle || 'Email Us'),
      details: String(info.email || 'info@isleandecho.com'),
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: String(info.hoursTitle || 'Business Hours'),
      details: String(info.hours || 'Mon - Fri: 9:00 AM - 6:00 PM'),
    },
  ]

  const inputClass =
    'w-full px-4 py-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent bg-[var(--foam)] text-[var(--ink)] placeholder-[var(--ink-soft)]'

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      
      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'Say hello',
          title: 'Get in touch',
          subtitle: "Have questions about your Sri Lanka adventure? We're here to help you plan the perfect trip.",
        }}
      />

      {isSectionEnabled(page, 'contactInfo') !== false && (
      <section className="py-12 sm:py-16 bg-white/70">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1180px]:grid-cols-4 gap-5">
            {contactInfo.map((item, index) => (
              <div key={index} className="lp-panel p-6 text-center">
                <div className="w-14 h-14 bg-[var(--lagoon)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-[var(--lagoon)]">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--ink)]">{item.title}</h3>
                <p className="text-[var(--lagoon)] font-semibold mb-2">{item.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="lp-section-ink py-12 sm:py-16">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="grid grid-cols-1 min-[1180px]:grid-cols-2 gap-8 min-[1180px]:gap-12">
            <div className="lp-panel p-6 sm:p-8">
              <p className="lp-kicker mb-2">Message</p>
              <h2 className="lp-section-title text-2xl sm:text-3xl mb-2">
                {String(formIntro.title || 'Send us a message')}
              </h2>
              {formIntro.subtitle ? (
                <p className="mb-6 text-sm text-[var(--ink-soft)]">{String(formIntro.subtitle)}</p>
              ) : (
                <div className="mb-6" />
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                {formStatus && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      formStatus.type === 'success'
                        ? 'bg-[var(--sun)]/40 text-[var(--lagoon-deep)]'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {formStatus.message}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Your email"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-[var(--ink)] mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking Question</option>
                      <option value="custom-tour">Custom Tour Request</option>
                      <option value="support">Customer Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-[var(--ink)] mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={inputClass}
                    placeholder="Tell us about your travel plans or any questions you have..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] disabled:opacity-70 text-white py-3.5 px-6 rounded-full font-bold transition-colors flex items-center justify-center space-x-2 min-h-[44px]"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'Sending…' : String(formIntro.buttonText || 'Send Message')}</span>
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="lp-panel p-6 sm:p-8">
                <p className="lp-kicker mb-2">Find us</p>
                <h2 className="lp-section-title text-2xl sm:text-3xl mb-6">Our location</h2>
                <ContactMap
                  lat={6.72603}
                  lng={80.03396}
                  address={String(info.address || '55/A, Kulupana, Pokunuwita, Sri Lanka')}
                />
                <div className="mt-4 text-center">
                  <p className="text-[var(--ink-soft)] font-medium">
                    {String(info.address || '55/A, Kulupana, Pokunuwita, Sri Lanka')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white/70">
        <div className="max-w-4xl mx-auto lp-gutter">
          <div className="text-center mb-8">
            <p className="lp-kicker mb-2">Help</p>
            <h2 className="lp-section-title text-3xl">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "How far in advance should I book my tour?",
                answer: "We recommend booking at least 2-3 months in advance for peak season (December to April) and 1-2 months for off-peak season to ensure availability and the best rates."
              },
              {
                question: "What is your cancellation policy?",
                answer: "We offer flexible cancellation policies. Full refunds are available up to 30 days before departure, with partial refunds available up to 7 days before. Please check your specific tour details for exact terms."
              },
              {
                question: "Do you offer custom tours?",
                answer: "Absolutely! We specialize in creating personalized experiences. Contact us with your requirements and we'll craft a custom itinerary that matches your interests, budget, and timeline."
              },
              {
                question: "What should I pack for my Sri Lanka trip?",
                answer: "Pack lightweight, breathable clothing, comfortable walking shoes, sunscreen, insect repellent, and a hat. For temple visits, bring modest clothing that covers shoulders and knees."
              }
            ].map((faq, index) => (
              <div key={index} className="lp-panel p-5 sm:p-6">
                <h3 className="font-semibold text-lg text-[var(--ink)] mb-2">{faq.question}</h3>
                <p className="text-[var(--ink-soft)] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
