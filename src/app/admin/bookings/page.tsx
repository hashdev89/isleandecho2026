'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

interface Booking {
  id: string
  bookingRef: string
  tourPackageId: string
  tourPackageName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startDate: string
  endDate: string
  guests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  specialRequests: string
  bookingDate: string
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  paymentId?: string
  paymentMethod?: string
}

async function fetchBookings(userEmail?: string, userRole?: string, userId?: string): Promise<Booking[]> {
  try {
    console.log('Fetching bookings from API...')
    const headers: HeadersInit = {}
    if (userEmail) headers['x-user-email'] = userEmail
    if (userRole) headers['x-user-role'] = userRole
    if (userId) headers['x-user-id'] = userId
    
    const res = await fetch('/api/bookings', { headers, cache: 'no-store' })
    const json = await res.json()
    console.log('Bookings API response:', json)
    console.log('Bookings API response data:', json.data)
    console.log('Bookings API response data length:', json.data?.length)
    
    if (!json.success) {
      console.error('Bookings API error:', json.error)
      throw new Error(json.error || 'Failed to load bookings')
    }
    
    if (!json.data || !Array.isArray(json.data)) {
      console.error('Invalid data format:', json.data)
      throw new Error('Invalid data format received from API')
    }
    
    // Map API fields to UI fields
    const bookings = (json.data as unknown[]).map((b: unknown) => {
      const booking = b as Record<string, unknown>
      return {
        id: booking.id as string,
        bookingRef: (booking.booking_ref as string) || (booking.bookingRef as string) || (booking.id as string),
        tourPackageId: (booking.tour_package_id as string) || (booking.tourPackageId as string),
        tourPackageName: (booking.tour_package_name as string) || (booking.tourPackageName as string),
        customerName: (booking.customer_name as string) || (booking.customerName as string),
        customerEmail: (booking.customer_email as string) || (booking.customerEmail as string),
        customerPhone: (booking.customer_phone as string) || (booking.customerPhone as string),
        startDate: (booking.start_date as string) || (booking.startDate as string),
        endDate: (booking.end_date as string) || (booking.endDate as string),
        guests: (booking.guests as number) || 1,
        totalPrice: (booking.total_price as number) || (booking.totalPrice as number) || 0,
        status: (booking.status as 'pending' | 'confirmed' | 'cancelled' | 'completed') || 'pending',
        specialRequests: (booking.special_requests as string) || (booking.specialRequests as string) || '',
        bookingDate: (booking.created_at as string) || (booking.createdAt as string) || new Date().toISOString(),
        paymentStatus: (booking.payment_status as 'pending' | 'paid' | 'refunded' | 'failed') || (booking.paymentStatus as 'pending' | 'paid' | 'refunded' | 'failed') || 'pending',
        paymentId: (booking.payment_id as string) || (booking.paymentId as string) || undefined,
        paymentMethod: (booking.payment_method as string) || (booking.paymentMethod as string) || undefined,
      }
    })
    
    console.log('Mapped bookings:', bookings)
    console.log('Mapped bookings count:', bookings.length)
    return bookings
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw error
  }
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading bookings...')
      const data = await fetchBookings(user?.email, user?.role, user?.id)
      console.log('Received bookings data:', data)
      setBookings(data)
      console.log('Bookings loaded successfully:', data.length, 'bookings')
      console.log('Bookings state updated:', data)
    } catch (e: unknown) {
      console.error('Error loading bookings:', e)
      setError((e as Error).message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const refreshBookings = async () => {
    try {
      setRefreshing(true)
      setError(null)
      const data = await fetchBookings(user?.email, user?.role, user?.id)
      setBookings(data)
      console.log('Bookings refreshed successfully:', data.length, 'bookings')
    } catch (e: unknown) {
      console.error('Error refreshing bookings:', e)
      setError((e as Error).message || 'Failed to refresh bookings')
    } finally {
      setRefreshing(false)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    try {
      setDeleting(true)
      setError(null)
      
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete booking')
      }
      
      // Remove the booking from the local state
      setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId))
      
      // Close the modal
      setDeleteModalOpen(false)
      setBookingToDelete(null)
      
      console.log('Booking deleted successfully:', bookingId)
    } catch (e: unknown) {
      console.error('Error deleting booking:', e)
      setError((e as Error).message || 'Failed to delete booking')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteClick = (booking: Booking) => {
    setBookingToDelete(booking)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (bookingToDelete) {
      deleteBooking(bookingToDelete.id)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setBookingToDelete(null)
  }

  useEffect(() => {
    loadBookings()
  }, [user?.email, user?.role])

  // Auto-refresh when returning from other pages
  useEffect(() => {
    const handleFocus = () => {
      refreshBookings()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.tourPackageName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.bookingRef || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    // Fix date filtering logic
    let matchesDate = true
    if (dateFilter !== 'all') {
      const startDate = new Date(booking.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      
      if (dateFilter === 'upcoming') {
        matchesDate = startDate > today
      } else if (dateFilter === 'past') {
        matchesDate = startDate < today
      } else if (dateFilter === 'today') {
        const todayStr = today.toISOString().split('T')[0]
        matchesDate = booking.startDate === todayStr
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  console.log('Current bookings state:', bookings)
  console.log('Filtered bookings:', filteredBookings)
  console.log('Search term:', searchTerm)
  console.log('Status filter:', statusFilter)
  console.log('Date filter:', dateFilter)
  
  // Debug each booking's date filtering
  bookings.forEach((booking, index) => {
    const startDate = new Date(booking.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    console.log(`Booking ${index}:`, {
      id: booking.id,
      startDate: booking.startDate,
      parsedStartDate: startDate,
      today: today,
      isUpcoming: startDate > today,
      isPast: startDate < today,
      isToday: booking.startDate === today.toISOString().split('T')[0]
    })
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading bookings...
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading bookings</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button 
                onClick={loadBookings}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'refunded': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600">Manage and track all tour bookings</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={refreshBookings}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer name, email, or tour package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="today">Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour & Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking, index) => (
                <tr key={`${booking.id}-${booking.bookingDate}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order #{booking.bookingRef || booking.id}</p>
                      <p className="text-sm text-gray-500">{booking.bookingDate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                      <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.tourPackageName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {booking.startDate} - {booking.endDate}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {booking.guests} guests
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1 capitalize">{booking.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">${booking.totalPrice}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <button 
                          onClick={() => handleDeleteClick(booking)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Booking
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Are you sure you want to delete this booking? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  Booking #{bookingToDelete.id}
                </p>
                <p className="text-sm text-gray-600">
                  {bookingToDelete.customerName} - {bookingToDelete.tourPackageName}
                </p>
                <p className="text-sm text-gray-600">
                  ${bookingToDelete.totalPrice} • {bookingToDelete.guests} guests
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  'Delete Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
