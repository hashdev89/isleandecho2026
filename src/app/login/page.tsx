'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const { user, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const registered = searchParams.get('registered') === '1'

  useEffect(() => {
    const prefill = searchParams.get('email')
    if (prefill) setEmail(prefill)
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') {
      router.replace('/admin')
    } else {
      router.replace('/')
    }
  }, [user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const success = await login(email, password)
      if (!success) {
        setError('Invalid email or password')
        return
      }
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          if (parsed.role === 'super_admin' || parsed.role === 'admin' || parsed.role === 'staff') {
            router.push('/admin')
            return
          }
        } catch {
          // fall through
        }
      }
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="lp-kicker mb-3">Welcome back</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">Sign in</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Access your bookings and account with ISLE &amp; ECHO.
      </p>

      {registered ? (
        <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Account created. Sign in with your email and password.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-[var(--foam)] py-3 pl-10 pr-4 text-[var(--ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/30"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-[var(--foam)] py-3 pl-10 pr-12 text-[var(--ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/30"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--lagoon-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lagoon)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        New here?{' '}
        <Link href="/register" className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      <main className="w-full max-w-[1920px] mx-auto lp-gutter py-12 sm:py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <Suspense fallback={<p className="text-sm text-[var(--ink-soft)]">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
