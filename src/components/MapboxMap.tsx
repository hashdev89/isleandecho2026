'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  formatDistanceKm,
  getRouteSegments,
  getTotalRouteKm,
  isBiaAirportPoint,
  withBiaAirportLoop,
} from '@/lib/geoDistance'

interface Destination {
  name: string
  lat: number
  lng: number
  region: string
}

interface MapboxMapProps {
  destinations: Destination[]
  tourName: string
  /** When true, route starts and ends at BIA (Bandaranaike International Airport). */
  completeLoopAtBia?: boolean
}

export default function MapboxMap({ destinations, tourName, completeLoopAtBia = false }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [lng] = useState(80.5) // Sri Lanka center longitude
  const [lat] = useState(7.5) // Sri Lanka center latitude
  const [zoom] = useState(7)
  const [error, setError] = useState<string | null>(null)

  const routePoints = useMemo(
    () => (completeLoopAtBia ? withBiaAirportLoop(destinations) : destinations),
    [completeLoopAtBia, destinations]
  )

  useEffect(() => {
    if (map.current || typeof window === 'undefined') return // initialize map only once and ensure we're on client side

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    if (!token) {
      setError('Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local and restart the dev server.')
      return
    }

    // Dynamically import mapbox-gl
    import('mapbox-gl').then((mapboxgl) => {
      // Load CSS dynamically to avoid module instantiation issues
      if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
        document.head.appendChild(link)
      }

      mapboxgl.default.accessToken = token

      if (mapContainer.current) {
        try {
          map.current = new mapboxgl.default.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Standard streets style with 3D support
            center: [lng, lat],
            zoom: zoom,
            pitch: 45, // 3D tilt
            bearing: 0,
            antialias: true,
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

        // Add navigation controls
        map.current.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

        // Add fullscreen control
        map.current.addControl(new mapboxgl.default.FullscreenControl(), 'top-right')

        // Add 3D terrain
        map.current.on('load', () => {
          if (map.current) {
            // Add a small delay to ensure map is fully ready
            setTimeout(() => {
              // Add terrain source (only if it doesn't exist)
              if (map.current && !map.current.getSource('mapbox-terrain')) {
                try {
                  map.current.addSource('mapbox-terrain', {
                    type: 'vector',
                    url: 'mapbox://mapbox.mapbox-terrain-v2',
                  })

                  // Add terrain layer (only if it doesn't exist)
                  if (!map.current.getLayer('terrain')) {
                    map.current.addLayer({
                      id: 'terrain',
                      source: 'mapbox-terrain',
                      'source-layer': 'contour',
                      type: 'line',
                      paint: {
                        'line-color': '#ff69b4',
                        'line-width': 1,
                      },
                    })
                  }
                } catch (error) {
                  console.warn('Error adding terrain source/layer:', error)
                }
              }

              // Add 3D building layer (only if source exists and layer doesn't exist)
              try {
                if (map.current && map.current.getSource('composite') && !map.current.getLayer('3d-buildings')) {
                  map.current.addLayer({
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 15,
                    paint: {
                      'fill-extrusion-color': '#aaa',
                      'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'height'],
                      ],
                      'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'min_height'],
                      ],
                      'fill-extrusion-opacity': 0.6,
                    },
                  })
                }
              } catch (error) {
                console.warn('3D buildings layer not available:', error)
              }

              // Add markers for each destination
              const markers: mapboxgl.Marker[] = []
              const startsAtBia = completeLoopAtBia && routePoints.length > 0 && isBiaAirportPoint(routePoints[0])

              routePoints.forEach((destination, index) => {
                try {
                  const isAirport = isBiaAirportPoint(destination)
                  const isReturnAirport =
                    isAirport && index === routePoints.length - 1 && routePoints.length > 1

                  // Create custom marker element
                  const markerEl = document.createElement('div')
                  markerEl.className = 'marker'
                  markerEl.style.width = isAirport ? '36px' : '30px'
                  markerEl.style.height = isAirport ? '36px' : '30px'
                  markerEl.style.backgroundColor = isAirport ? '#0B3D4A' : '#3B82F6'
                  markerEl.style.borderRadius = '50%'
                  markerEl.style.border = '3px solid white'
                  markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                  markerEl.style.cursor = 'pointer'
                  markerEl.style.display = 'flex'
                  markerEl.style.alignItems = 'center'
                  markerEl.style.justifyContent = 'center'
                  markerEl.style.fontWeight = 'bold'
                  markerEl.style.color = 'white'
                  markerEl.style.fontSize = isAirport ? '9px' : '12px'
                  markerEl.textContent = isAirport
                    ? 'BIA'
                    : startsAtBia
                      ? String(index)
                      : String(index + 1)

                  // Add marker to map with error handling
                  if (map.current && mapContainer.current) {
                    const destinationMarker = new mapboxgl.default.Marker(markerEl)
                      .setLngLat([destination.lng, destination.lat])
                      .addTo(map.current)
                    markers.push(destinationMarker)

                    // Create popup
                    const popup = new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
                        <div style="padding: 10px; max-width: 220px;">
                          <h3 style="margin: 0 0 5px 0; color: #333; font-weight: bold;">${destination.name}</h3>
                          <p style="margin: 0; color: #666; font-size: 12px;">${destination.region || ''}</p>
                          ${
                            isAirport
                              ? `<p style="margin: 6px 0 0; color: #0B3D4A; font-size: 11px; font-weight: 600;">${
                                  isReturnAirport ? 'Return to airport' : 'Trip start (airport)'
                                }</p>`
                              : ''
                          }
                        </div>
                      `)

                    markerEl.addEventListener('click', () => {
                      if (map.current) {
                        popup.setLngLat([destination.lng, destination.lat]).addTo(map.current)
                      }
                    })

                    destinationMarker.setPopup(popup)
                  }
                } catch (error) {
                  console.warn('Error adding marker for destination:', destination.name, error)
                }
              })

              // Distance labels between consecutive stops
              const routeSegments = getRouteSegments(routePoints)
              routeSegments.forEach((segment) => {
                try {
                  if (!map.current) return
                  const labelEl = document.createElement('div')
                  labelEl.className = 'route-distance-label'
                  labelEl.textContent = formatDistanceKm(segment.distanceKm)
                  labelEl.style.cssText = [
                    'background: rgba(11, 61, 74, 0.92)',
                    'color: #d4f06a',
                    'padding: 4px 8px',
                    'border-radius: 9999px',
                    'font-size: 11px',
                    'font-weight: 700',
                    'white-space: nowrap',
                    'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
                    'border: 1px solid rgba(212, 240, 106, 0.35)',
                    'pointer-events: none',
                  ].join(';')

                  const distanceMarker = new mapboxgl.default.Marker({
                    element: labelEl,
                    anchor: 'center',
                  })
                    .setLngLat([segment.midpoint.lng, segment.midpoint.lat])
                    .addTo(map.current)
                  markers.push(distanceMarker)
                } catch (error) {
                  console.warn('Error adding distance label:', error)
                }
              })

              // Fit map to all destinations when available
              if (routePoints.length > 0 && map.current) {
                try {
                  const bounds = new mapboxgl.default.LngLatBounds()
                  routePoints.forEach((dest) => bounds.extend([dest.lng, dest.lat]))
                  map.current.fitBounds(bounds, { padding: 56, maxZoom: 10, duration: 0 })
                } catch (error) {
                  console.warn('Error fitting map bounds:', error)
                }
              }

              // Add route line if multiple destinations
              if (routePoints.length > 1 && map.current) {
                try {
                  const coordinates = routePoints.map((dest) => [dest.lng, dest.lat])

                  // Add route source (only if it doesn't exist)
                  if (!map.current.getSource('route')) {
                    map.current.addSource('route', {
                      type: 'geojson',
                      data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                          type: 'LineString',
                          coordinates: coordinates,
                        },
                      },
                    })
                  }

                  // Add route line (only if it doesn't exist)
                  if (!map.current.getLayer('route-line')) {
                    map.current.addLayer({
                      id: 'route-line',
                      type: 'line',
                      source: 'route',
                      layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                      },
                      paint: {
                        'line-color': '#3B82F6',
                        'line-width': 4,
                        'line-opacity': 0.8,
                      },
                    })
                  }

                  // Add animated route line (only if it doesn't exist)
                  if (!map.current.getLayer('route-animated')) {
                    map.current.addLayer({
                      id: 'route-animated',
                      type: 'line',
                      source: 'route',
                      layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                      },
                      paint: {
                        'line-color': '#60A5FA',
                        'line-width': 2,
                        'line-dasharray': [0, 4],
                        'line-opacity': 0.6,
                      },
                    })
                  }

                  // Animate the route line
                  let start = 0
                  function animateRoute() {
                    if (map.current && map.current.getLayer('route-animated')) {
                      try {
                        const phase = (start % 100) / 100
                        map.current.setPaintProperty('route-animated', 'line-dasharray', [
                          phase * 4,
                          (1 - phase) * 4,
                        ])
                        start += 1
                        requestAnimationFrame(animateRoute)
                      } catch (error) {
                        console.warn('Route animation error:', error)
                      }
                    }
                  }

                  // Start animation after a short delay to ensure layer is ready
                  setTimeout(() => {
                    animateRoute()
                  }, 100)
                } catch (error) {
                  console.warn('Error adding route line:', error)
                }
              }

              // Add tour title + total distance overlay
              try {
                if (mapContainer.current && !mapContainer.current.querySelector('.map-title')) {
                  const totalKm = getTotalRouteKm(routePoints)
                  const titleEl = document.createElement('div')
                  titleEl.className = 'map-title'
                  titleEl.innerHTML = `
                    <div style="
                      position: absolute;
                      top: 20px;
                      left: 20px;
                      background: rgba(0,0,0,0.8);
                      color: white;
                      padding: 10px 15px;
                      border-radius: 8px;
                      font-weight: bold;
                      z-index: 0;
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      max-width: min(280px, calc(100% - 40px));
                    ">
                      <div>${tourName}</div>
                      ${
                        routePoints.length > 1
                          ? `<div style="margin-top:6px;font-size:12px;font-weight:600;color:#d4f06a;">Total route: ${formatDistanceKm(totalKm)}${
                              completeLoopAtBia ? ' (BIA loop)' : ''
                            }</div>`
                          : ''
                      }
                    </div>
                  `
                  mapContainer.current.appendChild(titleEl)
                }
              } catch (error) {
                console.warn('Error adding tour title overlay:', error)
              }
            }, 100) // Close setTimeout
          }
        })
      }
    })

    return () => {
      if (map.current) {
        // Remove all custom sources and layers before removing the map
        try {
          // Remove layers
          const layersToRemove = ['terrain', '3d-buildings', 'route-line', 'route-animated']
          layersToRemove.forEach((layerId) => {
            if (map.current && map.current.getLayer(layerId)) {
              map.current.removeLayer(layerId)
            }
          })

          // Remove sources
          const sourcesToRemove = ['mapbox-terrain', 'route']
          sourcesToRemove.forEach((sourceId) => {
            if (map.current && map.current.getSource(sourceId)) {
              map.current.removeSource(sourceId)
            }
          })
        } catch (error) {
          console.warn('Error cleaning up map sources/layers:', error)
        }

        map.current.remove()
        map.current = null
      }
    }
  }, [lng, lat, zoom, routePoints, tourName, completeLoopAtBia])

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-lg">
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-[var(--foam)] border border-black/10 p-6 text-center">
          <div>
            <p className="font-semibold text-[var(--ink)] mb-2">Map unavailable</p>
            <p className="text-sm text-[var(--ink-soft)] max-w-md">{error}</p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
      <style jsx>{`
        .marker {
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </div>
  )
}
