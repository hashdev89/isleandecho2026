'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  X,
  AlertCircle
} from 'lucide-react'

import { useAuth } from '../../../contexts/AuthContext'
import { hasAdminAccess, isSuperAdmin, roleLabel } from '@/lib/roles'

interface User {
  id: string
  name: string
  email: string
  phone: string
  password?: string
  role: 'super_admin' | 'admin' | 'staff' | 'customer'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  createdAt: string
  totalBookings: number
  totalSpent: number
  address?: string
  notes?: string
}


export default function UsersPage() {
  const { user: currentAuthUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active'
  })
  const [editUser, setEditUser] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active'
  })
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const usersData = await response.json()
          // Only set users if we got actual data (array with length > 0)
          // Don't use mock users - only show real users from API
          if (Array.isArray(usersData) && usersData.length > 0) {
            setUsers(usersData)
          } else {
            // No users in database, show empty array
            setUsers([])
          }
        } else {
          console.error('Failed to load users from API')
          // Fallback to localStorage if available
          const savedUsers = localStorage.getItem('admin-users')
          if (savedUsers) {
            try {
              const parsed = JSON.parse(savedUsers)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setUsers(parsed)
              } else {
                setUsers([])
              }
            } catch {
              setUsers([])
            }
          } else {
            // No mock users - show empty list
            setUsers([])
          }
        }
      } catch (error) {
        console.error('Error loading users:', error)
        // Fallback to localStorage if available
        const savedUsers = localStorage.getItem('admin-users')
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUsers(parsed)
            } else {
              setUsers([])
            }
          } catch {
            setUsers([])
          }
        } else {
          // No mock users - show empty list
          setUsers([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

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

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const customerUsers = users.filter(u => u.role === 'customer').length
  const staffUsers = users.filter(u => u.role === 'staff').length
  const canManageSuperAdmin =
    isSuperAdmin(currentAuthUser?.role) ||
    (hasAdminAccess(currentAuthUser?.role) && !users.some((u) => u.role === 'super_admin'))

  const handleAddUser = async () => {
    if (newUser.name && newUser.email && newUser.phone && newUser.password) {
      setLoading(true)
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser),
        })

        if (response.ok) {
          const addedUser = await response.json()
          setUsers([...users, addedUser])
          setShowAddModal(false)
          setNewUser({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'customer',
            status: 'active'
          })
          
          // Also save to localStorage as backup
          localStorage.setItem('admin-users', JSON.stringify([...users, addedUser]))
        } else {
          console.error('Failed to create user via API')
          // Fallback to local state update
          const userToAdd: User = {
            id: (Math.max(...users.map(u => parseInt(u.id)), 0) + 1).toString(),
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role || 'customer',
            status: newUser.status || 'active',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            totalBookings: 0,
            totalSpent: 0
          }

          setUsers([...users, userToAdd])
          localStorage.setItem('admin-users', JSON.stringify([...users, userToAdd]))
          setShowAddModal(false)
          setNewUser({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'customer',
            status: 'active'
          })
        }
      } catch (error) {
        console.error('Error creating user:', error)
        // Fallback to local state update
        const userToAdd: User = {
          id: (Math.max(...users.map(u => parseInt(u.id)), 0) + 1).toString(),
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role || 'customer',
          status: newUser.status || 'active',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          totalBookings: 0,
          totalSpent: 0
        }

        setUsers([...users, userToAdd])
        localStorage.setItem('admin-users', JSON.stringify([...users, userToAdd]))
        setShowAddModal(false)
        setNewUser({
          name: '',
          email: '',
          phone: '',
          role: 'customer',
          status: 'active'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancelAdd = () => {
    setShowAddModal(false)
    setNewUser({
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      status: 'active',
      address: '',
      notes: ''
    })
  }

  const handleEditUser = (user: User) => {
    setUserToEdit(user)
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '', // Start with empty password for security
      role: user.role,
      status: user.status,
      address: user.address || '',
      notes: user.notes || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userToDelete.id}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Successfully deleted
          setUsers(users.filter(user => user.id !== userToDelete.id))
          // Also update localStorage
          localStorage.setItem('admin-users', JSON.stringify(users.filter(user => user.id !== userToDelete.id)))
          // Refresh the users list from API
          const loadUsers = async () => {
            try {
              const response = await fetch('/api/users')
              if (response.ok) {
                const usersData = await response.json()
                setUsers(usersData)
              }
            } catch (error) {
              console.error('Error refreshing users:', error)
            }
          }
          loadUsers()
        } else {
          // Show error message
          const errorMessage = data.error || 'Failed to delete user'
          console.error('Failed to delete user:', errorMessage)
          alert(`Failed to delete user: ${errorMessage}`)
          // Don't update local state if API delete failed
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setShowDeleteModal(false)
        setUserToDelete(null)
        setLoading(false)
      }
    }
  }

  const handleUpdateUser = async () => {
    if (userToEdit && editUser.name && editUser.email && editUser.phone) {
      setLoading(true)
      
      // Only include password if it's provided
      const updateData = { ...editUser }
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }
      
      try {

        const response = await fetch(`/api/users/${userToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        if (response.ok) {
          const updatedUser = await response.json()
          setUsers(users.map(user => user.id === userToEdit.id ? updatedUser : user))
          localStorage.setItem('admin-users', JSON.stringify(users.map(user => user.id === userToEdit.id ? updatedUser : user)))

          try {
            const savedAuth = localStorage.getItem('user')
            if (savedAuth) {
              const authUser = JSON.parse(savedAuth)
              if (authUser?.id === userToEdit.id) {
                const nextAuth = { ...authUser, role: updatedUser.role, name: updatedUser.name, email: updatedUser.email }
                localStorage.setItem('user', JSON.stringify(nextAuth))
              }
            }
          } catch {
            /* ignore auth cache update */
          }
          
          setShowEditModal(false)
          setUserToEdit(null)
          setEditUser({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'customer',
            status: 'active',
            address: '',
            notes: ''
          })
        } else {
          const data = await response.json().catch(() => ({}))
          const message = data.error || 'Failed to update user'
          console.error('Failed to update user via API:', message)
          alert(message)
        }
      } catch (error) {
        console.error('Error updating user:', error)
        alert(error instanceof Error ? error.message : 'Failed to update user')
      } finally {
        setLoading(false)
      }
    }
  }

  const cancelEditUser = () => {
    setShowEditModal(false)
    setUserToEdit(null)
    setEditUser({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'customer',
      status: 'active',
      address: '',
      notes: ''
    })
  }

  const cancelDeleteUser = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={async () => {
              setLoading(true)
              try {
                const response = await fetch('/api/users')
                if (response.ok) {
                  const usersData = await response.json()
                  setUsers(usersData)
                  localStorage.setItem('admin-users', JSON.stringify(usersData))
                }
              } catch (error) {
                console.error('Error refreshing users:', error)
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => {
              console.log('Opening Add User modal...')
              setShowAddModal(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customerUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Staff Members</p>
              <p className="text-2xl font-bold text-gray-900">{staffUsers}</p>
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">{roleLabel(user.role)}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1 capitalize">{user.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        Last: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title={user.role === 'admin' ? 'Delete admin (only if another admin exists)' : 'Delete User'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancelAdd}
          ></div>

          {/* Modal panel */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Add New User
                </h3>
              </div>
              <button
                onClick={handleCancelAdd}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newUser.email || ''}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password || ''}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={newUser.role || 'customer'}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as User['role']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      {canManageSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newUser.status || 'active'}
                      onChange={(e) => setNewUser({...newUser, status: e.target.value as User['status']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={newUser.address || ''}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={newUser.notes || ''}
                    onChange={(e) => setNewUser({...newUser, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add notes about this user (optional)"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCancelAdd}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email || !newUser.phone || !newUser.password}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && userToEdit && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelEditUser}
          ></div>

          {/* Modal panel */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Edit User
                </h3>
              </div>
              <button
                onClick={cancelEditUser}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUser.name || ''}
                    onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editUser.email || ''}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editUser.phone || ''}
                    onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={editUser.password || ''}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to keep the current password
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={editUser.role || 'customer'}
                      onChange={(e) => setEditUser({...editUser, role: e.target.value as User['role']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      {canManageSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editUser.status || 'active'}
                      onChange={(e) => setEditUser({...editUser, status: e.target.value as User['status']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={editUser.address || ''}
                    onChange={(e) => setEditUser({...editUser, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editUser.notes || ''}
                    onChange={(e) => setEditUser({...editUser, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add notes about this user (optional)"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelEditUser}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!editUser.name || !editUser.email || !editUser.phone || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={cancelDeleteUser}
          ></div>

          {/* Modal panel */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Delete User
                </h3>
              </div>
              <button
                onClick={cancelDeleteUser}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {userToDelete.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{userToDelete.name}</h4>
                  <p className="text-sm text-gray-600">{userToDelete.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userToDelete.role)}`}>
                      {getRoleIcon(userToDelete.role)}
                      <span className="ml-1">{roleLabel(userToDelete.role)}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-red-800">Warning</h5>
                    <p className="text-sm text-red-700 mt-1">
                      This action cannot be undone. All user data, including bookings and history, will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
