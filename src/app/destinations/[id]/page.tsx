import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, MapPin, Clock, Star } from 'lucide-react'

// Dynamically import Header since it's a client component
const Header = dynamic(() => import('../../../components/Header'), {
  ssr: true
})

interface Destination {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  description: string
  image: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface DestinationPageProps {
  params: Promise<{
    id: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { id } = await params
  const destination = await getDestination(id)
  
  return {
    title: `${destination?.name || 'Destination'} - ISLE & ECHO`,
    description: destination?.description || 'Discover amazing destinations in Sri Lanka',
    openGraph: {
      title: `${destination?.name || 'Destination'} - ISLE & ECHO`,
      description: destination?.description || 'Discover amazing destinations in Sri Lanka',
      images: destination?.image ? [destination.image] : [],
    },
  }
}

// Fetch destination data
async function getDestination(id: string): Promise<Destination | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/destinations`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })
    const data = await response.json()
    
    if (data.success && data.data) {
      return data.data.find((dest: Destination) => dest.id === id) || null
    }
    return null
  } catch (error) {
    console.error('Error fetching destination:', error)
    return null
  }
}

// Activity data for each destination
const destinationActivities: Record<string, Array<{name: string, description: string, duration: string, difficulty: string}>> = {
  colombo: [
    { name: "Visit Gangaramaya Temple", description: "Explore this beautiful Buddhist temple with its unique architecture", duration: "2-3 hours", difficulty: "Easy" },
    { name: "Explore Pettah Market", description: "Immerse yourself in the bustling local market atmosphere", duration: "2-4 hours", difficulty: "Easy" },
    { name: "Walk along Galle Face Green", description: "Enjoy the ocean breeze and sunset views", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Visit National Museum", description: "Discover Sri Lankan history and culture", duration: "2-3 hours", difficulty: "Easy" },
    { name: "Enjoy rooftop dining", description: "Experience Colombo's nightlife and cuisine", duration: "2-3 hours", difficulty: "Easy" }
  ],
  kandy: [
    { name: "Visit Temple of the Tooth", description: "See the sacred tooth relic of Buddha", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Explore Royal Botanical Gardens", description: "Walk through beautiful gardens and see exotic plants", duration: "2-3 hours", difficulty: "Easy" },
    { name: "Watch Cultural Dance Show", description: "Experience traditional Sri Lankan dance performances", duration: "1 hour", difficulty: "Easy" },
    { name: "Visit Tea Museum", description: "Learn about Sri Lankan tea production", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Walk around Kandy Lake", description: "Enjoy peaceful lake views and bird watching", duration: "1-2 hours", difficulty: "Easy" }
  ],
  sigiriya: [
    { name: "Climb Sigiriya Rock Fortress", description: "Ascend the ancient rock fortress for stunning views", duration: "3-4 hours", difficulty: "Moderate" },
    { name: "Visit Dambulla Cave Temple", description: "Explore ancient cave temples with Buddhist art", duration: "2-3 hours", difficulty: "Easy" },
    { name: "Explore Minneriya National Park", description: "Go on safari to see elephants and wildlife", duration: "4-6 hours", difficulty: "Easy" },
    { name: "See Ancient Frescoes", description: "View the famous Sigiriya frescoes", duration: "1 hour", difficulty: "Easy" },
    { name: "Visit Polonnaruwa Ancient City", description: "Explore the medieval capital ruins", duration: "3-4 hours", difficulty: "Easy" }
  ],
  ella: [
    { name: "Hike Little Adam's Peak", description: "Trek to the summit for panoramic views", duration: "2-3 hours", difficulty: "Moderate" },
    { name: "Visit Nine Arch Bridge", description: "See the iconic railway bridge", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Try Flying Ravana Zipline", description: "Experience thrilling zipline adventure", duration: "1-2 hours", difficulty: "Moderate" },
    { name: "Take Scenic Train Ride", description: "Enjoy the famous Ella to Kandy train journey", duration: "6-8 hours", difficulty: "Easy" },
    { name: "Visit Ravana Falls", description: "See the beautiful waterfall", duration: "1 hour", difficulty: "Easy" }
  ],
  mirissa: [
    { name: "Whale Watching Tour", description: "Spot blue whales and dolphins in their natural habitat", duration: "4-6 hours", difficulty: "Easy" },
    { name: "Surfing Lessons", description: "Learn to surf on Mirissa's perfect waves", duration: "2-3 hours", difficulty: "Moderate" },
    { name: "Visit Coconut Tree Hill", description: "Enjoy sunset views from this scenic spot", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Beach Party & Nightlife", description: "Experience Mirissa's vibrant nightlife", duration: "3-4 hours", difficulty: "Easy" },
    { name: "Secret Beach Exploration", description: "Discover hidden beaches and coves", duration: "2-3 hours", difficulty: "Easy" }
  ],
  yala: [
    { name: "Jeep Safari in Yala National Park", description: "Go on safari to spot leopards and elephants", duration: "4-6 hours", difficulty: "Easy" },
    { name: "Spot Leopards & Elephants", description: "Wildlife watching in their natural habitat", duration: "3-4 hours", difficulty: "Easy" },
    { name: "Bird Watching", description: "Observe diverse bird species", duration: "2-3 hours", difficulty: "Easy" },
    { name: "Visit Sithulpawwa Rock Temple", description: "Explore ancient rock temple", duration: "1-2 hours", difficulty: "Easy" },
    { name: "Campfire BBQ Experience", description: "Enjoy traditional BBQ under the stars", duration: "2-3 hours", difficulty: "Easy" }
  ]
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { id } = await params
  const destination = await getDestination(id)
  
  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Destination Not Found</h1>
          <Link href="/destinations" className="text-blue-600 hover:text-blue-800">
            ← Back to Destinations
          </Link>
        </div>
      </div>
    )
  }

  const activities = destinationActivities[id] || []

  const heroImage = destination.image || '/placeholder-image.svg'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section with Image */}
      <div className="relative h-[500px] md:h-[600px] overflow-hidden">
        <Image
          src={heroImage}
          alt={destination.name}
          fill
          className="object-cover"
          priority
          unoptimized={!!destination.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/40"></div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl">{destination.name}</h1>
            <p className="text-xl md:text-2xl mb-4 drop-shadow-lg">{destination.region}</p>
            <div className="flex items-center justify-center gap-4 text-lg">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <MapPin className="w-5 h-5" />
                <span>{destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
        <Link 
          href="/destinations" 
          className="absolute top-20 left-4 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Destinations
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About {destination.name}</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{destination.description}</p>
            </div>

            {/* Activities */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Things to Do</h2>
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{activity.name}</h3>
                    <p className="text-gray-700 mb-3">{activity.description}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{activity.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h3>
              <div className="aspect-video relative rounded-lg overflow-hidden">
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium">{destination.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{destination.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activities:</span>
                  <span className="font-medium">{activities.length}</span>
                </div>
              </div>
            </div>

            {/* Book Tour CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mt-6">
              <h3 className="text-xl font-semibold mb-4">Ready to Visit?</h3>
              <p className="mb-4">Book a tour to {destination.name} and experience all these amazing activities!</p>
              <Link 
                href="/tours" 
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                View Tours
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
