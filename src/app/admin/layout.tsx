'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  Calendar,
  Image as ImageIcon,
  Settings,
  Users,
  TrendingUp,
  Search as SearchIcon,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  LayoutTemplate,
  Car,
  SlidersHorizontal,
  Mail,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import AdminRoute from '../../components/AdminRoute'
import { hasStaffAccess, roleLabel } from '@/lib/roles'
import { useDashboardAccess } from '@/hooks/useDashboardAccess'
import { DASHBOARD_SECTIONS, type DashboardSectionId } from '@/lib/dashboardAccess'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalChatCount, setTotalChatCount] = useState(0)
  const { canAccess, loaded: accessLoaded, firstAllowedHref, sectionIdFromPathname } = useDashboardAccess()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Fetch total chat count
  useEffect(() => {
    const fetchChatCount = async () => {
      try {
        const response = await fetch('/api/chat/conversations?status=all')
        const result = await response.json()
        if (result.success && result.data) {
          setTotalChatCount(result.data.length)
        }
      } catch (error) {
        console.error('Error fetching chat count:', error)
      }
    }

    if (user && hasStaffAccess(user.role)) {
      fetchChatCount()
      // Poll every 10 seconds for updates
      const interval = setInterval(fetchChatCount, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  const iconBySection: Record<DashboardSectionId, typeof LayoutDashboard> = {
    dashboard: LayoutDashboard,
    chat: MessageCircle,
    email: Mail,
    blog: FileText,
    bookings: Calendar,
    images: ImageIcon,
    tours: Package,
    vehicles: Car,
    'rental-settings': SlidersHorizontal,
    destinations: MapPin,
    users: Users,
    analytics: TrendingUp,
    seo: SearchIcon,
    'site-content': LayoutTemplate,
    settings: Settings,
    'access-control': Shield,
  }

  const navigation = DASHBOARD_SECTIONS
    .filter((section) => canAccess(section.id))
    .map((section) => ({
      name: section.name,
      href: section.href,
      icon: iconBySection[section.id],
      badge: section.id === 'chat' ? totalChatCount : undefined,
    }))

  useEffect(() => {
    if (!accessLoaded || !user) return
    const sectionId = sectionIdFromPathname(pathname)
    if (!sectionId) return
    if (canAccess(sectionId)) return
    router.replace(firstAllowedHref)
  }, [accessLoaded, canAccess, firstAllowedHref, pathname, router, sectionIdFromPathname, user])

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="/logoisle&echo.png"
                    alt="ISLE & ECHO"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">{roleLabel(user?.role) || 'User'}</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:pl-64">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:flex items-center space-x-3">
                <div className="relative w-8 h-8">
                  <Image
                    src="/logoisle&echo.png"
                    alt="ISLE & ECHO"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-gray-900">ISLE & ECHO</div>
                  <div className="text-xs text-gray-500">Admin Panel</div>
                </div>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 capitalize">{user?.name || 'User'}</span>
            </div>
          </div>

          <main className="p-4 sm:p-6 max-w-[1600px]">
            {children}
          </main>
        </div>
      </div>
    </AdminRoute>
  )
}
