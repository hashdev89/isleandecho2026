import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read users from file
const readUsers = () => {
  try {
    ensureDataDir()
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading users file:', error)
  }
  return []
}

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

// Write users to file
const writeUsers = (users: User[]): boolean => {
  try {
    ensureDataDir()
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error writing users file:', error)
    return false
  }
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        // Fall through to file storage
      } else if (data) {
        // Map to expected format
        const mappedUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role || 'customer',
          status: data.status || 'active',
          lastLogin: data.last_login ? new Date(data.last_login).toISOString() : new Date().toISOString(),
          createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
          totalBookings: data.total_bookings || 0,
          totalSpent: data.total_spent || 0,
          address: data.address || '',
          notes: data.notes || ''
        }
        return NextResponse.json(mappedUser)
      }
    }
    
    // Fallback to file storage
    const users = readUsers()
    const user = users.find((u: User) => u.id === resolvedParams.id)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const resolvedParams = await params
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (isSupabaseConfigured) {
      const updateData: Record<string, unknown> = {}
      
      if (body.name !== undefined) updateData.name = body.name
      if (body.email !== undefined) updateData.email = body.email
      if (body.phone !== undefined) updateData.phone = body.phone
      if (body.role !== undefined) updateData.role = body.role
      if (body.status !== undefined) updateData.status = body.status
      if (body.lastLogin !== undefined) updateData.last_login = body.lastLogin ? new Date(body.lastLogin).toISOString() : null
      if (body.totalBookings !== undefined) updateData.total_bookings = body.totalBookings
      if (body.totalSpent !== undefined) updateData.total_spent = body.totalSpent
      if (body.address !== undefined) updateData.address = body.address
      if (body.notes !== undefined) updateData.notes = body.notes
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', resolvedParams.id)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        const message = error.message || 'Failed to update user'
        const needsRoleMigration =
          body.role === 'super_admin' &&
          (/check constraint|invalid input value|enum/i.test(message) ||
            /users_role/i.test(message) ||
            /value too long/i.test(message))
        return NextResponse.json(
          {
            error: needsRoleMigration
              ? `${message} Run scripts/supabase-users-super-admin.sql in the Supabase SQL Editor, then try again.`
              : message,
          },
          { status: 500 }
        )
      } else if (data) {
        // Map back to expected format
        const mappedUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role || 'customer',
          status: data.status || 'active',
          lastLogin: data.last_login ? new Date(data.last_login).toISOString() : new Date().toISOString(),
          createdAt: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
          totalBookings: data.total_bookings || 0,
          totalSpent: data.total_spent || 0,
          address: data.address || '',
          notes: data.notes || ''
        }
        return NextResponse.json(mappedUser)
      }
    }
    
    // Fallback to file storage
    const users = readUsers()
    const userIndex = users.findIndex((u: User) => u.id === resolvedParams.id)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...body,
      id: resolvedParams.id // Ensure ID doesn't change
    }
    
    if (writeUsers(users)) {
      return NextResponse.json(users[userIndex])
    } else {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50
    
    if (isSupabaseConfigured) {
      // Fetch the user and count other admins
      const { data: userData, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', resolvedParams.id)
        .single()
      
      if (fetchError) {
        console.log(`User ${resolvedParams.id} not found in Supabase, allowing deletion (likely mock user)`)
        return NextResponse.json({ 
          success: true, 
          message: 'User deleted (user did not exist in database)' 
        })
      }
      
      if (userData?.role === 'super_admin') {
        const { count, error: countError } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin')

        if (countError || (count ?? 0) <= 1) {
          return NextResponse.json(
            { error: 'Cannot delete the last super admin. Ensure at least one other super admin exists first.' },
            { status: 403 }
          )
        }
      }

      if (userData?.role === 'admin') {
        const { count, error: countError } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
        
        if (countError || (count ?? 0) <= 1) {
          return NextResponse.json(
            { error: 'Cannot delete the last admin user. Ensure at least one other admin exists first.' },
            { status: 403 }
          )
        }
      }
      
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', resolvedParams.id)
      
      if (error) {
        console.error('Supabase delete error:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        // Return error response instead of falling through
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || 'Failed to delete user from database' 
          },
          { status: 500 }
        )
      } else {
        return NextResponse.json({ success: true, message: 'User deleted successfully' })
      }
    }
    
    // Fallback to file storage
    const users = readUsers()
    const userIndex = users.findIndex((u: User) => u.id === resolvedParams.id)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (users[userIndex].role === 'super_admin') {
      const superAdminCount = users.filter((u: User) => u.role === 'super_admin').length
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last super admin. Ensure at least one other super admin exists first.' },
          { status: 403 }
        )
      }
    }

    // If user is admin, require at least one other admin
    if (users[userIndex].role === 'admin') {
      const adminCount = users.filter((u: User) => u.role === 'admin').length
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user. Ensure at least one other admin exists first.' },
          { status: 403 }
        )
      }
    }
    
    // Remove user
    users.splice(userIndex, 1)
    
    if (writeUsers(users)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
