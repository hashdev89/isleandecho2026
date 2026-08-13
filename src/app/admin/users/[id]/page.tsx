'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Save,
  X,
  Trash2,
  Eye,
  DollarSign,
  Clock
} from 'lucide-react'
import { useAuth } from '../../../../contexts/AuthContext'
import { hasAdminAccess, isSuperAdmin, roleLabel } from '@/lib/roles'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'super_admin' | 'admin' | 'staff' | 'customer'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  createdAt: string
  totalBookings: number
  totalSpent: number
  address?: string
  notes?: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentAuthUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user data from API based on params.id
    const fetchUser = async () => {
      if (!params.id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${params.id}`)
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setEditedUser(userData)
        } else {
          console.error('Failed to load user')
          setUser(null)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'text-purple-700 bg-purple-100'
      case 'admin': return 'text-red-600 bg-red-100'
      case 'staff': return 'text-blue-600 bg-blue-100'
      case 'customer': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-yellow-600 bg-yellow-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      case 'staff': return <UserCheck className="w-4 h-4" />
      case 'customer': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="w-4 h-4" />
      case 'inactive': return <UserX className="w-4 h-4" />
      case 'suspended': return <UserX className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const handleSave = async () => {
    if (!editedUser) return
    try {
      const response = await fetch(`/api/users/${editedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUser),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        alert(data.error || 'Failed to update user')
        return
      }
      setUser(data)
      setEditedUser(data)
      setIsEditing(false)
      try {
        const savedAuth = localStorage.getItem('user')
        if (savedAuth) {
          const authUser = JSON.parse(savedAuth)
          if (authUser?.id === data.id) {
            localStorage.setItem('user', JSON.stringify({ ...authUser, role: data.role, name: data.name, email: data.email }))
          }
        }
      } catch {
        /* ignore */
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update user')
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  const handleStatusChange = (newStatus: User['status']) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, status: newStatus })
    }
  }

  const handleRoleChange = (newRole: User['role']) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, role: newRole })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <UserX className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The requested user could not be loaded.</p>
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

  const currentUser = isEditing ? editedUser : user

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit User' : 'User Details'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update user information' : 'View and manage user account'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentUser?.name || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={currentUser?.phone || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentUser?.address || ''}
                    onChange={(e) => setEditedUser(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              {isEditing ? (
                <textarea
                  value={currentUser?.notes || ''}
                  onChange={(e) => setEditedUser(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add notes about this user..."
                />
              ) : (
                <p className="text-gray-900">{user.notes || 'No notes available'}</p>
              )}
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Joined:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Last Login:</span>
                    <span className="ml-2 text-sm text-gray-900">{new Date(user.lastLogin).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Booking Statistics</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Total Bookings:</span>
                    <span className="ml-2 text-sm text-gray-900">{user.totalBookings}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Total Spent:</span>
                    <span className="ml-2 text-sm text-gray-900">${user.totalSpent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                {isEditing ? (
                  <select
                    value={currentUser?.role || 'customer'}
                    onChange={(e) => handleRoleChange(e.target.value as User['role'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    {(isSuperAdmin(currentAuthUser?.role) || hasAdminAccess(currentAuthUser?.role)) && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{roleLabel(user.role)}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                {isEditing ? (
                  <select
                    value={currentUser?.status || 'active'}
                    onChange={(e) => handleStatusChange(e.target.value as User['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                    {getStatusIcon(user.status)}
                    <span className="ml-1 capitalize">{user.status}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                <Eye className="w-4 h-4 mr-2" />
                View Bookings
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </button>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2" />
                Call User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
