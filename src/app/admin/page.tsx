'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Package,
  MapPin,
  Image as ImageIcon,
  Calendar,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
  CheckCircle,
  Eye,
  RefreshCw,
  Car,
  MessageCircle,
  LayoutTemplate,
  Clock,
  Users,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { formatRentalCurrency } from '@/lib/rentalPricing'

interface BookingRow {
  id: string
  bookingRef?: string
  tourPackageName: string
  customerName: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  bookingDate: string
  paymentStatus?: string
}

type StatCard = {
  name: string
  value: string
  change?: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: typeof Package
  href: string
  accent: string
}

function mapBooking(b: Record<string, unknown>): BookingRow {
  return {
    id: String(b.id || ''),
    bookingRef: String(b.booking_ref || b.bookingRef || b.id || ''),
    tourPackageName: String(
      b.tour_package_name || b.tourPackageName || b.vehicle_name || b.vehicleName || 'Booking'
    ),
    customerName: String(b.customer_name || b.customerName || 'Guest'),
    totalPrice: Number(b.total_price ?? b.totalPrice ?? 0),
    status: (b.status as BookingRow['status']) || 'pending',
    bookingDate: String(b.created_at || b.createdAt || new Date().toISOString()),
    paymentStatus: String(b.payment_status || b.paymentStatus || 'pending'),
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([])
  const [allBookings, setAllBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [counts, setCounts] = useState({
    tours: 0,
    destinations: 0,
    vehicles: 0,
    images: 0,
    chats: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    revenue: 0,
  })

  const isAdmin = user?.role === 'admin'

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [bookingsRes, toursRes, destRes, vehiclesRes, imagesRes, chatsRes] = await Promise.all([
        fetch('/api/bookings', { cache: 'no-store' }),
        fetch('/api/tours'),
        fetch('/api/destinations'),
        fetch('/api/vehicles?all=true'),
        fetch('/api/images'),
        fetch('/api/chat/conversations?status=all'),
      ])

      const [bookingsJson, toursJson, destJson, vehiclesJson, imagesJson, chatsJson] = await Promise.all([
        bookingsRes.json(),
        toursRes.json(),
        destRes.json(),
        vehiclesRes.json(),
        imagesRes.json(),
        chatsRes.json(),
      ])

      const bookings: BookingRow[] =
        bookingsJson.success && Array.isArray(bookingsJson.data)
          ? bookingsJson.data.map((b: Record<string, unknown>) => mapBooking(b))
          : []

      const sorted = [...bookings].sort(
        (a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      )

      setAllBookings(bookings)
      setRecentBookings(sorted.slice(0, 8))

      const revenue = bookings
        .filter((b) => b.status === 'confirmed' || b.status === 'completed' || b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

      setCounts({
        tours: toursJson.success && Array.isArray(toursJson.data) ? toursJson.data.length : 0,
        destinations: destJson.success && Array.isArray(destJson.data) ? destJson.data.length : 0,
        vehicles: vehiclesJson.success && Array.isArray(vehiclesJson.data) ? vehiclesJson.data.length : 0,
        images: imagesJson.success && Array.isArray(imagesJson.data) ? imagesJson.data.length : 0,
        chats: chatsJson.success && Array.isArray(chatsJson.data) ? chatsJson.data.length : 0,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
        confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
        revenue,
      })
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) loadDashboard()
  }, [isAdmin, loadDashboard])

  const stats: StatCard[] = useMemo(
    () => [
      {
        name: 'Total Bookings',
        value: loading ? '—' : String(allBookings.length),
        change: loading ? undefined : `${counts.confirmedBookings} confirmed`,
        changeType: 'positive',
        icon: Calendar,
        href: '/admin/bookings',
        accent: 'bg-emerald-500',
      },
      {
        name: 'Revenue',
        value: loading ? '—' : formatRentalCurrency(counts.revenue),
        change: loading ? undefined : 'paid & confirmed',
        changeType: 'neutral',
        icon: DollarSign,
        href: '/admin/bookings',
        accent: 'bg-teal-600',
      },
      {
        name: 'Tours',
        value: loading ? '—' : String(counts.tours),
        icon: Package,
        href: '/admin/tours',
        accent: 'bg-blue-500',
        changeType: 'positive',
      },
      {
        name: 'Destinations',
        value: loading ? '—' : String(counts.destinations),
        icon: MapPin,
        href: '/admin/destinations',
        accent: 'bg-violet-500',
        changeType: 'positive',
      },
      {
        name: 'Vehicles',
        value: loading ? '—' : String(counts.vehicles),
        icon: Car,
        href: '/admin/vehicles',
        accent: 'bg-amber-500',
        changeType: 'positive',
      },
      {
        name: 'Live Chats',
        value: loading ? '—' : String(counts.chats),
        icon: MessageCircle,
        href: '/admin/chat',
        accent: 'bg-rose-500',
        changeType: 'positive',
      },
      {
        name: 'Media Library',
        value: loading ? '—' : String(counts.images),
        icon: ImageIcon,
        href: '/admin/images',
        accent: 'bg-orange-500',
        changeType: 'positive',
      },
      {
        name: 'Pending',
        value: loading ? '—' : String(counts.pendingBookings),
        icon: Clock,
        href: '/admin/bookings?status=pending',
        accent: 'bg-yellow-500',
        changeType: counts.pendingBookings > 0 ? 'negative' : 'positive',
      },
    ],
    [allBookings.length, counts, loading]
  )

  const quickActions = [
    {
      name: 'New tour package',
      description: 'Create a tour itinerary',
      href: '/admin/tours/new',
      icon: Plus,
      color: 'bg-blue-600',
    },
    {
      name: 'Manage bookings',
      description: 'Confirm, invoice & pay links',
      href: '/admin/bookings',
      icon: Calendar,
      color: 'bg-emerald-600',
    },
    {
      name: 'Site content',
      description: 'Pages, sections & layout',
      href: '/admin/site-content',
      icon: LayoutTemplate,
      color: 'bg-teal-700',
    },
    {
      name: 'Add destination',
      description: 'New place on the map',
      href: '/admin/destinations/new',
      icon: MapPin,
      color: 'bg-violet-600',
    },
    {
      name: 'Add vehicle',
      description: 'Fleet & rental pricing',
      href: '/admin/vehicles/new',
      icon: Car,
      color: 'bg-amber-600',
    },
    {
      name: 'Email center',
      description: 'Inbox, compose & reply',
      href: '/admin/email',
      icon: Mail,
      color: 'bg-indigo-600',
    },
    {
      name: 'Upload images',
      description: 'Photos for tours & site',
      href: '/admin/images',
      icon: ImageIcon,
      color: 'bg-orange-600',
    },
  ]

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-gray-600">You need admin privileges to view the dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Admin</p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} — here is what is happening today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-xl p-2.5 text-white ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:text-teal-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.change ? (
                <p
                  className={`mt-1 text-xs font-medium ${
                    stat.changeType === 'negative' ? 'text-amber-600' : 'text-gray-500'
                  }`}
                >
                  {stat.change}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Quick actions */}
        <div className="xl:col-span-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          <p className="mb-4 text-sm text-gray-500">Jump to common admin tasks</p>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-teal-200 hover:bg-teal-50/50"
              >
                <span className={`rounded-lg p-2 text-white ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{action.name}</p>
                  <p className="truncate text-xs text-gray-500">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2>
              <p className="text-sm text-gray-500">Latest orders across tours & rentals</p>
            </div>
            <Link href="/admin/bookings" className="text-sm font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentBookings.map((booking) => (
                  <li key={booking.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{booking.customerName}</p>
                      <p className="truncate text-xs text-gray-500">
                        {booking.bookingRef ? `#${booking.bookingRef} · ` : ''}
                        {booking.tourPackageName}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatRentalCurrency(booking.totalPrice || 0)}
                    </span>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"
                      aria-label="View booking"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <Calendar className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">No bookings yet</p>
                <p className="text-sm text-gray-500">New orders will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-gray-500">Pending bookings</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : counts.pendingBookings}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Confirmed bookings</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '…' : counts.confirmedBookings}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-teal-600" />
            <div>
              <p className="text-sm text-gray-500">Total revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '…' : formatRentalCurrency(counts.revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
