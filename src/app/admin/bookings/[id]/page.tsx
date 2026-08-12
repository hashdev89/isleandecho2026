'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  // Calendar,
  // Users,
  // DollarSign,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Download,
  Send
} from 'lucide-react'

interface Booking {
  id: string
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
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'deposit_paid' | 'failed'
  accommodation: string
  transportation: string
  dietaryRestrictions: string[]
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

// Function to fetch booking data
async function fetchBooking(id: string): Promise<Booking | null> {
  try {
    const res = await fetch(`/api/bookings/${id}`)
    const json = await res.json()
    
    if (!json.success) {
      console.error('Booking API error:', json.error)
      return null
    }
    
    // Map API fields to UI fields
    const booking = json.data
    return {
      id: booking.id,
      tourPackageId: booking.tour_package_id || booking.tourPackageId,
      tourPackageName: booking.tour_package_name || booking.tourPackageName,
      customerName: booking.customer_name || booking.customerName,
      customerEmail: booking.customer_email || booking.customerEmail,
      customerPhone: booking.customer_phone || booking.customerPhone,
      startDate: booking.start_date || booking.startDate,
      endDate: booking.end_date || booking.endDate,
      guests: booking.guests || 1,
      totalPrice: booking.total_price || booking.totalPrice || 0,
      status: booking.status || 'pending',
      specialRequests: booking.special_requests || booking.specialRequests || '',
      bookingDate: booking.created_at || booking.createdAt || new Date().toISOString(),
      paymentStatus: booking.payment_status || booking.paymentStatus || 'pending',
      accommodation: booking.accommodation || 'Standard accommodation',
      transportation: booking.transportation || 'Air-conditioned vehicle',
      dietaryRestrictions: booking.dietary_restrictions || booking.dietaryRestrictions || [],
      emergencyContact: booking.emergency_contact || booking.emergencyContact || {
        name: 'Not provided',
        phone: 'Not provided',
        relationship: 'Not provided'
      }
    }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return null
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [invoiceMessage, setInvoiceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setLoading(true)
        setError(null)
        const bookingId = params.id as string
        const bookingData = await fetchBooking(bookingId)
        if (bookingData) {
          setBooking(bookingData)
          setEditedBooking(bookingData)
        } else {
          setError('Booking not found')
        }
      } catch (e: unknown) {
        console.error('Error loading booking:', e)
        setError((e as Error).message || 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    }
    
    loadBooking()
  }, [params.id])

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
      case 'deposit_paid': return 'text-emerald-700 bg-emerald-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'refunded': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleStatusChange = (newStatus: Booking['status']) => {
    setEditedBooking(prev => prev ? { ...prev, status: newStatus } : prev)
  }

  const handleSave = async () => {
    if (!editedBooking) return
    setSaving(true)
    try {
      const response = await fetch(`/api/bookings/${editedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editedBooking.status,
          payment_status: editedBooking.paymentStatus,
          customer_name: editedBooking.customerName,
          customer_email: editedBooking.customerEmail,
          customer_phone: editedBooking.customerPhone,
          start_date: editedBooking.startDate,
          end_date: editedBooking.endDate,
          guests: editedBooking.guests,
          total_price: editedBooking.totalPrice,
          special_requests: editedBooking.specialRequests,
          tour_package_name: editedBooking.tourPackageName,
        }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update booking')
      }
      setBooking(editedBooking)
      setIsEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save booking')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedBooking(booking)
    setIsEditing(false)
  }

  const sendDepositInvoice = async (confirmTour: boolean) => {
    if (!booking) return
    setSendingInvoice(true)
    setInvoiceMessage(null)
    try {
      const response = await fetch(`/api/invoices/${booking.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmTour, depositPercent: 50 }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send invoice')
      }
      if (confirmTour) {
        setBooking((prev) => (prev ? { ...prev, status: 'confirmed' } : prev))
        setEditedBooking((prev) => (prev ? { ...prev, status: 'confirmed' } : prev))
      }
      setInvoiceMessage({ type: 'success', text: result.message || 'Invoice emailed to the customer.' })
    } catch (err) {
      setInvoiceMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send invoice' })
    } finally {
      setSendingInvoice(false)
    }
  }

  const calculateDuration = () => {
    if (!booking) return 0
    const start = new Date(booking.startDate)
    const end = new Date(booking.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Booking</h2>
          <p className="text-gray-600 mb-4">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/bookings"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{booking.id}</h1>
            <p className="text-gray-600">{booking.tourPackageName}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              const link = document.createElement('a')
              link.href = `/api/invoices/${booking.id}`
              link.download = `Invoice-${booking.id}.pdf`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </button>
          <button
            type="button"
            onClick={() => sendDepositInvoice(false)}
            disabled={sendingInvoice}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendingInvoice ? 'Sending…' : 'Send invoice + PayHere link'}
          </button>
        </div>
      </div>

      {invoiceMessage && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          invoiceMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {invoiceMessage.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirm tour & send PayHere link</h2>
            <p className="text-sm text-gray-600 mt-1">
              Confirms the booking and emails the customer a summary invoice plus a secure PayHere link to pay 50% now. The remaining 50% is due before travel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => sendDepositInvoice(true)}
            disabled={sendingInvoice}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--lagoon-deep)] text-white rounded-lg hover:bg-[var(--lagoon)] transition-colors disabled:opacity-70 font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {sendingInvoice ? 'Sending…' : 'Confirm & email PayHere invoice'}
          </button>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="ml-1 capitalize">{booking.status}</span>
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </span>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tour Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tour Package</label>
                <p className="mt-1 text-sm text-gray-900">{booking.tourPackageName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-sm text-gray-900">{calculateDuration()} days</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <p className="mt-1 text-sm text-gray-900">{booking.startDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1 text-sm text-gray-900">{booking.endDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                <p className="mt-1 text-sm text-gray-900">{booking.guests}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Price</label>
                <p className="mt-1 text-sm text-gray-900">${booking.totalPrice}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{booking.customerEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{booking.customerPhone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Booking Date</label>
                <p className="mt-1 text-sm text-gray-900">{booking.bookingDate}</p>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Requests & Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                <p className="mt-1 text-sm text-gray-900">{booking.specialRequests}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Accommodation Preferences</label>
                <p className="mt-1 text-sm text-gray-900">{booking.accommodation}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transportation Preferences</label>
                <p className="mt-1 text-sm text-gray-900">{booking.transportation}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
                <p className="mt-1 text-sm text-gray-900">{booking.dietaryRestrictions.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-2">
              {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={!isEditing}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editedBooking?.status === status
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2 capitalize">{status}</span>
                </button>
              ))}
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mt-5 mb-2">Payment</h4>
            <div className="space-y-2">
              {(['pending', 'deposit_paid', 'paid', 'refunded'] as const).map((payment) => (
                <button
                  key={payment}
                  type="button"
                  onClick={() => setEditedBooking(prev => prev ? { ...prev, paymentStatus: payment as Booking['paymentStatus'] } : prev)}
                  disabled={!isEditing}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    editedBooking?.paymentStatus === payment
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {payment.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{booking.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{booking.emergencyContact.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relationship</label>
                <p className="mt-1 text-sm text-gray-900">{booking.emergencyContact.relationship}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                Send Confirmation Email
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Call Customer
              </button>
              <button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `/api/invoices/${booking.id}`
                  link.download = `Invoice-${booking.id}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
