'use client'

import { useEffect, useRef, useState } from 'react'

interface ContactMapProps {
  lat: number
  lng: number
  address: string
}

export default function ContactMap({ lat, lng, address }: ContactMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (map.current || typeof window === 'undefined') return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    if (!token) {
      setError('Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local and restart the dev server.')
      return
    }

    import('mapbox-gl').then((mapboxgl) => {
      if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        document.head.appendChild(link)
      }

      mapboxgl.default.accessToken = token

      if (!mapContainer.current) return

      try {
        map.current = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: 15,
          pitch: 45,
          bearing: 0
        })
      } catch (err) {
        console.error('Mapbox init error:', err)
        setError('Unable to initialize the map.')
        return
      }

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e)
        setError('Map failed to load. Check your Mapbox token and network connection.')
      })

      map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right')
      map.current.addControl(new mapboxgl.default.FullscreenControl(), 'top-right')

      map.current.on('load', () => {
        if (!map.current) return

        const markerEl = document.createElement('div')
        markerEl.className = 'contact-marker'
        markerEl.style.cursor = 'pointer'
        // Outer shell stays transform-free so Mapbox positioning is not overwritten on hover
        markerEl.style.width = '60px'
        markerEl.style.height = '60px'

        const markerInner = document.createElement('div')
        markerInner.className = 'contact-marker-inner'
        markerInner.style.width = '100%'
        markerInner.style.height = '100%'
        markerInner.style.borderRadius = '50%'
        markerInner.style.backgroundColor = 'white'
        markerInner.style.border = '4px solid #0b6e7a'
        markerInner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        markerInner.style.display = 'flex'
        markerInner.style.alignItems = 'center'
        markerInner.style.justifyContent = 'center'
        markerInner.style.padding = '4px'
        markerInner.style.overflow = 'hidden'
        markerInner.style.transition = 'transform 0.25s ease'
        markerInner.style.transformOrigin = 'center bottom'
        markerInner.style.willChange = 'transform'

        const logoImg = document.createElement('img')
        logoImg.src = '/logoisle&echo.png'
        logoImg.alt = 'ISLE & ECHO Logo'
        logoImg.style.width = '100%'
        logoImg.style.height = '100%'
        logoImg.style.objectFit = 'contain'
        logoImg.style.pointerEvents = 'none'
        markerInner.appendChild(logoImg)
        markerEl.appendChild(markerInner)

        marker.current = new mapboxgl.default.Marker({
          element: markerEl,
          anchor: 'bottom',
        })
          .setLngLat([lng, lat])
          .addTo(map.current)

        const popup = new mapboxgl.default.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          maxWidth: '280px',
          anchor: 'bottom',
        }).setHTML(`
            <div style="padding: 12px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #102429; font-weight: bold; font-size: 16px;">Our Location</h3>
              <p style="margin: 0; color: #3a5459; font-size: 14px; line-height: 1.5;">${address}</p>
            </div>
          `)

        marker.current.setPopup(popup)

        markerEl.addEventListener('mouseenter', () => {
          markerInner.style.transform = 'scale(1.15)'
        })
        markerEl.addEventListener('mouseleave', () => {
          markerInner.style.transform = 'scale(1)'
        })
      })
    }).catch((err) => {
      console.error('Failed to load mapbox-gl:', err)
      setError('Failed to load Mapbox library.')
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

  if (error) {
    return (
      <div className="relative w-full h-96 rounded-2xl overflow-hidden border border-black/10 bg-[var(--foam)] flex items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-[var(--ink)] mb-2">Map unavailable</p>
          <p className="text-sm text-[var(--ink-soft)] max-w-md">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
