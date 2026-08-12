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

type LocalUser = {
  id: string
  name: string
  email: string
  role?: string
  status?: string
  passwordHash?: string
  password_hash?: string
}

const readUsers = (): LocalUser[] => {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
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
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error writing users file:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const hashedPassword = hashPassword(password)

    if (isSupabaseConfigured()) {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, status, password_hash')
        .eq('email', normalizedEmail)
        .limit(1)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 500 }
        )
      }

      if (!users || users.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const user = users[0]

      if (user.status !== 'active') {
        return NextResponse.json(
          { success: false, error: 'Account is inactive. Please contact administrator.' },
          { status: 403 }
        )
      }

      if (!user.password_hash) {
        console.log(`User ${user.email} logging in without password_hash (migration mode)`)
      } else if (user.password_hash !== hashedPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'customer',
      }

      const role = (user.role || 'customer') as string
      const canAccessAdmin = ['admin', 'staff', 'customer'].includes(role)

      const response = NextResponse.json({
        success: true,
        user: userData,
      })

      if (canAccessAdmin) {
        response.cookies.set('admin_session', '1', {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          secure: process.env.NODE_ENV === 'production',
        })
      }

      return response
    }

    // Local fallback when Supabase is not configured
    const users = readUsers()
    const user = users.find((u) => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (user.status && user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      )
    }

    const storedHash = user.passwordHash || user.password_hash
    if (storedHash && storedHash !== hashedPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const updatedUsers = users.map((u) =>
      u.id === user.id
        ? { ...u, lastLogin: new Date().toISOString() }
        : u
    )
    writeUsers(updatedUsers)

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'customer',
    }

    const role = (user.role || 'customer') as string
    const canAccessAdmin = ['admin', 'staff', 'customer'].includes(role)

    const response = NextResponse.json({
      success: true,
      user: userData,
    })

    if (canAccessAdmin) {
      response.cookies.set('admin_session', '1', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production',
      })
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
