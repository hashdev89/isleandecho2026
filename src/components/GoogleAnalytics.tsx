'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'

export interface AnalyticsSettings {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  googleSearchConsoleId?: string  // verification code for meta google-site-verification
  facebookPixelId?: string
  googleAdsId?: string
  bingWebmasterId?: string       // verification code for meta msvalidate.01
  yandexWebmasterId?: string
}

interface GoogleAnalyticsProps {
  /** Server-rendered IDs from Settings / env. Client fetch only fills gaps. */
  googleAnalyticsId?: string
  googleTagManagerId?: string
  facebookPixelId?: string
  googleAdsId?: string
}

export default function GoogleAnalytics(props?: GoogleAnalyticsProps) {
  const [settings, setSettings] = useState<AnalyticsSettings | null>(props || null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/seo/analytics')
        const json = await res.json()
        if (!cancelled && json?.success && json?.data) {
          setSettings({
            googleAnalyticsId: json.data.googleAnalyticsId || props?.googleAnalyticsId,
            googleTagManagerId: json.data.googleTagManagerId || props?.googleTagManagerId,
            facebookPixelId: json.data.facebookPixelId || props?.facebookPixelId,
            googleAdsId: json.data.googleAdsId || props?.googleAdsId,
          })
        }
      } catch {
        if (!cancelled) setSettings(props || null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [props?.googleAnalyticsId, props?.googleTagManagerId, props?.facebookPixelId, props?.googleAdsId])

  const gaId = (settings?.googleAnalyticsId || props?.googleAnalyticsId || '').trim()
  const gtmId = (settings?.googleTagManagerId || props?.googleTagManagerId || '').trim()
  const fbId = (settings?.facebookPixelId || props?.facebookPixelId || '').trim()
  const awId = (settings?.googleAdsId || props?.googleAdsId || '').trim()

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId.replace(/'/g, "\\'")}');`
          }}
        />
      )}

      {/* Google Analytics (gtag) + Google Ads — load gtag.js for first available id */}
      {(gaId || awId) && (
        <>
          <Script
            id="gtag-js"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId || awId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
${gaId ? `gtag('config','${gaId.replace(/'/g, "\\'")}');` : ''}
${awId ? `gtag('config','${awId.replace(/'/g, "\\'")}');` : ''}`
            }}
          />
        </>
      )}

      {/* Facebook Pixel */}
      {fbId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${fbId.replace(/'/g, "\\'")}');
fbq('track','PageView');`
          }}
        />
      )}
    </>
  )
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function useAnalytics() {
  const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters)
    }
  }

  const trackPageView = (gaId: string, pagePath: string, pageTitle?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, { page_path: pagePath, page_title: pageTitle })
    }
  }

  const trackConversion = (conversionId: string, value?: number, currency?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', { send_to: conversionId, value, currency })
    }
  }

  return { trackEvent, trackPageView, trackConversion }
}

export const trackSEOMetrics = {
  trackTourView: (tourId: string, tourName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_tour', {
        tour_id: tourId,
        tour_name: tourName,
        event_category: 'SEO',
        event_label: 'Tour View'
      })
    }
  },
  trackBookingStart: (tourId: string, tourName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        tour_id: tourId,
        tour_name: tourName,
        event_category: 'E-commerce',
        event_label: 'Booking Start'
      })
    }
  },
  trackBookingComplete: (tourId: string, tourName: string, value: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `booking_${Date.now()}`,
        tour_id: tourId,
        tour_name: tourName,
        value,
        currency: 'USD',
        event_category: 'E-commerce',
        event_label: 'Booking Complete'
      })
    }
  },
  trackSearchQuery: (query: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: query,
        results_count: resultsCount,
        event_category: 'SEO',
        event_label: 'Search Query'
      })
    }
  },
  trackContactForm: (formType: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'form_submit', {
        form_type: formType,
        event_category: 'Lead Generation',
        event_label: 'Contact Form'
      })
    }
  }
}
