/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  DollarSign,
  User,
  LogOut,
  Settings,
  Search
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import AuthModal from './AuthModal'
import { getGoogleTranslateLanguage, setGoogleTranslateLanguage } from './GoogleTranslate'
import { useClickOutside } from '../hooks/useClickOutside'
import { useCurrency } from '../contexts/CurrencyContext'


export default function Header() {
  const { isMenuOpen, setIsMenuOpen } = useMobileMenu()
  const [activeDropdown, setActiveDropdown] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('EN')
  const headerRef = useRef<HTMLElement>(null)
  const { currencies, selectedCurrency, setSelectedCurrency } = useCurrency()

  // Sync language with Google Translate cookie on load
  useEffect(() => {
    setSelectedLanguage(getGoogleTranslateLanguage())
  }, [])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('register')
  
  const { user, logout } = useAuth()

  const closeMenus = useCallback(() => {
    setActiveDropdown('')
    setIsMenuOpen(false)
  }, [setIsMenuOpen])

  useClickOutside(headerRef, Boolean(activeDropdown) || isMenuOpen, closeMenus)

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown((current) => (current === dropdown ? '' : dropdown))
  }

  const handleLogout = () => {
    logout()
    setActiveDropdown('')
  }

  const handleAuthAction = (isNew: boolean) => {
    if (isNew) {
      setAuthModalTab('register')
      setIsAuthModalOpen(true)
    } else {
      setAuthModalTab('signin')
      setIsAuthModalOpen(true)
    }
  }

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'AR', name: 'العربية' },
    { code: 'DE', name: 'Deutsch' },
    { code: 'ES', name: 'Español' },
    { code: 'FR', name: 'Français' },
    { code: 'HI', name: 'हिन्दी' },
    { code: 'IT', name: 'Italiano' },
    { code: 'JA', name: '日本語' },
    { code: 'KO', name: '한국어' },
    { code: 'NL', name: 'Nederlands' },
    { code: 'PT', name: 'Português' },
    { code: 'RU', name: 'Русский' },
    { code: 'TA', name: 'தமிழ்' },
    { code: 'ZH', name: '中文' },
  ]

  const [navTours, setNavTours] = useState<{ id: string; name: string; duration?: string }[]>([])
  const [tourSearch, setTourSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/tours')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const items = json.data
            .filter((t: any) => t?.id && t?.name && t.status !== 'inactive')
            .map((t: any) => ({
              id: String(t.id),
              name: String(t.name),
              duration: t.duration ? String(t.duration) : undefined,
            }))
            .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
          setNavTours(items)
        }
      } catch {
        // Silently fail - dropdown will just be empty
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (activeDropdown !== 'tours' && activeDropdown !== 'tours-mobile') {
      setTourSearch('')
    }
  }, [activeDropdown])

  const filteredNavTours = navTours.filter((t) => {
    const q = tourSearch.trim().toLowerCase()
    if (!q) return true
    return t.name.toLowerCase().includes(q) || (t.duration || '').toLowerCase().includes(q)
  })

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Tour Package', href: '/tours' },
    { name: 'Destinations', href: '/destinations' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ]

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-[100] transition-all duration-500 lp-nav-glass shadow-[0_8px_30px_rgba(11,61,74,0.08)] border-b border-white/40 dark:border-white/10"
      >
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex justify-between items-center h-[4.5rem]">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3 group">
                {/* Logo Image */}
                <div className="relative">
                  <Image
                    src="/logoisle&echo.png"
                    alt="ISLE & ECHO"
                    width={48}
                    height={48}
                    className="w-11 h-11 object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Logo Text */}
                <div className="hidden md:block">
                  <div className="font-display text-[1.35rem] font-semibold tracking-tight text-[var(--lagoon-deep)] dark:text-[var(--lagoon)] leading-none">ISLE & ECHO</div>
                  <div className="text-[var(--ink-soft)] text-[0.65rem] font-medium tracking-[0.12em] uppercase mt-1">Feel the Isle, Hear The Echo</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden min-[1400px]:flex items-center space-x-1">
              {navigation.map((item) => (
                item.name !== 'Tour Package' ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-3 py-2 text-[0.92rem] font-medium text-[var(--ink)] dark:text-gray-100 hover:text-[var(--lagoon)] transition-colors relative after:absolute after:left-3 after:right-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--sun)] after:transition-transform hover:after:scale-x-100"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <div key={item.name} className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDropdown('tours')
                      }}
                      className="flex items-center space-x-1 px-3 py-2 text-[0.92rem] font-medium text-[var(--ink)] dark:text-gray-100 hover:text-[var(--lagoon)] transition-colors"
                      aria-expanded={activeDropdown === 'tours'}
                    >
                      <span>Tour Package</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeDropdown === 'tours' && (
                      <div className="absolute left-0 mt-3 w-80 lp-nav-glass rounded-2xl shadow-2xl py-2 z-10">
                        <div className="relative mx-2 mb-2">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="search"
                            value={tourSearch}
                            onChange={(e) => setTourSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Search tour name..."
                            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2 pl-9 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--lagoon)]/20"
                          />
                        </div>
                        <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
                          <Link
                            href="/tours"
                            className="block px-4 py-2.5 text-sm text-[var(--ink)] dark:text-gray-200 hover:bg-[var(--lagoon)] hover:text-white transition-all duration-200 rounded-xl mx-2"
                            onClick={() => setActiveDropdown('')}
                          >
                            All Tour Packages
                          </Link>
                          {filteredNavTours.map((t) => (
                            <Link
                              key={t.id}
                              href={`/tours/${t.id}`}
                              className="block px-4 py-2.5 text-sm text-[var(--ink-soft)] dark:text-gray-300 hover:bg-[var(--lagoon)] hover:text-white transition-all duration-200 rounded-xl mx-2"
                              onClick={() => setActiveDropdown('')}
                            >
                              {t.name} {t.duration ? `– ${t.duration}` : ''}
                            </Link>
                          ))}
                          {filteredNavTours.length === 0 && (
                            <p className="px-4 py-3 text-sm text-gray-500">No tours match “{tourSearch}”</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ))}
            </nav>

                               {/* Desktop Utility Buttons */}
                   <div className="hidden min-[1400px]:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDropdown('language')
                  }}
                  className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
                  aria-expanded={activeDropdown === 'language'}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedLanguage}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'language' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 z-10 border border-white/20 dark:border-gray-700/20">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          setActiveDropdown('')
                          setSelectedLanguage(language.code)
                          setGoogleTranslateLanguage(language.code)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-1 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                      >
                        {language.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDropdown('currency')
                  }}
                  className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
                  aria-expanded={activeDropdown === 'currency'}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedCurrency}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'currency' && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 z-10 border border-white/20 dark:border-gray-700/20">
                    {currencies.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => {
                          setSelectedCurrency(currency.code)
                          setActiveDropdown('')
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-1 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                      >
                        <span className="font-medium">{currency.symbol}</span> {currency.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Authentication */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDropdown('user')
                    }}
                    className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
                    aria-expanded={activeDropdown === 'user'}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {activeDropdown === 'user' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 z-10 border border-white/20 dark:border-gray-700/20">
                      {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-1 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                          onClick={() => setActiveDropdown('')}
                        >
                          <Settings className="inline w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-1 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                      >
                        <LogOut className="inline w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Register Button */}
                  <button 
                    onClick={() => {
                      setAuthModalTab('register')
                      setIsAuthModalOpen(true)
                    }}
                    className="bg-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] text-white px-6 py-2.5 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm min-h-[44px] touch-manipulation"
                  >
                    Register
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="min-[1400px]:hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveDropdown('')
                  setIsMenuOpen(!isMenuOpen)
                }}
                className="text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 active:text-[#1E3A8A] transition-all duration-300 rounded-full p-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="min-[1400px]:hidden lp-nav-glass border-t border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  item.name !== 'Tour Package' ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-3 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 active:text-[#1E3A8A] transition-all duration-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 font-medium min-h-[44px] flex items-center touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  ) : (
                    <div key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggleDropdown('tours-mobile')}
                        className="flex w-full items-center justify-between px-3 py-3 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 font-medium min-h-[44px] touch-manipulation"
                      >
                        <span>Tour Package</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'tours-mobile' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === 'tours-mobile' && (
                        <div className="ml-2 mb-2 space-y-1">
                          <div className="relative px-1 py-1">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="search"
                              value={tourSearch}
                              onChange={(e) => setTourSearch(e.target.value)}
                              placeholder="Search tour name..."
                              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm min-h-[44px]"
                            />
                          </div>
                          <Link
                            href="/tours"
                            className="block px-3 py-2.5 text-sm font-medium text-[var(--lagoon-deep)] rounded-lg hover:bg-blue-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            All Tour Packages
                          </Link>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredNavTours.map((t) => (
                              <Link
                                key={t.id}
                                href={`/tours/${t.id}`}
                                className="block px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {t.name} {t.duration ? `– ${t.duration}` : ''}
                              </Link>
                            ))}
                            {filteredNavTours.length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-500">No tours match “{tourSearch}”</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
                


                {/* Mobile Language & Currency */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 text-sm font-medium">
                      <span>Language:</span>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setGoogleTranslateLanguage(e.target.value)}
                        className="bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 font-medium text-base min-h-[44px] touch-manipulation"
                      >
                        {languages.map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 text-sm font-medium">
                      <span>Currency:</span>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 font-medium text-base min-h-[44px] touch-manipulation"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mobile Auth Buttons */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 px-3 space-y-2">
                  {user ? (
                    <>
                      {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                      <Link
                        href="/admin"
                        className="w-full flex items-center justify-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 font-medium min-h-[44px] touch-manipulation"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                      )}
                      <button 
                        onClick={() => {
                          handleLogout()
                          setIsMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 font-medium min-h-[44px] touch-manipulation"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setAuthModalTab('register')
                          setIsAuthModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-4 py-3 rounded-full font-medium transition-all duration-300 shadow-lg min-h-[44px] touch-manipulation"
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal with Tabs */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </>
  )
} 