'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Filter,
  MoreHorizontal,
  Globe,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

interface Destination {
  id: string
  name: string
  region: string
  lat: number
  lng: number
  description: string
  image: string
  status: 'active' | 'inactive'
  toursCount: number
  lastUpdated: string
}

export default function DestinationsManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDestinations()
  }, [])

  const fetchDestinations = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/destinations')
      const result = await response.json()
      
      if (result.success) {
        // Map API data to component format
        const mappedDestinations = result.data.map((dest: unknown) => {
          const d = dest as Record<string, unknown>
          return {
            id: d.id as string,
            name: d.name as string,
            region: d.region as string,
            lat: d.lat as number,
            lng: d.lng as number,
            description: (d.description as string) || '',
            image: (d.image as string) || '/placeholder-image.svg',
            status: (d.status as 'active' | 'inactive') || 'active',
            toursCount: (d.toursCount as number) || 0, // Use toursCount from API
            lastUpdated: d.updated_at ? new Date(d.updated_at as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }
        })
        setDestinations(mappedDestinations)
      } else {
        console.error('Failed to fetch destinations:', result.message)
      }
    } catch (error) {
      console.error('Error fetching destinations:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dest.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = regionFilter === 'all' || dest.region === regionFilter
    return matchesSearch && matchesRegion
  })

  const regions = [...new Set(destinations.map(dest => dest.region))]

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Inactive
      </span>
    )
  }

  const handleDeleteDestination = async (destId: string) => {
    if (!confirm('Are you sure you want to delete this destination?')) {
      return
    }

    try {
      const response = await fetch(`/api/destinations?id=${destId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the destinations list
        await fetchDestinations()
      } else {
        alert(result.message || 'Failed to delete destination')
      }
    } catch (error) {
      console.error('Error deleting destination:', error)
      alert('Failed to delete destination. Please try again.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
          <p className="text-gray-600">Manage destinations and their coordinates</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchDestinations}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/destinations/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Destination
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search destinations by name or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading destinations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((destination) => (
          <div key={destination.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <Image
                src={destination.image || '/placeholder-image.svg'}
                alt={destination.name}
                width={400}
                height={192}
                className="w-full h-48 object-cover"
                unoptimized={!!destination.image}
              />
              <div className="absolute top-2 right-2">
                {getStatusBadge(destination.status)}
              </div>
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center space-x-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>{destination.region}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{destination.name}</h3>
                <div className="flex items-center space-x-1">
                  <Link
                    href={`/admin/destinations/${destination.id}`}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Edit destination"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteDestination(destination.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Delete destination"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {destination.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Coordinates:</span>
                  <div className="font-mono text-xs">
                    {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Tours:</span>
                  <div className="font-semibold text-blue-600">{destination.toursCount}</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Last updated: {new Date(destination.lastUpdated).toLocaleDateString()}</span>
                  <Link
                    href={`/admin/destinations/${destination.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDestinations.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || regionFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first destination.'
            }
          </p>
          {!searchTerm && regionFilter === 'all' && (
            <Link
              href="/admin/destinations/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Destination
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
