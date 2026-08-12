import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex')
}

const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseKey !== 'placeholder-service-key' &&
    supabaseUrl.includes('supabase.co') &&
    supabaseKey.length > 50
  )
}

const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

type LocalUser = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  lastLogin: string
  createdAt: string
  totalBookings: number
  totalSpent: number
  address: string
  notes: string
  passwordHash?: string
}

const readUsers = (): LocalUser[] => {
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

const writeUsers = (users: LocalUser[]): boolean => {
  try {
    ensureDataDir()
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error writing users file:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const hashedPassword = hashPassword(password)
    const newId = crypto.randomUUID()

    if (isSupabaseConfigured()) {
      const { data: existingUsers, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', normalizedEmail)
        .limit(1)

      if (checkError) {
        console.error('Error checking existing user:', checkError)
        return NextResponse.json(
          { success: false, error: 'Registration failed' },
          { status: 500 }
        )
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        )
      }

      const userData: Record<string, unknown> = {
        id: newId,
        name: name.trim(),
        email: normalizedEmail,
        phone: '',
        role: 'customer',
        status: 'active',
        password_hash: hashedPassword,
        total_bookings: 0,
        total_spent: 0,
        address: '',
        notes: '',
        created_at: new Date().toISOString(),
      }

      let { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error && (error.message.includes('password_hash') || error.message.includes('column') || error.code === '42703')) {
        console.log('password_hash column not found, trying without it...')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash: _passwordHash, ...userDataWithoutPassword } = userData
        const result = await supabaseAdmin
          .from('users')
          .insert([userDataWithoutPassword])
          .select()
          .single()

        if (result.error) {
          error = result.error
        } else {
          data = result.data
          error = null
          console.warn('User created without password_hash. Please add password_hash column to users table.')
        }
      }

      if (error) {
        console.error('Supabase registration error:', error)

        let errorMessage = 'Registration failed. Please try again.'
        if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
          errorMessage = 'Email already registered'
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = 'Permission denied. Please check database permissions.'
        } else {
          errorMessage = `Registration failed: ${error.message}`
        }

        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role || 'customer',
        },
        message: 'Account created successfully',
      }, { status: 201 })
    }

    // Local fallback when Supabase is not configured (dev / offline)
    const users = readUsers()
    if (users.some((u) => u.email?.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    const localUser: LocalUser = {
      id: newId,
      name: name.trim(),
      email: normalizedEmail,
      phone: '',
      role: 'customer',
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      totalBookings: 0,
      totalSpent: 0,
      address: '',
      notes: '',
      passwordHash: hashedPassword,
    }

    users.push(localUser)
    if (!writeUsers(users)) {
      return NextResponse.json(
        { success: false, error: 'Failed to save account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      },
      message: 'Account created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
