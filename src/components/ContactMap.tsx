'use client'

import { useEffect, useRef } from 'react'

interface ContactMapProps {
  lat: number
  lng: number
  address: string
}

export default function ContactMap({ lat, lng, address }: ContactMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (map.current || typeof window === 'undefined') return

    // Dynamically import mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      // Load CSS dynamically
      if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        document.head.appendChild(link)
      }
      
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

      if (mapContainer.current) {
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: 15,
          pitch: 45,
          bearing: 0
        })

        // Add navigation controls
        map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right')
        
        // Add fullscreen control
        map.current.addControl(new mapboxgl.default.FullscreenControl(), 'top-right')

        // Wait for map to load before adding marker
        map.current.on('load', () => {
          if (map.current && mapContainer.current) {
            // Create custom marker element with logo
            const markerEl = document.createElement('div')
            markerEl.className = 'contact-marker'
            markerEl.style.cursor = 'pointer'
            markerEl.style.transition = 'transform 0.3s ease'
            markerEl.style.width = '60px'
            markerEl.style.height = '60px'
            markerEl.style.borderRadius = '50%'
            markerEl.style.backgroundColor = 'white'
            markerEl.style.border = '4px solid #3B82F6'
            markerEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
            markerEl.style.display = 'flex'
            markerEl.style.alignItems = 'center'
            markerEl.style.justifyContent = 'center'
            markerEl.style.padding = '4px'
            markerEl.style.overflow = 'hidden'
            
            // Create image element for logo
            const logoImg = document.createElement('img')
            logoImg.src = '/logoisle&echo.png'
            logoImg.alt = 'ISLE & ECHO Logo'
            logoImg.style.width = '100%'
            logoImg.style.height = '100%'
            logoImg.style.objectFit = 'contain'
            logoImg.style.pointerEvents = 'none'
            
            markerEl.appendChild(logoImg)

            // Create marker
            marker.current = new mapboxgl.default.Marker(markerEl)
              .setLngLat([lng, lat])
              .addTo(map.current)

            // Create popup with address
            const popup = new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px; max-width: 250px;">
                  <h3 style="margin: 0 0 8px 0; color: #333; font-weight: bold; font-size: 16px;">Our Location</h3>
                  <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">${address}</p>
                </div>
              `)

            markerEl.addEventListener('click', () => {
              if (map.current) {
                popup.setLngLat([lng, lat]).addTo(map.current)
              }
            })
            
            marker.current.setPopup(popup)

            // Add hover effect
            markerEl.addEventListener('mouseenter', () => {
              markerEl.style.transform = 'scale(1.2)'
            })
            markerEl.addEventListener('mouseleave', () => {
              markerEl.style.transform = 'scale(1)'
            })
          }
        })
      }
    })

    return () => {
      if (marker.current) {
        marker.current.remove()
        marker.current = null
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [lat, lng, address])

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
      <style jsx>{`
        .contact-marker:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  )
}

