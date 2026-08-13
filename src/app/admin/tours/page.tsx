'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { hasAdminAccess } from '@/lib/roles'
import { useCurrency } from '@/contexts/CurrencyContext'
import { getTourReviews } from '@/lib/currency'

interface TourPackage {
  id: string
  name: string
  duration: string
  price: string
  style: string
  destinations: string[]
  highlights: string[]
  featured?: boolean
  rating?: number
  reviews?: number
  status: 'active' | 'draft' | 'archived'
  bookings: number
  revenue: number
  lastUpdated: string
}

export default function ToursManagement() {
  const { user } = useAuth()
  const { formatBasePrice } = useCurrency()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tours, setTours] = useState<TourPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadTours = async () => {
    try {
      setLoading(true)
      console.log('Loading tours...')
      const res = await fetch('/api/tours')
      const json = await res.json()
      console.log('Tours API response:', json)
      if (json.success) {
        const enriched = json.data.map((t: TourPackage) => ({
          ...t,
          bookings: 0,
          revenue: 0,
          lastUpdated: (t as TourPackage & { updatedAt?: string; updated_at?: string }).updatedAt?.slice(0,10) || (t as TourPackage & { updatedAt?: string; updated_at?: string }).updated_at?.slice(0,10) || ''
        }))
        console.log('Enriched tours data:', enriched)
        setTours(enriched)
      } else {
        console.error('Failed to load tours:', json.message)
      }
    } catch (error) {
      console.error('Error loading tours:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTours()
  }, [])

  // Refresh tours when returning from tour creation/editing
  useEffect(() => {
    const handleFocus = () => {
      loadTours()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tour.destinations.some(dest => dest.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return
    setLoading(true)
    await doDeleteTour(tourId)
    setLoading(false)
  }

  const doDeleteTour = async (tourId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tours?id=${encodeURIComponent(tourId)}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        setTours(prev => prev.filter(tour => tour.id !== tourId))
        setSelectedIds(prev => { const next = new Set(prev); next.delete(tourId); return next })
        return true
      }
      alert(result.message || 'Failed to delete tour')
      return false
    } catch (error) {
      console.error('Error deleting tour:', error)
      alert('Error deleting tour. Please try again.')
      return false
    }
  }

  const toggleSelect = (tourId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(tourId)) next.delete(tourId)
      else next.add(tourId)
      return next
    })
  }

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredTours.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (!confirm(`Delete ${count} selected tour(s)? This cannot be undone.`)) return
    setLoading(true)
    const ids = Array.from(selectedIds)
    let ok = 0
    for (const id of ids) {
      const success = await doDeleteTour(id)
      if (success) ok++
    }
    setSelectedIds(new Set())
    setLoading(false)
    alert(ok === count ? 'Selected tours deleted.' : `Deleted ${ok} of ${count} tours.`)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tour Packages</h1>
          <p className="text-gray-600">Manage your tour packages and itineraries</p>
        </div>
        <div className="flex items-center space-x-3">
          {hasAdminAccess(user?.role) && selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={loadTours}
            disabled={loading}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/tours/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Tour
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
                placeholder="Search tours by name or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {loading ? 'Loading...' : `${filteredTours.length} Tour Packages`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {hasAdminAccess(user?.role) && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredTours.length > 0 && filteredTours.every(t => selectedIds.has(t.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      title="Select all"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={hasAdminAccess(user?.role) ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading tours...
                  </td>
                </tr>
              ) : filteredTours.length === 0 ? (
                <tr>
                  <td colSpan={hasAdminAccess(user?.role) ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    No tours found. <Link href="/admin/tours/new" className="text-blue-600 hover:text-blue-800">Create your first tour</Link>
                  </td>
                </tr>
              ) : (
                filteredTours.map((tour) => (
                <tr 
                  key={tour.id} 
                  className="hover:bg-gray-50 cursor-pointer group transition-colors"
                  onClick={() => window.location.href = `/admin/tours/${tour.id}`}
                >
                  {hasAdminAccess(user?.role) && (
                    <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tour.id)}
                        onChange={() => toggleSelect(tour.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {tour.name}
                      </div>
                      <div className="text-sm text-gray-500">{tour.highlights.join(', ')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{tour.duration}</div>
                      <div className="text-sm font-medium text-green-600">{formatBasePrice(tour.price)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {tour.destinations.slice(0, 2).join(', ')}
                      {tour.destinations.length > 2 && (
                        <span className="text-gray-500"> +{tour.destinations.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tour.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTourReviews(tour)} reviews</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tour.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div 
                      className="flex items-center justify-end space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/tours/${tour.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="View on website"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/tours/${tour.id}`}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors bg-gray-50"
                        title="Edit tour"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      {hasAdminAccess(user?.role) && (
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete tour"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
