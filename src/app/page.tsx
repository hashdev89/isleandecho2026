'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import SafeImage from '../components/SafeImage'
import Link from 'next/link'
import {
  Search,
  Star,
  Globe,
  Calendar,
  Users,
  ChevronDown,
  Shield,
  Clock,
  Headphones,
  Play,
  Pause,
  Award,
  Camera,

  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Quote
} from 'lucide-react'
import Header from '../components/Header'
import StructuredData, { organizationSchema, websiteSchema } from '../components/StructuredData'
import { useClickOutside } from '../hooks/useClickOutside'
import { tourFitsGuestCountFromTour, getTourGroupSize, formatGroupSizeRange } from '@/lib/tourGroupSize'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getTourRating, getTourReviews } from '@/lib/currency'
import {
  getPageBySlug,
  getSection,
  isSectionEnabled,
  normalizeSiteContent,
  type SiteContentDoc,
} from '@/lib/siteContent'

interface Tour {
  id: string
  name: string
  duration: string
  price: string
  image?: string
  images?: string[]
  rating: number
  reviews: number
  destinations?: string[]
  style?: string
  featured?: boolean
  status?: string
  groupSize?: string
  group_size?: string
  status?: string
}

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Emma Thompson',
    location: 'United Kingdom',
    quote:
      'Every day felt effortless — the guides, the hotels, and the little details made our Sri Lanka trip unforgettable.',
    rating: 5,
  },
  {
    name: 'Arjun Patel',
    location: 'India',
    quote:
      'From Sigiriya to the south coast, the itinerary was perfectly paced. We felt looked after without losing the adventure.',
    rating: 5,
  },
  {
    name: 'Sophie Müller',
    location: 'Germany',
    quote:
      'Beautiful stays, kind drivers, and wildlife we will never forget. I would book with ISLE & ECHO again in a heartbeat.',
    rating: 5,
  },
]

export default function HomePage() {
  const { formatPrice } = useCurrency()
  const [searchTab, setSearchTab] = useState('tours')
  const [searchData, setSearchData] = useState({
    tourPackage: '',
    startDate: '',
    endDate: '',
    guests: 1
  })
  const [rentCarData, setRentCarData] = useState({
    pickupCityId: '',
    dropoffCityId: '',
    pickupDate: '',
    returnDate: '',
  })
  const [customTripData, setCustomTripData] = useState({
    destinations: [] as string[],
    dateRange: '',
    guests: 1,
    interests: [] as string[]
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showToursDatePicker, setShowToursDatePicker] = useState(false)
  const [showPackageDropdown, setShowPackageDropdown] = useState(false)
  const [packageSearch, setPackageSearch] = useState('')
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false)
  const [showRentPickupDatePicker, setShowRentPickupDatePicker] = useState(false)
  const [showRentReturnDatePicker, setShowRentReturnDatePicker] = useState(false)
  const [currentRentPickupMonth, setCurrentRentPickupMonth] = useState(new Date())
  const [currentRentReturnMonth, setCurrentRentReturnMonth] = useState(new Date())
  const [selectedTourStartDate, setSelectedTourStartDate] = useState<Date | null>(null)
  const [currentToursMonth, setCurrentToursMonth] = useState(new Date())
  const toursDatePickerRef = useRef<HTMLDivElement>(null)
  const customDatePickerRef = useRef<HTMLDivElement>(null)
  const packageDropdownRef = useRef<HTMLDivElement>(null)
  const packageSearchRef = useRef<HTMLInputElement>(null)
  const destDropdownRef = useRef<HTMLDivElement>(null)
  const pickupDropdownRef = useRef<HTMLDivElement>(null)
  const dropoffDropdownRef = useRef<HTMLDivElement>(null)
  const rentPickupDatePickerRef = useRef<HTMLDivElement>(null)
  const rentReturnDatePickerRef = useRef<HTMLDivElement>(null)
  const closeToursDatePicker = useCallback(() => setShowToursDatePicker(false), [])
  const closeCustomDatePicker = useCallback(() => setShowDatePicker(false), [])
  const closePackageDropdown = useCallback(() => {
    setShowPackageDropdown(false)
    setPackageSearch('')
  }, [])
  const closeDestDropdown = useCallback(() => setShowDestDropdown(false), [])
  const closePickupDropdown = useCallback(() => setShowPickupDropdown(false), [])
  const closeDropoffDropdown = useCallback(() => setShowDropoffDropdown(false), [])
  const closeRentPickupDatePicker = useCallback(() => setShowRentPickupDatePicker(false), [])
  const closeRentReturnDatePicker = useCallback(() => setShowRentReturnDatePicker(false), [])
  useClickOutside(toursDatePickerRef, showToursDatePicker, closeToursDatePicker)
  useClickOutside(customDatePickerRef, showDatePicker, closeCustomDatePicker)
  useClickOutside(packageDropdownRef, showPackageDropdown, closePackageDropdown)

  useEffect(() => {
    if (showPackageDropdown) {
      packageSearchRef.current?.focus()
    } else {
      setPackageSearch('')
    }
  }, [showPackageDropdown])
  useClickOutside(destDropdownRef, showDestDropdown, closeDestDropdown)
  useClickOutside(pickupDropdownRef, showPickupDropdown, closePickupDropdown)
  useClickOutside(dropoffDropdownRef, showDropoffDropdown, closeDropoffDropdown)
  useClickOutside(rentPickupDatePickerRef, showRentPickupDatePicker, closeRentPickupDatePicker)
  useClickOutside(rentReturnDatePickerRef, showRentReturnDatePicker, closeRentReturnDatePicker)

  useEffect(() => {
    setShowPackageDropdown(false)
    setShowDestDropdown(false)
    setShowPickupDropdown(false)
    setShowDropoffDropdown(false)
    setShowToursDatePicker(false)
    setShowDatePicker(false)
    setShowRentPickupDatePicker(false)
    setShowRentReturnDatePicker(false)
  }, [searchTab])

  const closeSearchOverlays = useCallback(() => {
    setShowPackageDropdown(false)
    setShowDestDropdown(false)
    setShowPickupDropdown(false)
    setShowDropoffDropdown(false)
    setShowToursDatePicker(false)
    setShowDatePicker(false)
    setShowRentPickupDatePicker(false)
    setShowRentReturnDatePicker(false)
  }, [])

  const searchOverlayOpen =
    showPackageDropdown ||
    showToursDatePicker ||
    showDatePicker ||
    showDestDropdown ||
    showPickupDropdown ||
    showDropoffDropdown ||
    showRentPickupDatePicker ||
    showRentReturnDatePicker

  const [featuredTours, setFeaturedTours] = useState<Tour[]>([])
  const [allTours, setAllTours] = useState<Tour[]>([])
  const [loadingTours, setLoadingTours] = useState(true)
  const [destinations, setDestinations] = useState<any[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('')
  const [destinationsDisplayLimit, setDestinationsDisplayLimit] = useState(10)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false) // Video does not autoplay; carousel shows by default
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [useFallbackImage, setUseFallbackImage] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredTourSlide, setFeaturedTourSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [selectedHeroArrow, setSelectedHeroArrow] = useState<'prev' | 'next'>('next')
  const [siteContent, setSiteContent] = useState<SiteContentDoc | null>(null)
  const [blogPosts, setBlogPosts] = useState<Array<{ id: number; title: string; description?: string; excerpt?: string; image?: string; date?: string; readTime?: string; category?: string }>>([])
  const [blogCarouselIndex, setBlogCarouselIndex] = useState(0)
  const [heroReady, setHeroReady] = useState(false)
  const [failedHeroImageIndices, setFailedHeroImageIndices] = useState<Set<number>>(new Set())

  const publicTours = useMemo(
    () =>
      allTours
        .filter((tour) => tour?.id && tour?.name && tour.status !== 'inactive')
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allTours]
  )

  const searchableTours = useMemo(() => {
    const q = packageSearch.trim().toLowerCase()
    if (!q) return publicTours
    return publicTours.filter(
      (tour) =>
        tour.name.toLowerCase().includes(q) ||
        String(tour.duration || '').toLowerCase().includes(q)
    )
  }, [publicTours, packageSearch])

  const rentCityOptions = useMemo(() => {
    if (destinations.length > 0) {
      return destinations.filter((d: { status?: string }) => d.status !== 'inactive')
    }
    return [
      { id: 'colombo', name: 'Colombo', region: 'Western Province' },
      { id: 'kandy', name: 'Kandy', region: 'Central Province' },
      { id: 'galle', name: 'Galle', region: 'Southern Province' },
      { id: 'sigiriya', name: 'Sigiriya', region: 'Cultural Triangle' },
      { id: 'ella', name: 'Ella', region: 'Uva Province' },
    ]
  }, [destinations])

  const handleRentCarSearch = () => {
    const params = new URLSearchParams()
    if (rentCarData.pickupCityId) params.set('pickup', rentCarData.pickupCityId)
    if (rentCarData.dropoffCityId) params.set('dropoff', rentCarData.dropoffCityId)
    if (rentCarData.pickupDate) params.set('pickupDate', rentCarData.pickupDate)
    if (rentCarData.returnDate) params.set('returnDate', rentCarData.returnDate)
    const query = params.toString()
    window.location.href = `/rent-car${query ? `?${query}` : ''}`
  }
  
  // Hero carousel images - only from dashboard (Admin → Site content → Hero). No default image.
  const homePage = siteContent ? getPageBySlug(siteContent, '/') : undefined
  const heroCms = getSection(homePage, 'hero') || (siteContent?.hero as Record<string, unknown> | undefined)
  const featuredCms = getSection(homePage, 'featuredTours')
  const bannerCms =
    getSection(homePage, 'sriLankaBanner') ||
    (siteContent?.sriLankaBanner as Record<string, unknown> | undefined)
  const featuresCms = getSection(homePage, 'features')
  const destinationsCms = getSection(homePage, 'destinations')
  const testimonialsCms = getSection(homePage, 'testimonials')
  const blogCms = getSection(homePage, 'blogPreview')
  const ctaCms = getSection(homePage, 'cta')
  const showFeatured = !homePage || isSectionEnabled(homePage, 'featuredTours')
  const showStats = !homePage || isSectionEnabled(homePage, 'stats')
  const showBanner = !homePage || isSectionEnabled(homePage, 'sriLankaBanner')
  const showFeatures = !homePage || isSectionEnabled(homePage, 'features')
  const showDestinations = !homePage || isSectionEnabled(homePage, 'destinations')
  const showTestimonials = !homePage || isSectionEnabled(homePage, 'testimonials')
  const showBlog = !homePage || isSectionEnabled(homePage, 'blogPreview')
  const showCta = !homePage || isSectionEnabled(homePage, 'cta')

  const heroImages = useMemo(() => {
    const fromCms = heroCms?.heroImages
    if (Array.isArray(fromCms) && fromCms.length > 0) {
      const valid = fromCms.filter((u): u is string => typeof u === 'string' && u.length > 0)
      if (valid.length > 0) return valid
    }
    return []
  }, [heroCms])
  const hasHeroSlides = heroImages.length > 0

  // Keep currentSlide in bounds when heroImages from CMS changes
  useEffect(() => {
    setCurrentSlide((s) => Math.min(s, Math.max(0, heroImages.length - 1)))
  }, [heroImages.length])

  // Screen loader: hide as soon as site content is in (faster) or after 1s max
  useEffect(() => {
    if (heroReady) return
    if (siteContent !== null) setHeroReady(true)
  }, [siteContent, heroReady])

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 1000)
    return () => clearTimeout(t)
  }, [])

  // Auto-advance carousel only when we have slides
  useEffect(() => {
    if (!hasHeroSlides) return
    const shouldShowCarousel = !isVideoPlaying || useFallbackImage
    if (shouldShowCarousel) {
      const interval = setInterval(() => {
        if (!isTransitioning) {
          setIsTransitioning(true)
          setSelectedHeroArrow('next')
          setCurrentSlide((prev) => (prev + 1) % heroImages.length)
          setTimeout(() => setIsTransitioning(false), 2500)
        }
      }, 8000)
      return () => clearInterval(interval)
    } else {
      setCurrentSlide(0)
      setIsTransitioning(false)
    }
  }, [isVideoPlaying, useFallbackImage, heroImages.length, isTransitioning, hasHeroSlides])
  
  const nextSlide = () => {
    if (!hasHeroSlides || isTransitioning) return
    setSelectedHeroArrow('next')
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }
  
  const prevSlide = () => {
    if (!hasHeroSlides || isTransitioning) return
    setSelectedHeroArrow('prev')
    setIsTransitioning(true)
    const prevIndex = (currentSlide - 1 + heroImages.length) % heroImages.length
    setCurrentSlide(prevIndex)
    // Reset transition state quickly to allow clicks, fade will still happen
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500) // Short delay to prevent rapid clicking
  }

  // Update dateRange when selectedStartDate or selectedEndDate changes
  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      // Use local date formatting to avoid timezone issues
      const startStr = selectedStartDate.getFullYear() + '-' + 
        String(selectedStartDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedStartDate.getDate()).padStart(2, '0')
      const endStr = selectedEndDate.getFullYear() + '-' + 
        String(selectedEndDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedEndDate.getDate()).padStart(2, '0')
      const dateRangeStr = `${startStr} to ${endStr}`
      console.log('useEffect updating dateRange:', dateRangeStr)
      console.log('Start date object:', selectedStartDate)
      console.log('End date object:', selectedEndDate)
      setCustomTripData(prev => ({
        ...prev,
        dateRange: dateRangeStr
      }))
    } else if (selectedStartDate && !selectedEndDate) {
      console.log('useEffect clearing dateRange for new selection')
      setCustomTripData(prev => ({
        ...prev,
        dateRange: ''
      }))
    }
  }, [selectedStartDate, selectedEndDate])

  // Sync selectedTourStartDate with searchData.startDate
  useEffect(() => {
    if (searchData.startDate) {
      const date = new Date(searchData.startDate)
      if (!isNaN(date.getTime())) {
        setSelectedTourStartDate(date)
      }
    } else {
      setSelectedTourStartDate(null)
    }
  }, [searchData.startDate])

  // Fetch featured tours and destinations in parallel for better performance
  useEffect(() => {
    let isMounted = true
    
    // Safety timeout to ensure loading states are cleared after 15 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Loading timeout reached, clearing loading states')
        setLoadingTours(false)
        setLoadingDestinations(false)
      }
    }, 15000)
    
    const loadData = async () => {
      try {
        setLoadingTours(true)
        setLoadingDestinations(true)
        
        // Fetch with timeout; allow browser cache for faster repeat loads
        const fetchWithTimeout = async (url: string, timeout = 12000) => {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)
            const response = await fetch(url, {
              signal: controller.signal,
              cache: 'default'
            })
            clearTimeout(timeoutId)
            return response
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Request timeout')
            }
            throw error
          }
        }
        
        // Fetch featured tours and destinations in parallel (priority)
        try {
          const [toursRes, destinationsRes] = await Promise.allSettled([
            fetchWithTimeout('/api/tours/featured', 12000),
            fetchWithTimeout('/api/destinations?includeTourCount=false', 12000)
          ])
          
          // Handle featured tours
          if (isMounted) {
            try {
              if (toursRes.status === 'fulfilled' && toursRes.value.ok) {
                const contentType = toursRes.value.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                  const json = await toursRes.value.json()
                  if (json.success && json.data) {
                    const featured = (json.data || []).filter((t: Tour) => {
                      const isValid = t && t.id && t.name
                      return isValid
                    })
                    setFeaturedTours(featured)
                    setAllTours((prev) => (prev.length ? prev : featured))
                  } else {
                    setFeaturedTours([])
                  }
                } else {
                  setFeaturedTours([])
                }
              } else {
                setFeaturedTours([])
              }
            } catch (error) {
              console.error('Error processing featured tours:', error)
              setFeaturedTours([])
            } finally {
              setLoadingTours(false)
            }
          }
          
          // Handle destinations
          if (isMounted) {
            try {
              if (destinationsRes.status === 'fulfilled' && destinationsRes.value.ok) {
                const contentType = destinationsRes.value.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                  const json = await destinationsRes.value.json()
                  if (json.success && json.data) {
                    setDestinations(json.data || [])
                  } else {
                    setDestinations([])
                  }
                } else {
                  setDestinations([])
                }
              } else {
                setDestinations([])
              }
            } catch (error) {
              console.error('Error processing destinations:', error)
              setDestinations([])
            } finally {
              setLoadingDestinations(false)
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          if (isMounted) {
            setFeaturedTours([])
            setDestinations([])
            setLoadingTours(false)
            setLoadingDestinations(false)
          }
        }
        
        if (isMounted) {
          fetchWithTimeout('/api/tours', 25000)
            .then(async (res) => {
              if (isMounted && res.ok) {
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                  const json = await res.json()
                  if (json.success && json.data) {
                    const tours = json.data || []
                    const uniqueTours = tours.filter((tour: Tour, index: number, self: Tour[]) => 
                      index === self.findIndex((t: Tour) => t.id === tour.id)
                    )
                    setAllTours(uniqueTours)
                  }
                }
              }
            })
            .catch((error) => {
              if (error instanceof Error && error.message === 'Request timeout') {
                console.warn('All tours load timed out; using featured data only.')
              } else {
                console.error('Error loading all tours (background):', error)
              }
            })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        if (isMounted) {
          setFeaturedTours([])
          setDestinations([])
          setLoadingTours(false)
          setLoadingDestinations(false)
        }
      }
    }
    
    loadData()
    
    // Cleanup function
    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    // Parallel CMS fetches; allow browser cache for faster repeat visits
    Promise.all([
      fetch('/api/site-content', { cache: 'force-cache' }).then(res => (res.ok ? res.json() : null)),
      fetch('/api/blog', { cache: 'force-cache' }).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([siteJson, posts]) => {
        if (!isMounted) return
        if (siteJson?.success && siteJson.data) setSiteContent(normalizeSiteContent(siteJson.data))
        if (Array.isArray(posts)) {
          setBlogPosts(posts.filter((p: { status?: string }) => p.status === 'Published'))
        }
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  // Filter destinations with useMemo for performance
  const filteredDestinations = useMemo(() => {
    return (destinations || []).filter(destination => {
      const regionMatch = selectedRegion === 'all' || destination.region === selectedRegion
      const searchMatch = destination.name.toLowerCase().includes(destinationSearchQuery.toLowerCase()) ||
                         (destination.description || '').toLowerCase().includes(destinationSearchQuery.toLowerCase())
      return regionMatch && searchMatch
    })
  }, [destinations, selectedRegion, destinationSearchQuery])

  const displayedDestinations = useMemo(
    () => filteredDestinations.slice(0, destinationsDisplayLimit),
    [filteredDestinations, destinationsDisplayLimit]
  )
  const hasMoreDestinations = filteredDestinations.length > destinationsDisplayLimit

  useEffect(() => {
    setDestinationsDisplayLimit(10)
  }, [selectedRegion, destinationSearchQuery])

  // Handle YouTube video initialization and state tracking
  useEffect(() => {
    const iframe = document.getElementById('hero-video') as HTMLIFrameElement;
    if (iframe) {
      console.log('YouTube iframe found:', iframe);
      console.log('YouTube src:', iframe.src);
      
      // Try to play video on load (for desktop)
      const tryPlayVideo = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          setIsVideoPlaying(true);
        }
      };
      
      // Listen for YouTube API events
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://www.youtube.com') return;
        
        try {
          const data = JSON.parse(event.data);
          
          switch (data.event) {
            case 'video-pause':
              setIsVideoPlaying(false);
              break;
            case 'video-play':
              setIsVideoPlaying(true);
              break;
            case 'video-end':
              // When video ends, switch to slideshow
              console.log('Video ended, switching to slideshow');
              setIsVideoPlaying(false);
              break;
            case 'onStateChange':
              // Handle YouTube player state changes
              // 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
              if (data.info === 0) {
                // Video ended
                console.log('Video ended, switching to slideshow');
                setIsVideoPlaying(false);
              } else if (data.info === 1) {
                // Video is playing
                setIsVideoPlaying(true);
              } else if (data.info === 2) {
                // Video is paused
                setIsVideoPlaying(false);
              }
              break;
          }
        } catch {
          // Ignore non-JSON messages
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [])

  // Statistics data – numericValue/suffix used for counter animation
  const stats = [
    { number: '500+', label: 'Happy Travelers', icon: Users, numericValue: 500, suffix: '+' },
    { number: '50+', label: 'Tour Packages', icon: Globe, numericValue: 50, suffix: '+' },
    { number: '4.9', label: 'Average Rating', icon: Star, numericValue: 4.9, suffix: '' },
    { number: '24/7', label: 'Customer Support', icon: Headphones, numericValue: 24, suffix: '/7' }
  ]

  const statsSectionRef = useRef<HTMLElement>(null)
  const [statsInView, setStatsInView] = useState(false)
  const [animatedValues, setAnimatedValues] = useState<number[]>(stats.map(() => 0))

  useEffect(() => {
    const el = statsSectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setStatsInView(true)
      },
      { threshold: 0.2, rootMargin: '0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!statsInView) return
    const duration = 1800
    const start = performance.now()
    const endValues = stats.map((s) => (s as { numericValue: number }).numericValue)

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - t, 3)
      const next = endValues.map((end, i) => {
        const value = 0 + (end - 0) * easeOut
        return i === 2 ? Math.round(value * 10) / 10 : Math.round(value)
      })
      setAnimatedValues(t >= 1 ? endValues : next)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [statsInView])

  // Features inspired by Swimlane's feature cards
  const features = [
    {
      icon: Shield,
      title: 'Safe & Secure Travel',
      description: 'Your safety is our priority with comprehensive travel insurance and 24/7 support.',
      color: 'text-blue-600'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Customize your itinerary with flexible dates and personalized experiences.',
      color: 'text-green-600'
    },
    {
      icon: Award,
      title: 'Expert Guides',
      description: 'Professional local guides with deep knowledge of Sri Lankan culture and history.',
      color: 'text-purple-600'
    },
    {
      icon: Camera,
      title: 'Memorable Experiences',
      description: 'Create unforgettable memories with our carefully curated tour experiences.',
      color: 'text-orange-600'
    }
  ]

  const fallbackPlanDestinations = [
    { id: 'colombo', name: 'Colombo', region: 'Western Province' },
    { id: 'kandy', name: 'Kandy', region: 'Central Province' },
    { id: 'galle', name: 'Galle', region: 'Southern Province' },
    { id: 'sigiriya', name: 'Sigiriya', region: 'Cultural Triangle' },
    { id: 'ella', name: 'Ella', region: 'Uva Province' },
    { id: 'mirissa', name: 'Mirissa', region: 'Southern Province' },
    { id: 'anuradhapura', name: 'Anuradhapura', region: 'North Central Province' },
    { id: 'polonnaruwa', name: 'Polonnaruwa', region: 'North Central Province' },
    { id: 'nuwara-eliya', name: 'Nuwara Eliya', region: 'Central Province' },
    { id: 'dambulla', name: 'Dambulla', region: 'Cultural Triangle' },
    { id: 'bentota', name: 'Bentota', region: 'Southern Province' },
    { id: 'trincomalee', name: 'Trincomalee', region: 'Eastern Province' },
    { id: 'jaffna', name: 'Jaffna', region: 'Northern Province' },
    { id: 'arugam-bay', name: 'Arugam Bay', region: 'Eastern Province' },
    { id: 'hikkaduwa', name: 'Hikkaduwa', region: 'Southern Province' },
    { id: 'unawatuna', name: 'Unawatuna', region: 'Southern Province' },
    { id: 'tangalle', name: 'Tangalle', region: 'Southern Province' },
    { id: 'yala', name: 'Yala', region: 'Southern Province' },
    { id: 'udawalawe', name: 'Udawalawe', region: 'Southern Province' },
    { id: 'sinharaja', name: 'Sinharaja', region: 'Southern Province' },
  ]

  // Prefer live CMS destinations so Plan Your Trip IDs match /custom-booking
  const availableDestinations = useMemo(() => {
    const live = (destinations || [])
      .filter((d: { status?: string; id?: string; name?: string }) => d.status !== 'inactive' && d.id && d.name)
      .map((d: { id: string; name: string; region?: string }) => ({
        id: String(d.id),
        name: String(d.name),
        region: String(d.region || ''),
      }))
    return live.length > 0 ? live : fallbackPlanDestinations
  }, [destinations])

  const tripInterests = [
    { id: 'culture', name: 'Culture & History' },
    { id: 'nature', name: 'Nature & Wildlife' },
    { id: 'beach', name: 'Beaches & Water Sports' },
    { id: 'adventure', name: 'Adventure & Hiking' },
    { id: 'food', name: 'Food & Cuisine' },
    { id: 'relaxation', name: 'Relaxation & Wellness' },
    { id: 'photography', name: 'Photography' },
    { id: 'shopping', name: 'Shopping & Markets' }
  ]

  const handleVideoPlay = () => {
    const iframe = document.getElementById('hero-video') as HTMLIFrameElement;
    if (iframe) {
      console.log('Play button clicked, current state:', isVideoPlaying);
      
      if (isVideoPlaying) {
        console.log('Pausing YouTube video...');
        // Pause the video by sending a message to the iframe
        iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        setIsVideoPlaying(false);
      } else {
        console.log('Resuming YouTube video...');
        // Resume the video by sending a message to the iframe
        iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        setIsVideoPlaying(true);
      }
    } else {
      console.error('Video iframe not found!');
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchData.guests > 0) params.set('guests', String(searchData.guests))
    if (searchData.startDate) params.set('startDate', searchData.startDate)
    if (searchData.endDate) params.set('endDate', searchData.endDate)
    const query = params.toString()

    if (searchData.tourPackage) {
      const selected = allTours.find((t) => t.id === searchData.tourPackage)
      if (selected && !tourFitsGuestCountFromTour(selected, searchData.guests)) {
        alert(
          `This tour is listed for ${getTourGroupSize(selected) || 'a different group size'}. Please pick a package that fits ${searchData.guests} guest${searchData.guests === 1 ? '' : 's'}.`
        )
        return
      }
      window.location.href = `/tours/${searchData.tourPackage}${query ? `?${query}` : ''}`
    } else {
      window.location.href = `/tours${query ? `?${query}` : ''}`
    }
  }

  const handleViewTourDetails = (tourId: string) => {
    window.location.href = `/tours/${tourId}`
  }

  const handleCustomTripBooking = () => {
    if (customTripData.destinations.length === 0) {
      alert('Please select at least one destination.')
      return
    }
    if (!customTripData.dateRange || !selectedStartDate || !selectedEndDate) {
      alert('Please select your travel date range.')
      return
    }

    const startDate = formatDate(selectedStartDate)
    const endDate = formatDate(selectedEndDate)
    const selected = customTripData.destinations
      .map((id) => availableDestinations.find((d) => d.id === id))
      .filter(Boolean) as { id: string; name: string; region: string }[]

    const tripData = {
      destinations: selected.map((d) => d.id),
      destinationNames: selected.map((d) => d.name),
      destinationDetails: selected,
      startDate,
      endDate,
      dateRange: `${startDate} to ${endDate}`,
      guests: customTripData.guests,
      interests: customTripData.interests,
    }

    localStorage.setItem('customTripData', JSON.stringify(tripData))
    window.location.href = '/custom-booking'
  }

  const handleDestinationToggle = (destinationId: string) => {
    setCustomTripData(prev => ({
      ...prev,
      destinations: prev.destinations.includes(destinationId)
        ? prev.destinations.filter(id => id !== destinationId)
        : [...prev.destinations, destinationId]
    }))
  }

  const handleInterestToggle = (interestId: string) => {
    setCustomTripData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', formatDate(date))
    console.log('Current start date:', selectedStartDate ? formatDate(selectedStartDate) : 'none')
    console.log('Current end date:', selectedEndDate ? formatDate(selectedEndDate) : 'none')
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      console.log('Starting new selection')
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    } else {
      // Complete the range
      console.log('Completing range')
      if (date.getTime() >= selectedStartDate.getTime()) {
        // Normal case: end date is after or same as start date
        console.log('Normal case - end date after start date')
        setSelectedEndDate(date)
        setShowDatePicker(false)
      } else {
        // If end date is before start date, swap them
        console.log('Swapping dates - end date before start date')
        setSelectedStartDate(date)
        setSelectedEndDate(selectedStartDate)
        setShowDatePicker(false)
      }
    }
  }

  const handleTourDateSelect = (date: Date) => {
    setSelectedTourStartDate(date)
    const dateStr = formatDate(date)
    setSearchData({...searchData, startDate: dateStr})
    setShowToursDatePicker(false)
  }

  const isTourDateSelected = (date: Date) => {
    if (!selectedTourStartDate) return false
    return formatDate(date) === formatDate(selectedTourStartDate)
  }

  const handleRentPickupDateSelect = (date: Date) => {
    const dateStr = formatDate(date)
    setRentCarData((prev) => ({
      ...prev,
      pickupDate: dateStr,
      returnDate: prev.returnDate && prev.returnDate < dateStr ? '' : prev.returnDate,
    }))
    setShowRentPickupDatePicker(false)
  }

  const handleRentReturnDateSelect = (date: Date) => {
    const dateStr = formatDate(date)
    setRentCarData((prev) => ({ ...prev, returnDate: dateStr }))
    setShowRentReturnDatePicker(false)
  }

  const isRentPickupDateSelected = (date: Date) =>
    !!rentCarData.pickupDate && formatDate(date) === rentCarData.pickupDate

  const isRentReturnDateSelected = (date: Date) =>
    !!rentCarData.returnDate && formatDate(date) === rentCarData.returnDate

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDate = (date: Date) => {
    // Use local date formatting to avoid timezone issues
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0')
  }

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false
    const dateStr = formatDate(date)
    const startStr = formatDate(selectedStartDate)
    const endStr = formatDate(selectedEndDate)
    return dateStr >= startStr && dateStr <= endStr
  }

  const isDateSelected = (date: Date) => {
    const dateStr = formatDate(date)
    const startStr = selectedStartDate ? formatDate(selectedStartDate) : ''
    const endStr = selectedEndDate ? formatDate(selectedEndDate) : ''
    return dateStr === startStr || dateStr === endStr
  }

  // Manual scroll detection for tour packages slider
  useEffect(() => {
    const container = document.getElementById('tour-slider');
    if (!container) return;

    const getCardStep = () => {
      const first = container.children[0] as HTMLElement | undefined
      const second = container.children[1] as HTMLElement | undefined
      if (!first) return 300
      if (second) return second.offsetLeft - first.offsetLeft
      return first.offsetWidth
    }

    const handleScroll = () => {
      const cardStep = getCardStep()
      if (cardStep <= 0) return
      const newSlide = Math.round(container.scrollLeft / cardStep)
      setFeaturedTourSlide(Math.max(0, Math.min(newSlide, featuredTours.length - 1)))
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [featuredTours.length]);

  useEffect(() => {
    setFeaturedTourSlide((s) => Math.min(s, Math.max(0, featuredTours.length - 1)))
  }, [featuredTours.length]);

  // Function to navigate to specific featured tour slide
  const goToFeaturedSlide = (slideIndex: number) => {
    const container = document.getElementById('tour-slider');
    if (!container) return
    const first = container.children[0] as HTMLElement | undefined
    const second = container.children[1] as HTMLElement | undefined
    const cardStep = first
      ? (second ? second.offsetLeft - first.offsetLeft : first.offsetWidth)
      : 300
    container.scrollTo({ left: slideIndex * cardStep, behavior: 'smooth' })
    setFeaturedTourSlide(slideIndex)
  };

  return (
    <div className="min-h-screen bg-[var(--foam)] dark:bg-[var(--foam)] lp-section-ink">
      {/* Full-screen loader until hero is ready - prevents "image not found" flash */}
      {!heroReady && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[var(--lagoon-deep)] transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-12 h-12 border-4 border-white/30 border-t-[var(--sun)] rounded-full animate-spin" />
          <p className="mt-4 text-white/90 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      )}

      <Header />

      {/* Hero — mobile + iPad Mini (<820px): auto height, 48px top/bottom
          iPad Air/Pro: centered · large desktop: bottom-aligned */}
      <section
        className="relative text-white overflow-visible w-full flex items-start min-[820px]:min-h-[100dvh] min-[820px]:items-center min-[1400px]:items-end"
      >
        {/* Background Video/Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Hero Carousel - shown when video is not playing or failed */}
          <div className={`absolute inset-0 z-0 transition-opacity duration-500 group ${isVideoPlaying && !useFallbackImage ? 'sm:opacity-0 opacity-100' : 'opacity-100'}`}>
            <div className="relative w-full h-full">
              {hasHeroSlides && heroImages.map((image, index) => {
                const src = failedHeroImageIndices.has(index) ? '/placeholder-image.svg' : image
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity ease-in-out duration-700 will-change-opacity ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <SafeImage
                      src={src}
                      alt={`Hero ${index + 1}`}
                      fill
                      priority={index <= 1}
                      className={`object-cover ${index === currentSlide ? 'lp-kenburns' : ''}`}
                      quality={80}
                      sizes="100vw"
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      style={{ objectFit: 'cover' }}
                      onError={() => setFailedHeroImageIndices((prev) => new Set(prev).add(index))}
                    />
                  </div>
                )
              })}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--lagoon-deep)]/90 via-[var(--lagoon-deep)]/35 to-black/20 z-20 pointer-events-none" aria-hidden />
            </div>
          </div>
          
          {/* YouTube Video Background - shown only on desktop when video is playing and not using fallback */}
          <div className={`absolute inset-0 z-20 transition-opacity duration-500 hidden sm:block ${isVideoPlaying && !useFallbackImage ? 'opacity-100' : 'opacity-0'}`}>
            <div className="youtube-container">
              <iframe
                id="hero-video"
                src={
                  String(heroCms?.videoUrl || '') ||
                  'https://www.youtube.com/embed/y5bHGWAE50c?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&start=0&cc_load_policy=0&playsinline=1&enablejsapi=1&origin=*&widget_referrer=*&widgetid=1&autohide=1&wmode=transparent'
                }
                title="Sri Lanka Travel Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                  console.log('YouTube video loaded');
                  setVideoLoaded(true);
                  // Video does not autoplay; carousel stays visible until user plays
                  setIsVideoPlaying(false);
                }}
                onError={() => {
                  console.error('YouTube video failed to load');
                  setIsVideoPlaying(false);
                  setVideoError(true);
                  setUseFallbackImage(true);
                }}
              />
              {/* CSS Overlay to hide YouTube controls */}
              <div className="youtube-overlay"></div>
            </div>
            {/* Dark overlay on top of video - 70% opacity */}
            <div className="absolute inset-0 bg-black/70 z-30 pointer-events-none"></div>
          </div>
        </div>

        <div className="relative w-full max-w-[1920px] mx-auto lp-gutter z-30 py-12 min-[820px]:py-16 min-[1400px]:py-24">
          <div className="max-w-3xl w-full lp-reveal text-left">
            <p className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-3 sm:mb-4 tracking-tight">
              {String(heroCms?.brandLine || 'ISLE & ECHO')}
            </p>
            <h1 className="font-display text-xl sm:text-2xl md:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-5 leading-snug tracking-tight">
              {heroCms?.headlineHighlight
                ? `${String(heroCms.headline || '')} ${String(heroCms.headlineHighlight)}`.trim()
                : String(heroCms?.headline || 'Your next Sri Lanka trip starts here')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-7 sm:mb-8 max-w-2xl leading-relaxed">
              {String(
                heroCms?.subtitle ||
                  'Feel the isle, hear the echo — curated journeys through culture, coastline, and wild nature.'
              )}
            </p>

            {/* CTA Buttons + carousel arrows (iPad Air+ / desktop) */}
            <div className="flex flex-col min-[820px]:flex-row min-[820px]:flex-wrap items-stretch min-[820px]:items-center gap-3 min-[820px]:gap-4 mb-8 min-[820px]:mb-10">
              <button 
                onClick={() => window.location.href = String(heroCms?.ctaPrimaryUrl || '/tours')}
                className="bg-[var(--sun)] hover:brightness-105 active:brightness-95 text-[var(--lagoon-deep)] px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all flex items-center justify-center min-h-[44px] touch-manipulation shadow-lg"
              >
                {String(heroCms?.ctaPrimaryText || 'Start discovering')}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </button>
              <button 
                onClick={handleVideoPlay}
                disabled={videoError}
                className="hidden min-[820px]:flex px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-colors items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation hover:brightness-110"
                style={{ background: '#0b3d4a', color: '#d4f06a' }}
              >
                {videoError || useFallbackImage ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {useFallbackImage ? 'Using Image' : 'Video Error'}
                  </>
                ) : isVideoPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Watch the film
                  </>
                )}
              </button>

              {hasHeroSlides && (
                <div className="hidden min-[820px]:flex items-center gap-2 sm:gap-3 ml-0 sm:ml-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      prevSlide()
                    }}
                    style={
                      selectedHeroArrow === 'prev'
                        ? { color: '#0b3d4a', background: '#d4f06a', borderColor: '#d4f06a' }
                        : { color: '#d4f06a', background: '#0b3d4a', borderColor: 'rgba(212, 240, 106, 0.4)' }
                    }
                    className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 lg:w-[3.25rem] lg:h-[3.25rem] rounded-full border shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                    aria-label="Previous slide"
                    aria-pressed={selectedHeroArrow === 'prev'}
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      nextSlide()
                    }}
                    style={
                      selectedHeroArrow === 'next'
                        ? { color: '#0b3d4a', background: '#d4f06a', borderColor: '#d4f06a' }
                        : { color: '#d4f06a', background: '#0b3d4a', borderColor: 'rgba(212, 240, 106, 0.4)' }
                    }
                    className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 lg:w-[3.25rem] lg:h-[3.25rem] rounded-full border shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                    aria-label="Next slide"
                    aria-pressed={selectedHeroArrow === 'next'}
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.25} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Search Section — full width on tablet & desktop; allow popovers to escape */}
          <div className="w-full mt-6 min-[820px]:mt-8 min-[1400px]:mt-10 animate-fade-in-up delay-100 relative overflow-visible z-40">
              {/* Search Tabs */}
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 md:mb-5">
                {[
                { id: 'tours', label: 'Tours' },
                { id: 'plan-trip', label: 'Plan Your Trip' },
                { id: 'rent-car', label: 'Rent a Car' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSearchTab(tab.id)}
                  style={
                    searchTab === tab.id
                      ? { color: '#0b3d4a', background: '#d4f06a' }
                      : { color: '#d4f06a', background: '#0b3d4a' }
                  }
                  className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-semibold rounded-full transition-all duration-200 min-h-[40px] touch-manipulation hover:brightness-110"
                  >
                  {tab.label}
                  </button>
                ))}
              </div>
            
                             {/* Search Form — overflow visible so package list + calendars can pop outside the glass panel */}
             <div
               className={`rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12 lp-glass relative overflow-visible ${
                 searchOverlayOpen ? 'z-50' : 'z-30'
               }`}
             >
               {searchTab === 'tours' && (
                 <>
                   <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-3 min-[820px]:gap-5 min-[1024px]:gap-6 lg:gap-8 relative min-w-0 overflow-visible items-start">
                     {/* Tour Package */}
                     <div className={`relative min-w-0 w-full self-start ${showPackageDropdown ? 'z-[100]' : 'z-10'}`} ref={packageDropdownRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Tour Package</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showPackageDropdown) {
                               setShowPackageDropdown(false)
                             } else {
                               closeSearchOverlays()
                               setShowPackageDropdown(true)
                             }
                           }}
                           aria-expanded={showPackageDropdown}
                           aria-haspopup="listbox"
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-11 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation flex items-center"
                         >
                           <span className="block truncate">
                             {(() => {
                               if (!searchData.tourPackage) return 'Select Your Package'
                               const selected = publicTours.find((t) => t.id === searchData.tourPackage)
                                 || allTours.find((t) => t.id === searchData.tourPackage)
                               if (!selected) return 'Select Your Package'
                               const paxLabel = formatGroupSizeRange(getTourGroupSize(selected))
                               return `${selected.name}${paxLabel ? ` (${paxLabel})` : ''}`
                             })()}
                           </span>
                         </button>
                         <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400 transition-transform ${showPackageDropdown ? 'rotate-180' : ''}`} />

                         {showPackageDropdown && (
                           <div className="absolute left-0 right-0 top-full mt-1 z-[110] overflow-hidden rounded-xl border border-black/10 bg-white dark:bg-gray-800 shadow-2xl w-full min-w-0">
                             <div className="relative border-b border-gray-100 p-2">
                               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                               <input
                                 ref={packageSearchRef}
                                 type="search"
                                 value={packageSearch}
                                 onChange={(e) => setPackageSearch(e.target.value)}
                                 onClick={(e) => e.stopPropagation()}
                                 placeholder="Search tour name..."
                                 className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/20"
                               />
                             </div>
                             <ul
                               role="listbox"
                               className="max-h-[min(280px,50vh)] sm:max-h-[min(360px,45vh)] overflow-y-auto overscroll-contain py-1"
                             >
                               <li>
                                 <button
                                   type="button"
                                   role="option"
                                   aria-selected={!searchData.tourPackage}
                                   onClick={() => {
                                     setSearchData({ ...searchData, tourPackage: '' })
                                     closePackageDropdown()
                                   }}
                                   className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                                 >
                                   Select Your Package
                                 </button>
                               </li>
                               {searchableTours.map((tourPackage: Tour, index: number) => {
                                 const paxLabel = formatGroupSizeRange(getTourGroupSize(tourPackage))
                                 const label = `${tourPackage.name}${paxLabel ? ` (${paxLabel})` : ''}`
                                 const isSelected = searchData.tourPackage === tourPackage.id
                                 return (
                                   <li key={`${tourPackage.id}-${index}`}>
                                     <button
                                       type="button"
                                       role="option"
                                       aria-selected={isSelected}
                                       title={label}
                                       onClick={() => {
                                         setSearchData({ ...searchData, tourPackage: tourPackage.id })
                                         closePackageDropdown()
                                       }}
                                       className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-colors break-words ${
                                         isSelected
                                           ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                           : 'text-gray-900 dark:text-white hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                       }`}
                                     >
                                       {label}
                                     </button>
                                   </li>
                                 )
                               })}
                               {searchableTours.length === 0 && (
                                 <li className="px-3 sm:px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                                   {publicTours.length === 0
                                     ? 'No tour packages available'
                                     : `No tours match “${packageSearch}”`}
                                 </li>
                               )}
                             </ul>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     {/* Start Date */}
                     <div className={`relative min-w-0 w-full self-start overflow-visible ${showToursDatePicker ? 'z-[120]' : 'z-20'}`} ref={toursDatePickerRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Start Date</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showToursDatePicker) {
                               setShowToursDatePicker(false)
                             } else {
                               closeSearchOverlays()
                               setShowToursDatePicker(true)
                             }
                           }}
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-8 sm:pr-10 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation truncate"
                           aria-expanded={showToursDatePicker}
                         >
                           {searchData.startDate 
                             ? new Date(searchData.startDate).toLocaleDateString('en-US', { 
                                 year: 'numeric', 
                                 month: 'short', 
                                 day: 'numeric' 
                               })
                             : 'Select start date'}
                         </button>
                         <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />

                         {/* Date Picker Popup — anchored to the date button */}
                         {showToursDatePicker && (
                           <div className="absolute top-full left-0 right-0 mt-1 text-black dark:text-white bg-white dark:bg-gray-800 border border-black/10 rounded-xl shadow-2xl z-[130] p-3 sm:p-4 w-full max-w-full min-w-0 sm:w-auto sm:min-w-[300px]">
                             <div className="flex items-center justify-between mb-4">
                               <button
                                 type="button"
                                 onClick={() => setCurrentToursMonth(new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth() - 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 ←
                               </button>
                               <h3 className="font-semibold text-gray-900 dark:text-white">
                                 {currentToursMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                               </h3>
                               <button
                                 type="button"
                                 onClick={() => setCurrentToursMonth(new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth() + 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 →
                               </button>
                             </div>

                             <div className="grid grid-cols-7 gap-1 mb-2">
                               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                 <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
                                   {day}
                                 </div>
                               ))}
                             </div>

                             <div className="grid grid-cols-7 gap-1">
                               {Array.from({ length: getFirstDayOfMonth(currentToursMonth.getFullYear(), currentToursMonth.getMonth()) }).map((_, i) => (
                                 <div key={`empty-${i}`} className="p-2"></div>
                               ))}

                               {Array.from({ length: getDaysInMonth(currentToursMonth.getFullYear(), currentToursMonth.getMonth()) }).map((_, i) => {
                                 const day = i + 1
                                 const date = new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth(), day)
                                 const isToday = formatDate(date) === formatDate(new Date())
                                 const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                                 return (
                                   <button
                                     key={day}
                                     type="button"
                                     onClick={() => !isPast && handleTourDateSelect(date)}
                                     disabled={isPast}
                                     className={`p-2 text-sm rounded transition-colors ${
                                       isPast
                                         ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                         : isTourDateSelected(date)
                                         ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                         : isToday
                                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                         : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                     }`}
                                   >
                                     {day}
                                   </button>
                                 )
                               })}
                             </div>

                             <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
                               {!selectedTourStartDate
                                 ? 'Click to select start date'
                                 : 'Date selected'
                               }
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     {/* Number of Guests */}
                     <div className="relative z-10 self-start min-w-0 w-full">
                     <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Number of Guests</label>
                       <div className="relative flex items-center min-w-0 w-full">
                         <button
                           type="button"
                           aria-label="Decrease guests"
                           onClick={() => setSearchData({ ...searchData, guests: Math.max(1, (searchData.guests || 1) - 1) })}
                           className="absolute left-2 z-10 w-9 h-9 rounded-full bg-[var(--lagoon-deep)] text-[var(--sun)] border border-[var(--sun)]/40 font-bold hover:bg-[var(--sun)] hover:text-[var(--lagoon-deep)] transition-colors flex items-center justify-center"
                         >
                           −
                         </button>
                         <input
                           type="number"
                           min={1}
                           inputMode="numeric"
                           value={searchData.guests}
                           onChange={(e) => {
                             const raw = e.target.value
                             if (raw === '') {
                               setSearchData({ ...searchData, guests: 1 })
                               return
                             }
                             const n = parseInt(raw, 10)
                             if (!Number.isFinite(n)) return
                             setSearchData({ ...searchData, guests: Math.max(1, Math.min(999, n)) })
                           }}
                           className="w-full pl-12 pr-12 py-3 sm:py-4 md:py-5 text-base md:text-lg text-center border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent transition-colors text-gray-900 dark:text-white bg-white/70 dark:bg-gray-800/80 min-h-[44px] md:min-h-[56px] touch-manipulation [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                         />
                         <button
                           type="button"
                           aria-label="Increase guests"
                           onClick={() => setSearchData({ ...searchData, guests: Math.min(999, (searchData.guests || 1) + 1) })}
                           className="absolute right-2 z-10 w-9 h-9 rounded-full bg-[var(--lagoon-deep)] text-[var(--sun)] border border-[var(--sun)]/40 font-bold hover:bg-[var(--sun)] hover:text-[var(--lagoon-deep)] transition-colors flex items-center justify-center"
                         >
                           +
                         </button>
                       </div>
                       <p className="mt-1.5 text-[11px] md:text-xs text-[var(--lagoon-deep)]/70 dark:text-white/70">Enter any number of guests</p>
                     </div>
                   </div>
                   
                   {/* Tour Package Summary */}
                   {searchData.tourPackage && (
                     <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl border border-white/40 bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm">
                       {(() => {
                         const selectedTour = allTours.find((tour: Tour) => tour.id === searchData.tourPackage);
                         if (!selectedTour) return null;
                         
                         return (
                           <div className="space-y-4">
                             {/* Tour Info */}
                             <div className="flex items-center justify-between gap-4">
                               <div className="text-left min-w-0">
                                 <h3 className="text-lg font-bold text-[var(--lagoon-deep)] dark:text-white">{selectedTour.name}</h3>
                                 <p className="text-[var(--lagoon)] dark:text-[var(--sun)] font-medium pb-2">{selectedTour.duration}</p>
                               </div>
                               <div className="text-right shrink-0">
                                 <div className="flex items-center justify-end space-x-1">
                                   <Star className="w-4 h-4 text-[var(--sun)] fill-current" />
                                   <span className="text-sm font-semibold text-[var(--lagoon-deep)] dark:text-white">{getTourRating(selectedTour) || '—'}</span>
                                 </div>
                                 <p className="text-xs text-[var(--lagoon-deep)]/70 dark:text-white/70">({getTourReviews(selectedTour)} reviews)</p>
                                 {parseFloat(String(selectedTour.price || '').replace(/[^0-9.]/g, '')) > 0 && (
                                   <p className="mt-1 text-sm font-bold text-[var(--lagoon-deep)] dark:text-[var(--sun)]">{formatPrice(selectedTour.price)}</p>
                                 )}
                               </div>
                             </div>
                             
                             {/* Location Summary */}
                             <div>
                               <h4 className="text-xs sm:text-sm font-semibold text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase mb-2">
                                 Tour Locations
                               </h4>
                               <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                 {(selectedTour.destinations || []).map((destination: string, idx: number) => (
                                   <span
                                     key={idx}
                                     className="inline-flex items-center px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 text-[var(--lagoon-deep)] dark:text-white text-xs sm:text-sm rounded-full border border-white/40 shadow-sm font-medium"
                                   >
                                     {destination}
                                   </span>
                                 ))}
                               </div>
                             </div>
                           </div>
                         );
                       })()}
                     </div>
                   )}
                   
                   {/* Search Button */}
                   <div className="flex justify-center mt-4 sm:mt-6 md:mt-8">
                     <button 
                       onClick={handleSearch}
                        className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] active:brightness-95 text-white px-6 sm:px-10 md:px-14 py-3 sm:py-4 md:py-5 rounded-full font-bold text-base sm:text-lg md:text-xl transition-all flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto md:min-w-[280px] min-h-[44px] md:min-h-[56px] touch-manipulation"
                     >
                     <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                     <span>Search</span>
                     </button>
                   </div>
                 </>
               )}

                               {searchTab === 'plan-trip' && (
                  <>
                    <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-3 min-[820px]:gap-5 min-[1024px]:gap-6 lg:gap-8 relative min-w-0 overflow-visible items-start">
                      {/* Destinations Selection */}
                      <div className={`relative min-w-0 w-full self-start ${showDestDropdown ? 'z-[100]' : 'z-10'}`} ref={destDropdownRef}>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Destinations</label>
                        <div className="relative min-w-0 w-full overflow-visible">
                          <button
                            type="button"
                            onClick={() => {
                              if (showDestDropdown) {
                                setShowDestDropdown(false)
                              } else {
                                closeSearchOverlays()
                                setShowDestDropdown(true)
                              }
                            }}
                            aria-expanded={showDestDropdown}
                            aria-haspopup="listbox"
                            className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-11 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation flex items-center"
                          >
                            <span className="block truncate">
                              {customTripData.destinations.length > 0
                                ? `${customTripData.destinations.length} destination${customTripData.destinations.length === 1 ? '' : 's'} selected`
                                : 'Select destinations'}
                            </span>
                          </button>
                          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400 transition-transform ${showDestDropdown ? 'rotate-180' : ''}`} />

                          {showDestDropdown && (
                            <ul
                              role="listbox"
                              aria-multiselectable="true"
                              className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] sm:max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white dark:bg-gray-800 shadow-2xl py-1 w-full min-w-0"
                            >
                              {availableDestinations.map((destination) => {
                                const isSelected = customTripData.destinations.includes(destination.id)
                                const label = `${destination.name} - ${destination.region}`
                                return (
                                  <li key={destination.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={isSelected}
                                      title={label}
                                      onClick={() => handleDestinationToggle(destination.id)}
                                      className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-colors break-words ${
                                        isSelected
                                          ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                          : 'text-gray-900 dark:text-white hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Date Range */}
                      <div className={`relative min-w-0 w-full self-start overflow-visible ${showDatePicker ? 'z-[120]' : 'z-20'}`} ref={customDatePickerRef}>
                        <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Date Range</label>
                        <div className="relative min-w-0 w-full overflow-visible">
                          <button
                            type="button"
                            onClick={() => {
                              if (showDatePicker) {
                                setShowDatePicker(false)
                              } else {
                                closeSearchOverlays()
                                setShowDatePicker(true)
                              }
                            }}
                            className="w-full pl-3 sm:pl-4 md:pl-5 pr-8 sm:pr-10 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation"
                            aria-expanded={showDatePicker}
                          >
                            {customTripData.dateRange || 'Select date range'}
                          </button>
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />

                          {/* Date Picker Popup — anchored to the date button, not the stretched grid cell */}
                          {showDatePicker && (
                            <div className="absolute top-full left-0 right-0 mt-1 text-black dark:text-white bg-white dark:bg-gray-800 border border-black/10 rounded-xl shadow-2xl z-[130] p-3 sm:p-4 w-full max-w-full min-w-0 sm:w-auto sm:min-w-[300px]">
                              <div className="flex items-center justify-between mb-4">
                                <button
                                  type="button"
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                                >
                                  ←
                                </button>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                                >
                                  →
                                </button>
                              </div>

                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                  <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
                                    {day}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                                  <div key={`empty-${i}`} className="p-2"></div>
                                ))}

                                {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                                  const day = i + 1
                                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                                  const isToday = formatDate(date) === formatDate(new Date())
                                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => !isPast && handleDateSelect(date)}
                                      disabled={isPast}
                                      className={`p-2 text-sm rounded transition-colors ${
                                        isPast
                                          ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                          : isDateSelected(date)
                                          ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                          : isDateInRange(date)
                                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                                          : isToday
                                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  )
                                })}
                              </div>

                              <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
                                {!selectedStartDate
                                  ? 'Click to select start date'
                                  : !selectedEndDate
                                  ? 'Click to select end date'
                                  : 'Date range selected'
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Number of Guests */}
                      <div className="relative z-10 self-start min-w-0 w-full">
                        <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Number of Guests</label>
                        <div className="relative flex items-center">
                          <button
                            type="button"
                            aria-label="Decrease guests"
                            onClick={() => setCustomTripData({ ...customTripData, guests: Math.max(1, (customTripData.guests || 1) - 1) })}
                            className="absolute left-2 z-10 w-9 h-9 rounded-full bg-[var(--lagoon-deep)] text-[var(--sun)] border border-[var(--sun)]/40 font-bold hover:bg-[var(--sun)] hover:text-[var(--lagoon-deep)] transition-colors flex items-center justify-center"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={customTripData.guests}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === '') {
                                setCustomTripData({ ...customTripData, guests: 1 })
                                return
                              }
                              const n = parseInt(raw, 10)
                              if (!Number.isFinite(n)) return
                              setCustomTripData({ ...customTripData, guests: Math.max(1, Math.min(999, n)) })
                            }}
                            className="w-full pl-12 pr-12 py-3 sm:py-4 md:py-5 text-base md:text-lg text-center border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent transition-colors text-gray-900 dark:text-white bg-white/70 dark:bg-gray-800/80 min-h-[44px] md:min-h-[56px] touch-manipulation [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase guests"
                            onClick={() => setCustomTripData({ ...customTripData, guests: Math.min(999, (customTripData.guests || 1) + 1) })}
                            className="absolute right-2 z-10 w-9 h-9 rounded-full bg-[var(--lagoon-deep)] text-[var(--sun)] border border-[var(--sun)]/40 font-bold hover:bg-[var(--sun)] hover:text-[var(--lagoon-deep)] transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] md:text-xs text-[var(--lagoon-deep)]/70 dark:text-white/70">Enter any number of guests</p>
                      </div>
                    </div>

                    {/* Selected destinations — full section width, wrap inline to the edge */}
                    {customTripData.destinations.length > 0 && (
                      <div className="mt-3 sm:mt-4 w-full min-w-0">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 content-start">
                          {customTripData.destinations.map((destId) => {
                            const destination = availableDestinations.find(d => d.id === destId)
                            return destination ? (
                              <span
                                key={destId}
                                className="inline-flex max-w-full items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 text-[var(--lagoon-deep)] dark:text-white text-xs sm:text-sm rounded-full border border-white/40 shadow-sm"
                              >
                                <span className="truncate">{destination.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDestinationToggle(destId)}
                                  className="text-[var(--lagoon)] hover:text-[var(--lagoon-deep)] active:text-[var(--lagoon-deep)] min-w-[24px] min-h-[24px] shrink-0 flex items-center justify-center touch-manipulation"
                                  aria-label={`Remove ${destination.name}`}
                                >
                                  ×
                                </button>
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interests Row */}
                    <div className="mt-4 sm:mt-6 md:mt-8">
                      <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Interests</label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {tripInterests.map((interest) => (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() => handleInterestToggle(interest.id)}
                            style={
                              customTripData.interests.includes(interest.id)
                                ? { color: '#0b3d4a', background: '#d4f06a' }
                                : { color: '#d4f06a', background: '#0b3d4a' }
                            }
                            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all duration-200 min-h-[40px] touch-manipulation hover:brightness-110"
                          >
                            {interest.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Plan Trip Button */}
                    <div className="flex justify-center mt-4 sm:mt-6 md:mt-8">
                      <button 
                        type="button"
                        onClick={handleCustomTripBooking}
                        className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] active:brightness-95 text-white px-6 sm:px-10 md:px-14 py-3 sm:py-4 md:py-5 rounded-full font-bold text-base sm:text-lg md:text-xl transition-all flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto md:min-w-[280px] min-h-[44px] md:min-h-[56px] touch-manipulation"
                      >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      <span>Plan My Trip</span>
                      </button>
                    </div>
                  </>
                )}

               {searchTab === 'rent-car' && (
                 <>
                   <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1024px]:grid-cols-4 gap-3 min-[820px]:gap-5 min-[1024px]:gap-6 lg:gap-8 relative min-w-0 overflow-visible items-start">
                     <div className={`relative min-w-0 w-full self-start ${showPickupDropdown ? 'z-[100]' : 'z-10'}`} ref={pickupDropdownRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Pickup City</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showPickupDropdown) {
                               setShowPickupDropdown(false)
                             } else {
                               closeSearchOverlays()
                               setShowPickupDropdown(true)
                             }
                           }}
                           aria-expanded={showPickupDropdown}
                           aria-haspopup="listbox"
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-11 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation flex items-center"
                         >
                           <span className="block truncate">
                             {(() => {
                               if (!rentCarData.pickupCityId) return 'Select pickup city'
                               const city = rentCityOptions.find((c: { id: string }) => c.id === rentCarData.pickupCityId)
                               if (!city) return 'Select pickup city'
                               return `${city.name}${city.region ? ` — ${city.region}` : ''}`
                             })()}
                           </span>
                         </button>
                         <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400 transition-transform ${showPickupDropdown ? 'rotate-180' : ''}`} />
                         {showPickupDropdown && (
                           <ul
                             role="listbox"
                             className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] sm:max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white dark:bg-gray-800 shadow-2xl py-1 w-full min-w-0"
                           >
                             <li>
                               <button
                                 type="button"
                                 role="option"
                                 aria-selected={!rentCarData.pickupCityId}
                                 onClick={() => {
                                   setRentCarData({ ...rentCarData, pickupCityId: '' })
                                   setShowPickupDropdown(false)
                                 }}
                                 className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                               >
                                 Select pickup city
                               </button>
                             </li>
                             {rentCityOptions.map((city: { id: string; name: string; region?: string }) => {
                               const label = `${city.name}${city.region ? ` — ${city.region}` : ''}`
                               const isSelected = rentCarData.pickupCityId === city.id
                               return (
                                 <li key={city.id}>
                                   <button
                                     type="button"
                                     role="option"
                                     aria-selected={isSelected}
                                     title={label}
                                     onClick={() => {
                                       setRentCarData({ ...rentCarData, pickupCityId: city.id })
                                       setShowPickupDropdown(false)
                                     }}
                                     className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-colors break-words ${
                                       isSelected
                                         ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                         : 'text-gray-900 dark:text-white hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                     }`}
                                   >
                                     {label}
                                   </button>
                                 </li>
                               )
                             })}
                           </ul>
                         )}
                       </div>
                     </div>

                     <div className={`relative min-w-0 w-full self-start ${showDropoffDropdown ? 'z-[100]' : 'z-10'}`} ref={dropoffDropdownRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Drop-off City</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showDropoffDropdown) {
                               setShowDropoffDropdown(false)
                             } else {
                               closeSearchOverlays()
                               setShowDropoffDropdown(true)
                             }
                           }}
                           aria-expanded={showDropoffDropdown}
                           aria-haspopup="listbox"
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-10 sm:pr-11 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation flex items-center"
                         >
                           <span className="block truncate">
                             {(() => {
                               if (!rentCarData.dropoffCityId) return 'Select drop-off city'
                               const city = rentCityOptions.find((c: { id: string }) => c.id === rentCarData.dropoffCityId)
                               if (!city) return 'Select drop-off city'
                               return `${city.name}${city.region ? ` — ${city.region}` : ''}`
                             })()}
                           </span>
                         </button>
                         <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400 transition-transform ${showDropoffDropdown ? 'rotate-180' : ''}`} />
                         {showDropoffDropdown && (
                           <ul
                             role="listbox"
                             className="absolute left-0 right-0 top-full mt-1 z-[110] max-h-[min(280px,50vh)] sm:max-h-[min(320px,45vh)] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white dark:bg-gray-800 shadow-2xl py-1 w-full min-w-0"
                           >
                             <li>
                               <button
                                 type="button"
                                 role="option"
                                 aria-selected={!rentCarData.dropoffCityId}
                                 onClick={() => {
                                   setRentCarData({ ...rentCarData, dropoffCityId: '' })
                                   setShowDropoffDropdown(false)
                                 }}
                                 className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 dark:text-gray-200 hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)] transition-colors"
                               >
                                 Select drop-off city
                               </button>
                             </li>
                             {rentCityOptions.map((city: { id: string; name: string; region?: string }) => {
                               const label = `${city.name}${city.region ? ` — ${city.region}` : ''}`
                               const isSelected = rentCarData.dropoffCityId === city.id
                               return (
                                 <li key={city.id}>
                                   <button
                                     type="button"
                                     role="option"
                                     aria-selected={isSelected}
                                     title={label}
                                     onClick={() => {
                                       setRentCarData({ ...rentCarData, dropoffCityId: city.id })
                                       setShowDropoffDropdown(false)
                                     }}
                                     className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base transition-colors break-words ${
                                       isSelected
                                         ? 'bg-[var(--lagoon-deep)] text-[var(--sun)]'
                                         : 'text-gray-900 dark:text-white hover:bg-[var(--sun)]/40 hover:text-[var(--lagoon-deep)]'
                                     }`}
                                   >
                                     {label}
                                   </button>
                                 </li>
                               )
                             })}
                           </ul>
                         )}
                       </div>
                     </div>

                     <div className={`relative min-w-0 w-full self-start overflow-visible ${showRentPickupDatePicker ? 'z-[120]' : 'z-20'}`} ref={rentPickupDatePickerRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Pickup Date</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showRentPickupDatePicker) {
                               setShowRentPickupDatePicker(false)
                             } else {
                               closeSearchOverlays()
                               setShowRentPickupDatePicker(true)
                             }
                           }}
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-8 sm:pr-10 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation truncate"
                           aria-expanded={showRentPickupDatePicker}
                         >
                           {rentCarData.pickupDate
                             ? formatDisplayDate(rentCarData.pickupDate)
                             : 'Select pickup date'}
                         </button>
                         <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />

                         {showRentPickupDatePicker && (
                           <div className="absolute top-full left-0 right-0 mt-1 text-black dark:text-white bg-white dark:bg-gray-800 border border-black/10 rounded-xl shadow-2xl z-[130] p-3 sm:p-4 w-full max-w-full min-w-0 sm:w-auto sm:min-w-[300px]">
                             <div className="flex items-center justify-between mb-4">
                               <button
                                 type="button"
                                 onClick={() => setCurrentRentPickupMonth(new Date(currentRentPickupMonth.getFullYear(), currentRentPickupMonth.getMonth() - 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 ←
                               </button>
                               <h3 className="font-semibold text-gray-900 dark:text-white">
                                 {currentRentPickupMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                               </h3>
                               <button
                                 type="button"
                                 onClick={() => setCurrentRentPickupMonth(new Date(currentRentPickupMonth.getFullYear(), currentRentPickupMonth.getMonth() + 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 →
                               </button>
                             </div>

                             <div className="grid grid-cols-7 gap-1 mb-2">
                               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                 <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
                                   {day}
                                 </div>
                               ))}
                             </div>

                             <div className="grid grid-cols-7 gap-1">
                               {Array.from({ length: getFirstDayOfMonth(currentRentPickupMonth.getFullYear(), currentRentPickupMonth.getMonth()) }).map((_, i) => (
                                 <div key={`empty-pickup-${i}`} className="p-2"></div>
                               ))}

                               {Array.from({ length: getDaysInMonth(currentRentPickupMonth.getFullYear(), currentRentPickupMonth.getMonth()) }).map((_, i) => {
                                 const day = i + 1
                                 const date = new Date(currentRentPickupMonth.getFullYear(), currentRentPickupMonth.getMonth(), day)
                                 const isToday = formatDate(date) === formatDate(new Date())
                                 const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                                 return (
                                   <button
                                     key={`pickup-${day}`}
                                     type="button"
                                     onClick={() => !isPast && handleRentPickupDateSelect(date)}
                                     disabled={isPast}
                                     className={`p-2 text-sm rounded transition-colors ${
                                       isPast
                                         ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                         : isRentPickupDateSelected(date)
                                         ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                         : isToday
                                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                         : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                     }`}
                                   >
                                     {day}
                                   </button>
                                 )
                               })}
                             </div>

                             <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
                               {!rentCarData.pickupDate
                                 ? 'Click to select pickup date'
                                 : 'Pickup date selected'}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>

                     <div className={`relative min-w-0 w-full self-start overflow-visible ${showRentReturnDatePicker ? 'z-[120]' : 'z-20'}`} ref={rentReturnDatePickerRef}>
                       <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-[var(--lagoon-deep)] dark:text-white tracking-wide uppercase">Return Date</label>
                       <div className="relative min-w-0 w-full overflow-visible">
                         <button
                           type="button"
                           onClick={() => {
                             if (showRentReturnDatePicker) {
                               setShowRentReturnDatePicker(false)
                             } else {
                               closeSearchOverlays()
                               setShowRentReturnDatePicker(true)
                             }
                           }}
                           className="w-full min-w-0 max-w-full pl-3 sm:pl-4 md:pl-5 pr-8 sm:pr-10 py-3 sm:py-4 md:py-5 text-base md:text-lg border border-white/40 rounded-xl focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent cursor-pointer hover:border-[var(--lagoon)] transition-colors text-left bg-white/70 dark:bg-gray-800/80 text-gray-900 dark:text-white min-h-[44px] md:min-h-[56px] touch-manipulation truncate"
                           aria-expanded={showRentReturnDatePicker}
                         >
                           {rentCarData.returnDate
                             ? formatDisplayDate(rentCarData.returnDate)
                             : 'Select return date'}
                         </button>
                         <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />

                         {showRentReturnDatePicker && (
                           <div className="absolute top-full left-0 right-0 mt-1 text-black dark:text-white bg-white dark:bg-gray-800 border border-black/10 rounded-xl shadow-2xl z-[130] p-3 sm:p-4 w-full max-w-full min-w-0 sm:w-auto sm:min-w-[300px]">
                             <div className="flex items-center justify-between mb-4">
                               <button
                                 type="button"
                                 onClick={() => setCurrentRentReturnMonth(new Date(currentRentReturnMonth.getFullYear(), currentRentReturnMonth.getMonth() - 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 ←
                               </button>
                               <h3 className="font-semibold text-gray-900 dark:text-white">
                                 {currentRentReturnMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                               </h3>
                               <button
                                 type="button"
                                 onClick={() => setCurrentRentReturnMonth(new Date(currentRentReturnMonth.getFullYear(), currentRentReturnMonth.getMonth() + 1))}
                                 className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                               >
                                 →
                               </button>
                             </div>

                             <div className="grid grid-cols-7 gap-1 mb-2">
                               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                 <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
                                   {day}
                                 </div>
                               ))}
                             </div>

                             <div className="grid grid-cols-7 gap-1">
                               {Array.from({ length: getFirstDayOfMonth(currentRentReturnMonth.getFullYear(), currentRentReturnMonth.getMonth()) }).map((_, i) => (
                                 <div key={`empty-return-${i}`} className="p-2"></div>
                               ))}

                               {Array.from({ length: getDaysInMonth(currentRentReturnMonth.getFullYear(), currentRentReturnMonth.getMonth()) }).map((_, i) => {
                                 const day = i + 1
                                 const date = new Date(currentRentReturnMonth.getFullYear(), currentRentReturnMonth.getMonth(), day)
                                 const dateStr = formatDate(date)
                                 const isToday = dateStr === formatDate(new Date())
                                 const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                                 const beforePickup = !!rentCarData.pickupDate && dateStr < rentCarData.pickupDate
                                 const disabled = isPast || beforePickup

                                 return (
                                   <button
                                     key={`return-${day}`}
                                     type="button"
                                     onClick={() => !disabled && handleRentReturnDateSelect(date)}
                                     disabled={disabled}
                                     className={`p-2 text-sm rounded transition-colors ${
                                       disabled
                                         ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                         : isRentReturnDateSelected(date)
                                         ? 'bg-blue-600 dark:bg-blue-500 text-white'
                                         : isToday
                                         ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                         : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                                     }`}
                                   >
                                     {day}
                                   </button>
                                 )
                               })}
                             </div>

                             <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
                               {!rentCarData.returnDate
                                 ? 'Click to select return date'
                                 : 'Return date selected'}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>

                   <div className="flex justify-center mt-4 sm:mt-6 md:mt-8">
                     <button
                       type="button"
                       onClick={handleRentCarSearch}
                       className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] active:brightness-95 text-white px-6 sm:px-10 md:px-14 py-3 sm:py-4 md:py-5 rounded-full font-bold text-base sm:text-lg md:text-xl transition-all flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto md:min-w-[280px] min-h-[44px] md:min-h-[56px] touch-manipulation"
                     >
                       <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                       <span>Search Cars</span>
                     </button>
                   </div>
                 </>
               )}
             </div>
          </div>
        </div>
      </section>
      
      {/* Featured Tour Packages — editorial discovery rail */}
      {showFeatured && (
      <section className="lp-section-ink py-14 sm:py-20 bg-[var(--foam)]">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="lp-kicker mb-2">Bookable trips</p>
              <h2 className="lp-section-title text-3xl sm:text-4xl md:text-5xl">
                {String(featuredCms?.title || 'Featured tour packages')}
              </h2>
              {featuredCms?.subtitle ? (
                <p className="mt-2 text-[var(--ink-soft)]">{String(featuredCms.subtitle)}</p>
              ) : null}
            </div>
            <Link href="/tours" className="inline-flex items-center gap-2 font-semibold text-[var(--lagoon)] hover:text-[var(--lagoon-deep)] transition-colors">
              View all trips <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            {/* Slider Container */}
            <div 
              id="tour-slider"
              className="flex overflow-x-auto space-x-4 sm:space-x-5 pb-2 scrollbar-hide scroll-smooth px-0 snap-x snap-mandatory"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {loadingTours ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[340px] snap-start h-[420px] animate-pulse">
                      <div className="lp-photo-card h-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </>
              ) : !loadingTours && (!featuredTours || featuredTours.length === 0) ? (
                <div className="flex items-center justify-center w-full py-12">
                  <div className="text-center">
                    <p className="text-[var(--ink-soft)] text-lg">No featured tours available at the moment.</p>
                  </div>
                </div>
              ) : featuredTours && featuredTours.length > 0 ? featuredTours.map((tour, index) => (
                <div key={tour.id || `tour-${index}`} className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[340px] snap-start h-[420px] sm:h-[440px]">
                  <button
                    type="button"
                    onClick={() => handleViewTourDetails(tour.id)}
                    className="lp-photo-card group w-full h-full text-left cursor-pointer"
                  >
                    <SafeImage
                      src={tour.image || (tour.images?.[0] ?? '/placeholder-image.svg')}
                      alt={tour.name}
                      fill
                      className="object-cover"
                      loading={index < 3 ? "eager" : "lazy"}
                      priority={index < 3}
                      sizes="(max-width: 640px) 280px, 340px"
                    />
                    <div className="absolute top-4 left-4 z-20">
                      <span className="inline-block bg-[var(--sun)] text-[var(--lagoon-deep)] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                        {tour.style || 'Trip'}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                      <p className="text-white/80 text-xs font-semibold tracking-[0.14em] uppercase mb-2">{tour.duration}</p>
                      <h3 className="font-display text-xl sm:text-2xl text-white leading-tight mb-3 line-clamp-2">{tour.name}</h3>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-1 text-white/90 text-sm">
                          <Star className="w-4 h-4 text-[var(--sun)] fill-current" />
                          <span className="font-semibold">{getTourRating(tour) || '—'}</span>
                          <span className="opacity-70">({getTourReviews(tour)})</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--sun)]">
                          {parseFloat(String(tour.price || '').replace(/[^0-9.]/g, '')) > 0 ? formatPrice(tour.price) : 'Explore'}
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
            )) : (
              <div className="flex items-center justify-center w-full py-8">
                <div className="text-center">
                  <p className="text-[var(--ink-soft)] text-lg">No featured tours available</p>
                </div>
              </div>
            )}
            </div>

            {/* Pagination dots — all breakpoints */}
            {featuredTours && featuredTours.length > 1 && (
              <div
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-5 sm:mt-6"
                role="tablist"
                aria-label="Featured tour packages"
              >
                {featuredTours.map((tour, index) => (
                  <button
                    key={tour.id || `dot-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={featuredTourSlide === index}
                    aria-label={`Go to tour ${index + 1}: ${tour.name}`}
                    onClick={() => goToFeaturedSlide(index)}
                    className={`rounded-full transition-all duration-300 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                      featuredTourSlide === index
                        ? 'px-1'
                        : 'px-1 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span
                      className={`block rounded-full transition-all duration-300 ${
                        featuredTourSlide === index
                          ? 'w-6 sm:w-7 h-2.5 sm:h-3 bg-[var(--lagoon-deep)]'
                          : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-[var(--lagoon-deep)]/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Statistics Section – larger section with animated counters */}
      {showStats && (
      <section ref={statsSectionRef} className="py-16 sm:py-20 md:py-24 bg-[var(--lagoon-deep)] text-white">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 border border-white/15 mb-4 sm:mb-5">
                  <stat.icon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--sun)]" />
                </div>
                <div className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-2 sm:mb-3 tabular-nums">
                  {index === 3 ? '24/7' : (statsInView ? `${animatedValues[index]}${(stat as { suffix: string }).suffix}` : `0${(stat as { suffix: string }).suffix}`)}
                </div>
                <div className="text-sm sm:text-base md:text-lg text-white/75 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}


      {showBanner && (
      <section
        className='relative py-24 sm:py-32 md:py-40 bg-image-bg bg-cover bg-center bg-no-repeat overflow-hidden'
        style={
          bannerCms?.backgroundImage
            ? { backgroundImage: `url(${String(bannerCms.backgroundImage)})` }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[var(--lagoon-deep)]/45" aria-hidden />
        <div className="relative w-full max-w-[1920px] mx-auto lp-gutter">
          <h1 className='font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-semibold text-center text-white tracking-tight'>
            {String(bannerCms?.title || 'Sri Lanka')}
          </h1>
          <p className='text-base sm:text-lg md:text-xl lg:text-2xl text-center text-white/90 mt-3 sm:mt-5 font-medium tracking-wide'>
            {String(bannerCms?.subtitle || 'Mystic Isle of Echoes')}
          </p>
        </div>  
      </section>
      )}
      {/* Features Section */}
      {showFeatures && (
      <section className="lp-section-ink py-14 sm:py-20 bg-[var(--foam)]">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="max-w-3xl mb-10 sm:mb-14">
            <p className="lp-kicker mb-2">Why travel with us</p>
            <h2 className="lp-section-title text-3xl sm:text-4xl md:text-5xl mb-4">
              {String(featuresCms?.sectionTitle || 'Why choose ISLE & ECHO?')}
            </h2>
            <p className="text-base sm:text-lg text-[var(--ink-soft)]">
              {String(
                featuresCms?.sectionSubtitle ||
                  'Exceptional experiences with local expertise and care in every detail.'
              )}
            </p>
                </div>
                      
 

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {(
              (featuresCms?.items as Array<{ title?: string; description?: string }>)?.length
                ? (featuresCms!.items as Array<{ title?: string; description?: string }>).map((item, index) => ({
                    ...features[index % features.length],
                    title: item.title || features[index % features.length].title,
                    description: item.description || features[index % features.length].description,
                  }))
                : features
            ).map((feature, index) => (
              <div key={index} className="p-5 sm:p-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:-translate-y-1 transition-transform duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--lagoon)]/10 mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--lagoon-deep)] dark:text-[var(--lagoon)]" />
                  </div>
                <h3 className="font-display text-xl font-semibold text-[var(--ink)] mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
      
      {/* Destinations — photo-first explore tiles */}
      {showDestinations && (
      <section className="lp-section-ink py-14 sm:py-20 bg-white dark:bg-[var(--foam)]">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 sm:mb-12">
            <div className="max-w-2xl">
              <p className="lp-kicker mb-2">Where to go</p>
              <h2 className="lp-section-title text-3xl sm:text-4xl md:text-5xl mb-3">
                {String(destinationsCms?.title || "Discover Sri Lanka's destinations")}
              </h2>
              <p className="text-[var(--ink-soft)] text-base sm:text-lg leading-relaxed">
                {String(
                  destinationsCms?.subtitle ||
                    'Ancient temples, wildlife, beaches, and misty highlands — find your next adventure.'
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={destinationSearchQuery}
                  onChange={(e) => setDestinationSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-black/10 dark:border-white/15 rounded-full focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent text-base bg-[var(--foam)] text-[var(--ink)] min-h-[44px] touch-manipulation"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--ink-soft)]" />
              </div>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2.5 border border-black/10 dark:border-white/15 rounded-full focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent text-base bg-[var(--foam)] text-[var(--ink)] min-h-[44px] touch-manipulation"
              >
                <option value="all">All Regions</option>
                <option value="Cultural Triangle">Cultural Triangle</option>
                <option value="Hill Country">Hill Country</option>
                <option value="Southern Coast">Beach Destinations</option>
                <option value="Wildlife">Wildlife & Nature</option>
                <option value="Northern">Northern Region</option>
                <option value="Customize">Customize</option>
              </select>
            </div>
          </div>

          {/* Destinations Grid */}
          {loadingDestinations ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="lp-photo-card min-h-[320px] sm:min-h-[360px] animate-pulse bg-gray-200" />
              ))}
            </div>
          ) : !loadingDestinations && filteredDestinations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-[var(--ink-soft)] text-lg">No destinations found.</p>
              </div>
            </div>
          ) : filteredDestinations.length > 0 ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {displayedDestinations.map((destination) => {
                const badge = destination.region === 'Cultural Triangle' ? 'Heritage' : 
                             destination.region === 'Wildlife' ? 'Nature' :
                             destination.region.includes('Province') ? 'Cultural' : 'Explore'

                return (
                  <Link
                    key={destination.id}
                    href={`/destinations/${destination.id}`}
                    className="lp-photo-card group block min-h-[320px] sm:min-h-[380px]"
                  >
                      <SafeImage
                        src={destination.image || '/placeholder-image.svg'}
                        alt={destination.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-black/70 text-[var(--sun)] px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                          {badge}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                        <h3 className="font-display text-2xl sm:text-3xl text-white leading-tight mb-2">{destination.name}</h3>
                        <p className="text-white/80 text-sm line-clamp-2 mb-3">
                          {destination.description || 'Explore this destination.'}
                        </p>
                        <span className="inline-flex items-center gap-2 text-[var(--sun)] font-bold text-sm tracking-wide uppercase">
                          Explore <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                  </Link>
                )
              })}
            </div>
            {hasMoreDestinations && (
              <div className="flex justify-center mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={() => setDestinationsDisplayLimit((prev) => prev + 10)}
                  className="px-7 py-3 bg-[var(--lagoon-deep)] text-white font-semibold rounded-full hover:bg-[var(--lagoon)] active:opacity-90 transition-colors"
                >
                  More destinations
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--ink-soft)] text-lg mb-2">No destinations found</p>
            </div>
          )}
        </div>  
      </section>
      )}

      {showTestimonials && (
      <section className="lp-section-ink py-14 sm:py-20 bg-[var(--foam)]">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="max-w-2xl mb-8 sm:mb-12">
            <p className="lp-kicker mb-2">{String(testimonialsCms?.kicker || 'Guest stories')}</p>
            <h2 className="lp-section-title text-3xl sm:text-4xl md:text-5xl mb-3">
              {String(testimonialsCms?.title || 'What travelers say')}
            </h2>
            <p className="text-[var(--ink-soft)] text-base sm:text-lg leading-relaxed">
              {String(
                testimonialsCms?.subtitle ||
                  'Real experiences from guests who explored Sri Lanka with ISLE & ECHO.'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {((testimonialsCms?.items as Array<{ name?: string; location?: string; quote?: string; rating?: number }>)?.length
              ? (testimonialsCms!.items as Array<{ name?: string; location?: string; quote?: string; rating?: number }>)
              : DEFAULT_TESTIMONIALS
            ).map(
              (item, index) => {
                const rating = Math.max(0, Math.min(5, Number(item.rating || 5)))
                return (
                  <article
                    key={`${item.name || 'guest'}-${index}`}
                    className="lp-panel p-6 sm:p-8 h-full flex flex-col"
                  >
                    <Quote className="w-8 h-8 text-[var(--lagoon)] mb-4" />
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star < rating ? 'text-[var(--sun)] fill-current' : 'text-black/15'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[var(--ink)] text-base leading-relaxed flex-1">
                      “{item.quote || 'A wonderful journey with ISLE & ECHO.'}”
                    </p>
                    <div className="mt-6 pt-4 border-t border-black/5">
                      <p className="font-semibold text-[var(--lagoon-deep)]">{item.name || 'Guest'}</p>
                      {item.location ? (
                        <p className="text-sm text-[var(--ink-soft)]">{item.location}</p>
                      ) : null}
                    </div>
                  </article>
                )
              }
            )}
          </div>
        </div>
      </section>
      )}

      {/* Inspiration — blog */}
      {showBlog && (
      <section className="lp-section-ink py-14 sm:py-20 bg-white dark:bg-[var(--foam)]">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="lp-kicker mb-2">Inspiration</p>
              <h2 className="lp-section-title text-3xl sm:text-4xl md:text-5xl">
                {String(blogCms?.title || 'Your next trip starts here')}
              </h2>
              {blogCms?.subtitle ? (
                <p className="mt-2 text-[var(--ink-soft)]">{String(blogCms.subtitle)}</p>
              ) : null}
            </div>
            <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-[var(--lagoon)] hover:text-[var(--lagoon-deep)]">
              View all stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {blogPosts.length > 0 ? (
            <>
              <div className="relative pl-10 pr-10 sm:pl-14 sm:pr-14 md:pl-16 md:pr-16">
                <button
                  type="button"
                  aria-label="Previous blog posts"
                  onClick={() => setBlogCarouselIndex(i => Math.max(0, i - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-[1] w-9 h-9 sm:w-12 sm:h-12 rounded-full lp-glass shadow-lg flex items-center justify-center text-[var(--ink)] hover:bg-white border border-white/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next blog posts"
                  onClick={() => setBlogCarouselIndex(i => Math.min(Math.max(0, Math.ceil(blogPosts.length / 3) - 1), i + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-[1] w-9 h-9 sm:w-12 sm:h-12 rounded-full lp-glass shadow-lg flex items-center justify-center text-[var(--ink)] hover:bg-white border border-white/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="overflow-hidden px-1">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${blogCarouselIndex * 100}%)` }}
                  >
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 px-2"
                      >
                        <Link href={`/blog/${post.id}`} className="lp-photo-card group block h-[360px] sm:h-[400px]">
                            <SafeImage
                              src={post.image || '/placeholder-image.svg'}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                            {post.category && (
                              <span className="inline-block text-[var(--sun)] text-xs font-bold tracking-[0.14em] uppercase mb-2">
                                {post.category}
                              </span>
                            )}
                            <h3 className="font-display text-xl sm:text-2xl text-white leading-tight mb-2 line-clamp-2">{post.title}</h3>
                            <p className="text-white/75 text-sm line-clamp-2">
                              {post.description || post.excerpt || ''}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--ink-soft)] mb-4">Explore stories and travel tips on our blog.</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lagoon-deep)] text-white font-semibold rounded-full hover:bg-[var(--lagoon)] transition-colors"
              >
                View Blog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
      )}

      {/* CTA Section */}
      {showCta && (
      <section className="relative py-16 sm:py-24 overflow-hidden bg-[var(--lagoon)] text-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, var(--sun), transparent 45%), radial-gradient(circle at 80% 80%, #fff, transparent 40%)' }} />
        <div className="relative w-full max-w-[1920px] mx-auto lp-gutter text-center">
          <p className="lp-kicker text-[var(--sun)] mb-3">Ready when you are</p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 px-2 tracking-tight">
            {String(ctaCms?.title || 'Start your Sri Lankan adventure')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto px-2">
            {String(ctaCms?.subtitle || "Tell us how you travel — we'll craft the itinerary that feels like you.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-2">
            <Link
              href={String(ctaCms?.primaryButtonUrl || '/tours')}
              className="hover:brightness-110 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all min-h-[44px] touch-manipulation inline-flex items-center justify-center"
              style={{ background: '#d4f06a', color: '#0b3d4a' }}
            >
              {String(ctaCms?.primaryButtonText || 'Get started today')}
            </Link>
            <Link
              href={String(ctaCms?.secondaryButtonUrl || '/contact')}
              className="hover:brightness-110 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-colors min-h-[44px] touch-manipulation inline-flex items-center justify-center"
              style={{ background: '#0b3d4a', color: '#d4f06a' }}
            >
              {String(ctaCms?.secondaryButtonText || 'Contact us')}
            </Link>
          </div>
          </div>
      </section>
      )}

      {/* Structured Data */}
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />

      <style jsx>{`
        .youtube-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }
        
        .youtube-container iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          min-height: 100%;
          transform: translate(-50%, -50%);
          border: none;
          outline: none;
          pointer-events: none;
          object-fit: cover;
        }
        
        .youtube-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 0;
          pointer-events: none;
        }
        
        /* Hide YouTube controls with CSS */
        .youtube-container iframe::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 10;
          pointer-events: none;
        }
        
        /* Additional CSS to hide YouTube UI elements */
        .youtube-container {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        /* Force fullscreen and hide all YouTube elements */
        .youtube-container iframe {
          -webkit-transform: translate(-50%, -50%) scale(1.1);
          transform: translate(-50%, -50%) scale(1.1);
          filter: brightness(1.1) contrast(1.1);
        }
        
        /* Hide any remaining YouTube UI */
        .youtube-overlay::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 999;
          pointer-events: none;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in-up.delay-100 {
          animation-delay: 0.1s;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
