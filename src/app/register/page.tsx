'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') {
      router.replace('/admin')
    } else {
      router.replace('/')
    }
  }, [user, router])

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field] || errors.general) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        delete next.general
        return next
      })
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Please enter a valid email'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setErrors({ general: data.error || `Registration failed (${response.status})` })
        return
      }
      const email = encodeURIComponent(form.email.trim())
      router.push(`/login?registered=1&email=${email}`)
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({
        general: error instanceof Error ? error.message : 'Registration failed. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (hasError?: string) =>
    `w-full rounded-xl border bg-[var(--foam)] py-3 pl-10 pr-12 text-[var(--ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/30 ${
      hasError ? 'border-red-300' : 'border-black/10'
    }`

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      <main className="w-full max-w-[1920px] mx-auto lp-gutter py-12 sm:py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <p className="lp-kicker mb-3">Join us</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Create account
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Register to book tours, manage trips, and stay in touch with ISLE &amp; ECHO.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {errors.general ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            ) : null}

            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`${fieldClass(errors.fullName)} pr-4`}
                  placeholder="Your full name"
                />
              </div>
              {errors.fullName ? <p className="mt-1 text-sm text-red-600">{errors.fullName}</p> : null}
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`${fieldClass(errors.email)} pr-4`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={fieldClass(errors.password)}
                  placeholder="At least 6 characters"
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
              {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password}</p> : null}
            </div>

            <div>
              <label htmlFor="register-confirm" className="mb-2 block text-sm font-medium text-[var(--ink)]">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
                <input
                  id="register-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className={fieldClass(errors.confirmPassword)}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--lagoon-deep)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lagoon)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
