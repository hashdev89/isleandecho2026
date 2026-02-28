'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Star,
  Heart,
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
  ChevronRight
} from 'lucide-react'
import Header from '../components/Header'
import StructuredData, { organizationSchema, websiteSchema } from '../components/StructuredData'

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
}

export default function HomePage() {
  const [searchTab, setSearchTab] = useState('tours')
  const [searchData, setSearchData] = useState({
    tourPackage: '',
    startDate: '',
    endDate: '',
    guests: 1
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
  const [selectedTourStartDate, setSelectedTourStartDate] = useState<Date | null>(null)
  const [currentToursMonth, setCurrentToursMonth] = useState(new Date())
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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [siteContent, setSiteContent] = useState<Record<string, unknown> | null>(null)
  const [blogPosts, setBlogPosts] = useState<Array<{ id: number; title: string; description?: string; excerpt?: string; image?: string; date?: string; readTime?: string; category?: string }>>([])
  const [blogCarouselIndex, setBlogCarouselIndex] = useState(0)
  const [heroReady, setHeroReady] = useState(false)
  const [failedHeroImageIndices, setFailedHeroImageIndices] = useState<Set<number>>(new Set())
  
  // Hero carousel images - only from dashboard (Admin → Site content → Hero). No default image.
  const heroImages = useMemo(() => {
    const fromCms = (siteContent?.hero as Record<string, unknown>)?.heroImages
    if (Array.isArray(fromCms) && fromCms.length > 0) {
      const valid = fromCms.filter((u): u is string => typeof u === 'string' && u.length > 0)
      if (valid.length > 0) return valid
    }
    return []
  }, [siteContent])
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
    setIsTransitioning(true)
    setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }
  
  const prevSlide = () => {
    if (!hasHeroSlides || isTransitioning) return
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
        
        // Fetch all tours in the background (for search functionality) - lower priority
        // This doesn't block the initial render
        if (isMounted) {
          fetchWithTimeout('/api/tours', 25000)
            .then(async (res) => {
              if (isMounted && res.ok) {
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                  const json = await res.json()
                  if (json.success && json.data) {
                    const tours = json.data || []
                    // Remove duplicates based on id
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
    fetch('/api/site-content', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then((json: { success?: boolean; data?: Record<string, unknown> } | null) => {
        if (isMounted && json?.success && json.data) setSiteContent(json.data)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    let isMounted = true
    fetch('/api/blog', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then((posts: Array<{ id: number; title: string; description?: string; excerpt?: string; image?: string; date?: string; readTime?: string; category?: string; status?: string }>) => {
        if (!isMounted || !Array.isArray(posts)) return
        const published = posts.filter(p => p.status === 'Published')
        setBlogPosts(published)
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

  const availableDestinations = [
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
    { id: 'sinharaja', name: 'Sinharaja', region: 'Southern Province' }
  ]

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
    if (searchData.tourPackage) {
      // Navigate to the specific tour package page
      window.location.href = `/tours/${searchData.tourPackage}?startDate=${searchData.startDate}&endDate=${searchData.endDate}&guests=${searchData.guests}`
    } else {
      // Navigate to general tours page
      window.location.href = '/tours'
    }
  }

  const handleViewTourDetails = (tourId: string) => {
    window.location.href = `/tours/${tourId}`
  }

  const handleCustomTripBooking = () => {
    // Create custom trip booking
    const tripData = {
      destinations: customTripData.destinations,
      dateRange: customTripData.dateRange,
      guests: customTripData.guests,
      interests: customTripData.interests
    }
    
    // Store in localStorage for the booking page
    localStorage.setItem('customTripData', JSON.stringify(tripData))
    
    // Navigate to custom booking page
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

    const handleScroll = () => {
      const cardWidth = window.innerWidth < 640 ? 288 : 320; // Mobile vs desktop card width (including gap)
      const scrollPosition = container.scrollLeft;
      const newSlide = Math.round(scrollPosition / cardWidth);
      setCurrentSlide(Math.max(0, Math.min(newSlide, featuredTours.length - 1)));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [featuredTours.length]);

  // Function to navigate to specific slide
  const goToSlide = (slideIndex: number) => {
    const container = document.getElementById('tour-slider');
    if (container) {
      const cardWidth = window.innerWidth < 640 ? 288 : 320; // Mobile vs desktop card width (including gap)
      container.scrollLeft = slideIndex * cardWidth;
      setCurrentSlide(slideIndex);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Full-screen loader until hero is ready - prevents "image not found" flash */}
      {!heroReady && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 transition-opacity duration-300"
          aria-hidden="true"
        >
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="mt-4 text-white/90 text-sm font-medium">Loading...</p>
        </div>
      )}

      <Header />

      {/* Hero Section - Inspired by Swimlane's hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-visible sm:overflow-hidden min-h-auto sm:min-h-screen w-full flex items-start sm:items-center pt-20 pb-11 sm:pt-0 sm:pb-0">
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
                    className={`absolute inset-0 transition-opacity ease-in-out duration-300 will-change-opacity ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    style={{ transition: 'opacity 0.4s ease-out' }}
                  >
                    <Image
                      src={src}
                      alt={`Hero ${index + 1}`}
                      fill
                      priority={index <= 1}
                      className="object-cover"
                      quality={80}
                      sizes="100vw"
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      style={{ objectFit: 'cover' }}
                      onError={() => setFailedHeroImageIndices((prev) => new Set(prev).add(index))}
                    />
                  </div>
                )
              })}
              <div className="absolute inset-0 bg-black/50 z-20 pointer-events-none" aria-hidden />
            </div>
          </div>
          
          {/* YouTube Video Background - shown only on desktop when video is playing and not using fallback */}
          <div className={`absolute inset-0 z-20 transition-opacity duration-500 hidden sm:block ${isVideoPlaying && !useFallbackImage ? 'opacity-100' : 'opacity-0'}`}>
            <div className="youtube-container">
              <iframe
                id="hero-video"
                src="https://www.youtube.com/embed/y5bHGWAE50c?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&start=0&cc_load_policy=0&playsinline=1&enablejsapi=1&origin=*&widget_referrer=*&widgetid=1&autohide=1&wmode=transparent"
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

        {/* Carousel Navigation - z-index below navbar (navbar is z-[100]) so arrows don't overlap header */}
        {hasHeroSlides && (
        <div className="absolute inset-0 z-10 hidden sm:flex items-center justify-between px-4 sm:px-6 lg:px-8 pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevSlide()
            }}
            className="bg-white/10 hover:bg-blue-600 active:bg-blue-800 backdrop-blur-sm border border-white/30 hover:border-blue-600 text-white rounded-full p-3 sm:p-4 transition-all duration-300 pointer-events-auto flex items-center justify-center shadow-lg hover:shadow-xl"
            aria-label="Previous slide"
            type="button"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white pointer-events-none" />
          </button>
          
          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextSlide()
            }}
            className="bg-white/10 hover:bg-blue-600 active:bg-blue-800 backdrop-blur-sm border border-white/30 hover:border-blue-600 text-white rounded-full p-3 sm:p-4 transition-all duration-300 pointer-events-auto flex items-center justify-center shadow-lg hover:shadow-xl"
            aria-label="Next slide"
            type="button"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white pointer-events-none" />
          </button>
        </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:py-12 md:py-16 lg:py-20 xl:py-32 z-10 w-full">
          <div className="text-center max-w-4xl mx-auto w-full">
            {/* Badge */}
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 mb-4 sm:mb-4 md:mb-6">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-blue-100" />
              <span className="text-blue-100 font-medium text-xs sm:text-sm">Top Rated Travel Agency</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-4 md:mb-6 leading-tight px-2">
              Discover the Magic of{' '}<br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 animated-gradient-text">
                Sri Lanka
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              Experience breathtaking landscapes, rich culture, and unforgettable adventures with our expertly crafted tour packages.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 md:mb-12 px-2">
              <button 
                onClick={() => window.location.href = '/tours'}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors flex items-center justify-center min-h-[44px] touch-manipulation"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Explore Tours
              </button>
              <button 
                onClick={handleVideoPlay}
                disabled={videoError}
                className="hidden sm:flex bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
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
                    Play
                  </>
                )}
              </button>
          </div>
          
          {/* Search Section */}
          <div className="w-full max-w-7xl mx-auto animate-fade-in-up delay-100 pt-7 sm:pt-0 pb-8 sm:pb-8 md:pb-12 lg:pb-20 px-2 sm:px-4">
              {/* Search Tabs */}
              <div className="flex flex-wrap gap-2 sm:gap-1 mb-3 sm:mb-6 justify-center">
                {[
                { id: 'tours', label: 'Tours' },
                { id: 'plan-trip', label: 'Plan Your Trip' },
                { id: 'rent-car', label: 'Rent a Car' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSearchTab(tab.id)}
                  style={searchTab === tab.id ? { color: '#fff', borderBottom: '2px solid #fff' } : { color: 'rgba(255,255,255,0.7)' }}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-all duration-200 min-h-[44px] touch-manipulation ${searchTab === tab.id ? 'border-b-2' : 'hover:text-white'}`}
                  >
                  {tab.label}
                  </button>
                ))}
              </div>
            
                             {/* Search Form */}
             <div className="rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6 md:p-8 backdrop-blur-lg border bg-white/60 dark:bg-gray-800 relative z-10">
               {searchTab === 'tours' && (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 relative z-10">
                     {/* Tour Package */}
                     <div className="relative">
                       <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Tour Package</label>
                       <div className="relative">
                         <select
                           value={searchData.tourPackage}
                           onChange={(e) => setSearchData({...searchData, tourPackage: e.target.value})}
                           className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-4 text-base sm:text-base border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent appearance-none cursor-pointer hover:border-[#187BFF] transition-colors bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                         >
                           <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Select Your Package</option>
                          {allTours.map((tourPackage: Tour, index: number) => (
                            <option key={`${tourPackage.id}-${index}`} value={tourPackage.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                              {tourPackage.name}
                            </option>
                          ))}
                         </select>
                         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400" />
                       </div>
                     </div>
                     
                     {/* Start Date */}
                     <div className="relative">
                       <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Start Date</label>
                       <div className="relative">
                         <button
                           type="button"
                           onClick={() => setShowToursDatePicker(!showToursDatePicker)}
                           className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 text-base sm:text-base border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent cursor-pointer hover:border-[#187BFF] active:border-[#187BFF] transition-colors text-left bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
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
                       </div>
                       
                       {/* Date Picker Popup */}
                       {showToursDatePicker && (
                         <div className="absolute top-full left-0 mt-1 text-black dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3 sm:p-4 min-w-[280px] max-w-[90vw] sm:max-w-none">
                           {/* Calendar Header */}
                           <div className="flex items-center justify-between mb-4">
                             <button
                               onClick={() => setCurrentToursMonth(new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth() - 1))}
                               className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                             >
                               ←
                             </button>
                             <h3 className="font-semibold text-gray-900 dark:text-white">
                               {currentToursMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                             </h3>
                             <button
                               onClick={() => setCurrentToursMonth(new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth() + 1))}
                               className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                             >
                               →
                             </button>
                           </div>
                           
                           {/* Calendar Grid */}
                           <div className="grid grid-cols-7 gap-1 mb-2">
                             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                               <div key={day} className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 p-1">
                                 {day}
                               </div>
                             ))}
                           </div>
                           
                           <div className="grid grid-cols-7 gap-1">
                             {/* Empty cells for days before first day of month */}
                             {Array.from({ length: getFirstDayOfMonth(currentToursMonth.getFullYear(), currentToursMonth.getMonth()) }).map((_, i) => (
                               <div key={`empty-${i}`} className="p-2"></div>
                             ))}
                             
                             {/* Days of the month */}
                             {Array.from({ length: getDaysInMonth(currentToursMonth.getFullYear(), currentToursMonth.getMonth()) }).map((_, i) => {
                               const day = i + 1
                               const date = new Date(currentToursMonth.getFullYear(), currentToursMonth.getMonth(), day)
                               const isToday = formatDate(date) === formatDate(new Date())
                               const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                               
                               return (
                                 <button
                                   key={day}
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
                           
                           {/* Instructions */}
                           <div className="mt-3 text-xs text-gray-700 dark:text-gray-300 text-center">
                             {!selectedTourStartDate 
                               ? 'Click to select start date'
                               : 'Date selected'
                             }
                           </div>
                         </div>
                       )}
                     </div>
                     
                     {/* Number of Guests */}
                     <div className="relative">
                     <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Number of Guests</label>
                       <div className="relative">
                         <select
                           value={searchData.guests}
                           onChange={(e) => setSearchData({...searchData, guests: parseInt(e.target.value)})}
                           className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-4 text-base sm:text-base border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent appearance-none cursor-pointer hover:border-[#187BFF] transition-colors text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800 min-h-[44px] touch-manipulation"
                         >
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                             <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                           ))}
                       </select>
                          <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none text-blue-600" />
                       </div>
                     </div>
                   </div>
                   
                   {/* Tour Package Summary */}
                   {searchData.tourPackage && (
                     <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                       {(() => {
                         const selectedTour = allTours.find((tour: Tour) => tour.id === searchData.tourPackage);
                         if (!selectedTour) return null;
                         
                         return (
                           <div className="space-y-4">
                             {/* Tour Info */}
                             <div className="flex items-center justify-between">
                               <div className="text-left">
                                 <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">{selectedTour.name}</h3>
                                 <p className="text-blue-600 dark:text-blue-400 font-medium pb-2">{selectedTour.duration}</p>
                               </div>
                               <div className="text-right">
                                 <div className="flex items-center space-x-1">
                                   <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                   <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{selectedTour.rating}</span>
                                 </div>
                                 <p className="text-xs text-blue-600 dark:text-blue-400">({selectedTour.reviews} reviews)</p>
                               </div>
                             </div>
                             
                             {/* Location Summary */}
                             <div>
                               <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                                 <span className="mr-2">🗺️</span>
                                 Tour Locations
                               </h4>
                               <div className="flex flex-wrap gap-2">
                                 {(selectedTour.destinations || []).map((destination: string, idx: number) => (
                                   <span key={idx} className="bg-white dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
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
                   <div className="flex justify-center mt-4 sm:mt-6">
                     <button 
                       onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto min-h-[44px] touch-manipulation"
                     >
                     <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                     <span>Search</span>
                     </button>
                   </div>
                 </>
               )}

                               {searchTab === 'plan-trip' && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 relative z-10">
                      {/* Destinations Selection */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Destinations</label>
                        <div className="relative">
                          <select
                            onChange={(e) => {
                              if (e.target.value && !customTripData.destinations.includes(e.target.value)) {
                                handleDestinationToggle(e.target.value)
                              }
                            }}
                            className="w-full pl-3 pr-8 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent appearance-none cursor-pointer hover:border-[#187BFF] transition-colors text-base text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800 min-h-[44px] touch-manipulation"
                            value=""
                          >
                            <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Select destinations</option>
                            {availableDestinations.map((destination) => (
                              <option key={destination.id} value={destination.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                {destination.name} - {destination.region}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600 dark:text-gray-400" />
                        </div>
                        
                        {/* Selected Destinations Display */}
                        {customTripData.destinations.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {customTripData.destinations.map((destId) => {
                                const destination = availableDestinations.find(d => d.id === destId)
                                return destination ? (
                                  <span
                                    key={destId}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {destination.name}
                                    <button
                                      onClick={() => handleDestinationToggle(destId)}
                                      className="text-blue-600 hover:text-blue-800 active:text-blue-900 min-w-[24px] min-h-[24px] flex items-center justify-center touch-manipulation"
                                      aria-label="Remove destination"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Trip Details */}
                      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 z-20">
                        {/* Date Range */}
                        <div className="relative">
                          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Date Range</label>
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent cursor-pointer hover:border-[#187BFF] active:border-[#187BFF] transition-colors text-base text-left bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                          >
                            {(() => {
                              console.log('Displaying date range:', customTripData.dateRange);
                              return customTripData.dateRange || 'Select date range';
                            })()}
                          </button>
                          
                          {/* Date Picker Popup */}
                          {showDatePicker && (
                            <div className="absolute top-full left-0 -mt-1 text-black bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 sm:p-4 min-w-[280px] max-w-[90vw] sm:max-w-none">
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-4">
                                <button
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  ←
                                </button>
                                <h3 className="font-semibold">
                                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button
                                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  →
                                </button>
                              </div>
                              
                              {/* Calendar Grid */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                  <div key={day} className="text-center text-xs font-medium text-gray-700 p-1">
                                    {day}
                                  </div>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for days before first day of month */}
                                {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                                  <div key={`empty-${i}`} className="p-2"></div>
                                ))}
                                
                                {/* Days of the month */}
                                {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                                  const day = i + 1
                                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                                  const isToday = formatDate(date) === formatDate(new Date())
                                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
                                  
                                  return (
                                    <button
                                      key={day}
                                      onClick={() => !isPast && handleDateSelect(date)}
                                      disabled={isPast}
                                      className={`p-2 text-sm rounded transition-colors ${
                                        isPast
                                          ? 'text-gray-500 cursor-not-allowed'
                                          : isDateSelected(date)
                                          ? 'bg-blue-600 text-white'
                                          : isDateInRange(date)
                                          ? 'bg-blue-100 text-blue-800'
                                          : isToday
                                          ? 'bg-gray-100 text-gray-900'
                                          : 'hover:bg-gray-100 text-gray-900'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  )
                                })}
                              </div>
                              
                              {/* Instructions */}
                              <div className="mt-3 text-xs text-gray-700 text-center">
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
                        
                        {/* Number of Guests */}
                        <div className="relative">
                          <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-blue-950 dark:text-white">Guests</label>
                          <div className="relative">
                            <select
                              value={customTripData.guests}
                              onChange={(e) => setCustomTripData({...customTripData, guests: parseInt(e.target.value)})}
                              className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-3 sm:py-4 text-base sm:text-base border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent appearance-none cursor-pointer hover:border-[#187BFF] transition-colors bg-white/60 dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                          </select>
                            <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interests Row */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2 text-blue-950 dark:text-white">Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {tripInterests.map((interest) => (
                          <button
                            key={interest.id}
                            onClick={() => handleInterestToggle(interest.id)}
                            className={`px-4 py-2 rounded-full border text-sm transition-colors min-h-[36px] touch-manipulation ${
                              customTripData.interests.includes(interest.id)
                                ? 'bg-blue-100 border-blue-300 text-blue-800 active:bg-blue-200'
                                : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                            }`}
                          >
                            {interest.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Plan Trip Button */}
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={handleCustomTripBooking}
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold text-base sm:text-lg transition-all flex items-center justify-center space-x-2 shadow-lg w-full sm:w-auto min-h-[44px] touch-manipulation"
                      >
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Plan My Trip</span>
                      </button>
                    </div>
                  </>
                )}

               {searchTab === 'rent-car' && (
                 <div className="text-center py-8">
                   <p className="text-gray-800 dark:text-gray-200 mb-4 text-sm sm:text-base">Car rental service coming soon!</p>
                   <button className="bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-6 py-3 rounded-lg font-medium cursor-not-allowed min-h-[44px] touch-manipulation w-full sm:w-auto">
                     Coming Soon
                   </button>
                 </div>
               )}
             </div>
          </div>
          </div>
        </div>
      </section>
      
      {/* Featured Tour Packages */}
      <section className="py-8 sm:py-12 bg-white dark:bg-gray-900">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="pr-5 text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">Featured Tour Packages</h2>
          <div className="relative pl-12 pr-12 sm:pl-14 sm:pr-14">
            {/* Slider Container - content inset so arrows sit outside */}
            <div 
              id="tour-slider"
              className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-4 scrollbar-hide scroll-smooth px-2 sm:px-0 snap-x snap-mandatory"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
              {loadingTours ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 w-[280px] sm:w-72 md:w-80 snap-start h-[440px] sm:h-[460px] md:h-[480px] animate-pulse">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                        <div className="h-36 sm:h-44 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-full" />
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-2/3" />
                          <div className="flex gap-2 mb-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
                          </div>
                          <div className="mt-auto h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : !loadingTours && (!featuredTours || featuredTours.length === 0) ? (
                <div className="flex items-center justify-center w-full py-12">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No featured tours available at the moment.</p>
                  </div>
                </div>
              ) : featuredTours && featuredTours.length > 0 ? featuredTours.map((tour, index) => (
                <div key={tour.id || `tour-${index}`} className="flex-shrink-0 w-[280px] sm:w-72 md:w-80 snap-start h-[420px] sm:h-[440px] md:h-[460px]">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full">
                    <div className="relative shrink-0">
                      <Image
                        src={tour.image || (tour.images?.[0] ?? '/next.svg')}
                        alt={tour.name}
                        width={320}
                        height={192}
                        className="w-full h-40 sm:h-48 object-cover"
                        loading={index < 3 ? "eager" : "lazy"}
                        priority={index < 3}
                        sizes="(max-width: 640px) 280px, (max-width: 768px) 288px, 320px"
                      />
                      <div style={{ background: '#A0FF07' }} className="absolute top-2 sm:top-3 left-2 sm:left-3 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
                      {tour.style}
                      </div>
                      <button className="absolute top-2 sm:top-3 right-2 sm:right-3 w-9 h-9 sm:w-10 sm:h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:bg-white/80 dark:active:bg-gray-700/80 transition-colors touch-manipulation min-w-[36px] min-h-[36px]">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                    <div className="p-4 sm:p-5 pb-5 sm:pb-6 flex flex-col flex-1 min-h-0">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 pb-2 text-gray-900 dark:text-white line-clamp-2 min-h-[3rem] leading-snug">{tour.name}</h3>
                      <p className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm mb-3 shrink-0">{tour.duration}</p>
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{tour.rating} Excellent</span>
                          <span className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm">({tour.reviews})</span>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0" aria-hidden />
                      <div className="mb-2 overflow-visible shrink-0">
                        <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-300 mb-2">Destinations:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(tour.destinations || []).slice(0, 2).map((dest: string, idx: number) => (
                            <span key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                              {dest}
                            </span>
                          ))}
                          {(tour.destinations || []).length > 2 && (
                            <span className="text-gray-700 dark:text-gray-400 text-xs">+{(tour.destinations || []).length - 2} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-center shrink-0">
                        <button 
                          onClick={() => handleViewTourDetails(tour.id)}
                          style={{ background: '#CAFA7C' }}
                          className="text-gray-900 px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base font-medium hover:opacity-90 active:opacity-80 transition-colors w-full min-h-[44px] touch-manipulation"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            )) : (
              <div className="flex items-center justify-center w-full py-8">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No featured tours available</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Please check back later</p>
                </div>
              </div>
            )}
            </div>

            {/* Left/Right arrows - outside slider, in padded area */}
            {featuredTours && featuredTours.length > 0 && (
              <>
                <button
                  type="button"
                  aria-label="Previous tour"
                  onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-[1] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next tour"
                  onClick={() => goToSlide(Math.min(featuredTours.length - 1, currentSlide + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-[1] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Statistics Section – larger section with animated counters */}
      <section ref={statsSectionRef} className="py-16 sm:py-20 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-blue-600 dark:bg-blue-500 rounded-full mb-4 sm:mb-6">
                  <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 tabular-nums">
                  {index === 3 ? '24/7' : (statsInView ? `${animatedValues[index]}${(stat as { suffix: string }).suffix}` : `0${(stat as { suffix: string }).suffix}`)}
                </div>
                <div className="text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section
        className='py-12 sm:py-16 md:py-20 bg-image-bg bg-cover bg-center bg-no-repeat'
        style={((siteContent?.sriLankaBanner as Record<string, unknown>)?.backgroundImage as string) ? { backgroundImage: `url(${(siteContent?.sriLankaBanner as Record<string, unknown>).backgroundImage})` } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center text-white text-shadow-sri-lanka'>
            {((siteContent?.sriLankaBanner as Record<string, unknown>)?.title as string) || 'Sri Lanka'}
          </h1>
          <p className='text-base sm:text-lg md:text-xl lg:text-2xl text-center text-black text-shadow-subtitle mt-2 sm:mt-4'>{((siteContent?.sriLankaBanner as Record<string, unknown>)?.subtitle as string) || 'Mystic Isle of Echoes'}</p>
        </div>  
      </section>
      {/* Features Section - Inspired by Swimlane's features */}
      <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-2">
              Why Choose ISLE & ECHO?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-300 max-w-3xl mx-auto px-2">
              We provide exceptional travel experiences with unmatched service and attention to detail.
            </p>
                </div>
                      
 

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 sm:p-6 rounded-xl hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-3 sm:mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-300" />
                  </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-800 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Destinations & Activities Section */}
      <section className="py-10 sm:py-16 md:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-12 md:mb-16 px-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Discover Sri Lanka&apos;s Destinations
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-800 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
              {`Explore the diverse beauty of Sri Lanka with our curated list of destinations and activities.
From ancient temples and wildlife safaris to pristine beaches and misty highlands—each region offers unique experiences for every traveler.
Whether you seek culture, nature, or relaxation, find inspiration here.
Discover your next adventure and plan the perfect Sri Lankan journey.`}
            </p>
          </div>

          {/* Top Filter Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={destinationSearchQuery}
                  onChange={(e) => setDestinationSearchQuery(e.target.value)}
                  className="px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation w-full sm:w-auto"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px] touch-manipulation w-full sm:w-auto"
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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col min-h-[380px] sm:h-[420px] animate-pulse">
                  <div className="h-40 sm:h-44 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 w-4/5" />
                    <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingDestinations && filteredDestinations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No destinations found.</p>
              </div>
            </div>
          ) : filteredDestinations.length > 0 ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {displayedDestinations.map((destination) => {
                const badge = destination.region === 'Cultural Triangle' ? 'Heritage' : 
                             destination.region === 'Wildlife' ? 'Nature' :
                             destination.region.includes('Province') ? 'Cultural' : 'Explore'
                const rating = 4.5 + (destination.id?.length ?? 0) % 5 * 0.1
                const reviews = 50 + (destination.id?.length ?? 0) % 200

                return (
                  <div key={destination.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col min-h-[380px] sm:h-[420px]">
                    <div className="relative shrink-0 h-40 sm:h-44">
                      <Image
                        src={destination.image || '/placeholder-image.svg'}
                        alt={destination.name}
                        width={400}
                        height={176}
                        className="w-full h-full object-cover"
                        unoptimized={!!destination.image}
                      />
                      <div className="absolute top-3 left-3 bg-black px-3 py-1 rounded-full text-xs font-bold text-[#ADFF29]">
                        {badge}
                      </div>
                      <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 active:bg-white/80 dark:active:bg-gray-700/80 transition-colors touch-manipulation min-w-[44px] min-h-[44px]" aria-label="Save">
                        <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white line-clamp-2">{destination.name}</h3>
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">{rating.toFixed(1)} ({reviews})</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 flex-1 min-h-0">
                        {destination.description || 'Explore this destination.'}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">… more</p>
                      <Link href={`/destinations/${destination.id}`} className="mt-3 shrink-0">
                        <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 active:opacity-80 transition-all flex items-center justify-center space-x-2 min-h-[44px] touch-manipulation">
                          <span>Explore</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
            {hasMoreDestinations && (
              <div className="flex justify-center mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={() => setDestinationsDisplayLimit((prev) => prev + 10)}
                  className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
                >
                  More
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No destinations found</p>
              <p className="text-gray-400 text-sm">Please check back later</p>
            </div>
          )}
        </div>  
      </section>

      {/* Discover Sri Lanka – Blog short view */}
      <section className="py-10 sm:py-16 md:py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Discover Sri Lanka
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              From ancient temples to pristine beaches, explore the diverse beauty of Sri Lanka.
            </p>
          </div>

          {blogPosts.length > 0 ? (
            <>
              <div className="relative pl-10 pr-10 sm:pl-14 sm:pr-14 md:pl-16 md:pr-16">
                <button
                  type="button"
                  aria-label="Previous blog posts"
                  onClick={() => setBlogCarouselIndex(i => Math.max(0, i - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-[1] w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next blog posts"
                  onClick={() => setBlogCarouselIndex(i => Math.min(Math.max(0, Math.ceil(blogPosts.length / 3) - 1), i + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-[1] w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
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
                        <Link href={`/blog/${post.id}`} className="block bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-full">
                          <div className="relative h-48 sm:h-56">
                            <Image
                              src={post.image || '/placeholder-image.svg'}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                          <div className="p-4 sm:p-6">
                            {post.category && (
                              <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs sm:text-sm mb-2 sm:mb-3">
                                {post.category}
                              </span>
                            )}
                            <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">{post.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-4 mb-2 sm:mb-3">
                              {post.description || post.excerpt || ''}
                            </p>
                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                              {post.date && <span>{post.date}</span>}
                              {post.readTime && <span>{post.readTime}</span>}
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center mt-10">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Explore stories and travel tips on our blog.</p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                View Blog
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Inspired by Swimlane's CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-2">
            Ready to Start Your Sri Lankan Adventure?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Let us help you create unforgettable memories with our expertly crafted tour packages.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-2">
            <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors min-h-[44px] touch-manipulation">
              Get Started Today
              </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-colors min-h-[44px] touch-manipulation">
              Contact Us
              </button>
            </div>
          </div>
      </section>

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
