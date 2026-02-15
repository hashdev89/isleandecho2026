'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Search,
  Calendar,
  MapPin,
  Star,
  Heart,
  Filter,
  ArrowRight,
  Fuel,
  Users,
  Settings,
  Shield
} from 'lucide-react'
import Header from '../../components/Header'

export default function RentCarPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 200])
  const [pickupLocation, setPickupLocation] = useState('')
  const [returnLocation, setReturnLocation] = useState('')

  const colors = {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#6EACFF',
      300: '#A7CDFF',
      400: '#4091FE',
      500: '#187BFF',
    },
    secondary: {
      100: '#CAFA7C',
      200: '#C6FF69',
      300: '#B4FF3A',
      400: '#ADFF29',
      500: '#A0FF07',
      600: '#9CFC00',
    },
    text: {
      base: '#0F172A',
      muted: '#94A3B8',
      highlight: '#334155',
    },
  }

  const categories = [
    { id: 'all', name: 'All Cars' },
    { id: 'economy', name: 'Economy' },
    { id: 'compact', name: 'Compact' },
    { id: 'midsize', name: 'Midsize' },
    { id: 'suv', name: 'SUV' },
    { id: 'luxury', name: 'Luxury' },
    { id: 'sports', name: 'Sports' }
  ]

  const cars = [
    {
      id: 1,
      name: "Toyota Corolla",
      category: "economy",
      image: "/placeholder-image.svg",
      price: 45,
      rating: 4.6,
      reviews: 234,
      features: ["5 Seats", "Automatic", "Air Conditioning", "Bluetooth"],
      fuelType: "Gasoline",
      transmission: "Automatic",
      mileage: "Unlimited",
      badge: "Popular"
    },
    {
      id: 2,
      name: "Honda Civic",
      category: "compact",
      image: "/placeholder-image.svg",
      price: 52,
      rating: 4.7,
      reviews: 189,
      features: ["5 Seats", "Automatic", "Air Conditioning", "USB Ports"],
      fuelType: "Gasoline",
      transmission: "Automatic",
      mileage: "Unlimited",
      badge: "Best Value"
    },
    {
      id: 3,
      name: "BMW 3 Series",
      category: "luxury",
      image: "/placeholder-image.svg",
      price: 120,
      rating: 4.9,
      reviews: 156,
      features: ["5 Seats", "Automatic", "Leather Seats", "Navigation"],
      fuelType: "Gasoline",
      transmission: "Automatic",
      mileage: "Unlimited",
      badge: "Premium"
    },
    {
      id: 4,
      name: "Jeep Wrangler",
      category: "suv",
      image: "/placeholder-image.svg",
      price: 85,
      rating: 4.5,
      reviews: 98,
      features: ["5 Seats", "4WD", "Convertible Top", "Off-road"],
      fuelType: "Gasoline",
      transmission: "Manual",
      mileage: "Unlimited",
      badge: "Adventure"
    },
    {
      id: 5,
      name: "Tesla Model 3",
      category: "luxury",
      image: "/placeholder-image.svg",
      price: 95,
      rating: 4.8,
      reviews: 267,
      features: ["5 Seats", "Electric", "Autopilot", "Supercharging"],
      fuelType: "Electric",
      transmission: "Automatic",
      mileage: "Unlimited",
      badge: "Eco-Friendly"
    },
    {
      id: 6,
      name: "Porsche 911",
      category: "sports",
      image: "/placeholder-image.svg",
      price: 180,
      rating: 4.9,
      reviews: 89,
      features: ["2 Seats", "Sports Mode", "Premium Audio", "Carbon Fiber"],
      fuelType: "Gasoline",
      transmission: "Automatic",
      mileage: "Unlimited",
      badge: "Sports"
    }
  ]

  const filteredCars = cars.filter(car => {
    const categoryMatch = selectedCategory === 'all' || car.category === selectedCategory
    const priceMatch = car.price >= priceRange[0] && car.price <= priceRange[1]
    return categoryMatch && priceMatch
  })

  return (
    <div style={{ background: colors.primary[50] }} className="min-h-screen">
      <Header />
      
      {/* Header */}
      <div style={{ background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})` }} className="text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Rent a Car</h1>
            <p className="text-xl max-w-2xl mx-auto">Choose from our wide selection of vehicles for your journey</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <div style={{ background: 'white', borderColor: colors.primary[100] }} className="rounded-xl shadow-lg p-6 border mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label style={{ color: colors.text.base }} className="block text-sm font-medium mb-2">Pickup Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  style={{ background: colors.primary[50], color: colors.text.base, borderColor: colors.primary[100] }}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary[500] }} />
              </div>
            </div>
            <div>
              <label style={{ color: colors.text.base }} className="block text-sm font-medium mb-2">Return Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter return location"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  style={{ background: colors.primary[50], color: colors.text.base, borderColor: colors.primary[100] }}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary[500] }} />
              </div>
            </div>
            <div>
              <label style={{ color: colors.text.base }} className="block text-sm font-medium mb-2">Pickup Date</label>
              <div className="relative">
                <input
                  type="date"
                  style={{ background: colors.primary[50], color: colors.text.base, borderColor: colors.primary[100] }}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary[500] }} />
              </div>
            </div>
            <div>
              <label style={{ color: colors.text.base }} className="block text-sm font-medium mb-2">Return Date</label>
              <div className="relative">
                <input
                  type="date"
                  style={{ background: colors.primary[50], color: colors.text.base, borderColor: colors.primary[100] }}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#187BFF] focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.primary[500] }} />
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <button style={{ background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})` }} className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search Cars</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div style={{ background: 'white', borderColor: colors.primary[100] }} className="rounded-xl shadow-lg p-6 border">
              <div className="flex items-center mb-6">
                <Filter className="w-5 h-5 mr-2" style={{ color: colors.primary[500] }} />
                <h3 style={{ color: colors.text.base }} className="text-lg font-semibold">Filters</h3>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 style={{ color: colors.text.base }} className="font-medium mb-3">Car Type</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span style={{ color: colors.text.muted }} className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 style={{ color: colors.text.base }} className="font-medium mb-3">Price Range (per day)</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm" style={{ color: colors.text.muted }}>
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cars Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 style={{ color: colors.text.base }} className="text-2xl font-bold">
                {filteredCars.length} Cars Available
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <div key={car.id} style={{ border: `1px solid ${colors.primary[100]}` }} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <Image
                      src={car.image || '/placeholder-image.svg'}
                      alt={car.name}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    <div style={{ background: `linear-gradient(90deg, ${colors.secondary[400]}, ${colors.secondary[500]})` }} className="absolute top-3 left-3 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {car.badge}
                    </div>
                    <button style={{ background: colors.primary[50] }} className="absolute top-3 right-3 p-2 rounded-full shadow-md hover:bg-[#DBEAFE] transition-colors">
                      <Heart className="w-5 h-5" style={{ color: colors.primary[500] }} />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 style={{ color: colors.text.base }} className="text-xl font-semibold mb-2">{car.name}</h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4" style={{ color: colors.secondary[400] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm">{car.rating} ({car.reviews})</span>
                      </div>
                      <div style={{ color: colors.primary[500] }} className="text-2xl font-bold">${car.price}/day</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center space-x-1">
                        <Fuel className="w-4 h-4" style={{ color: colors.primary[500] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm">{car.fuelType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Settings className="w-4 h-4" style={{ color: colors.primary[500] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm">{car.transmission}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" style={{ color: colors.primary[500] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm">{car.features[0]}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" style={{ color: colors.primary[500] }} />
                        <span style={{ color: colors.text.muted }} className="text-sm">{car.mileage}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {car.features.slice(1, 3).map((feature, index) => (
                        <span key={index} style={{ background: colors.primary[100], color: colors.primary[500] }} className="px-2 py-1 rounded-full text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <button style={{ background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[500]})` }} className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center space-x-2">
                      <span>Rent Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 