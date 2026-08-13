/* eslint-disable @typescript-eslint/no-explicit-any */
import Script from 'next/script'

interface StructuredDataProps {
  data: Record<string, unknown>
  id?: string
}

export default function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}

// Predefined structured data schemas
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "ISLE & ECHO",
  "description": "Discover the beauty of Sri Lanka with our curated tour packages and travel experiences.",
  "url": "https://isleandecho.com",
  "logo": "https://isleandecho.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+94-XX-XXXXXXX",
    "contactType": "customer service",
    "areaServed": "LK",
    "availableLanguage": ["English", "Sinhala", "Tamil"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "LK",
    "addressLocality": "Colombo"
  },
  "sameAs": [
    "https://www.facebook.com/isleandecho",
    "https://www.instagram.com/isleandecho",
    "https://www.twitter.com/isleandecho"
  ]
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ISLE & ECHO",
  "url": "https://isleandecho.com",
  "description": "Sri Lanka's premier travel and tour company offering curated experiences across the island.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://isleandecho.com/tours?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

export const tourSchema = (tour: any) => ({
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": tour.name,
  "description": tour.description,
  "duration": tour.duration,
  "offers": {
    "@type": "Offer",
    "price": tour.price,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "itinerary": (tour.itinerary as unknown[])?.map((day: unknown) => {
    const d = day as Record<string, unknown>
    return {
      "@type": "TouristAttraction",
      "name": d.title,
      "description": d.description
    }
  }),
  "touristType": "Leisure",
  "includesAttraction": tour.destinations?.map((dest: string) => ({
    "@type": "TouristAttraction",
    "name": dest
  }))
})

export const breadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
})
