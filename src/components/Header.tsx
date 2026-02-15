/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  DollarSign,
  User,
  LogOut,
  Settings
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useMobileMenu } from '../contexts/MobileMenuContext'
import AuthModal from './AuthModal'


export default function Header() {
  const { isMenuOpen, setIsMenuOpen } = useMobileMenu()
  const [activeDropdown, setActiveDropdown] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('EN')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('register')
  
  const { user, logout } = useAuth()

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? '' : dropdown)
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
    { code: 'SI', name: 'සිංහල' },
    { code: 'TA', name: 'தமிழ்' },
    { code: 'FR', name: 'Français' },
    { code: 'DE', name: 'Deutsch' },
    { code: 'ES', name: 'Español' }
  ]

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ]

  const [featuredTours, setFeaturedTours] = useState<{ id: string, name: string, duration?: string }[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        // Use featured endpoint instead of fetching all tours
        const res = await fetch('/api/tours/featured', {
          next: { revalidate: 300 } // Cache for 5 minutes
        })
        const json = await res.json()
        if (json.success && json.data) {
          const items = (json.data || []).slice(0, 10).map((t: any) => ({ 
            id: t.id, 
            name: t.name, 
            duration: t.duration 
          }))
          setFeaturedTours(items)
        }
      } catch {
        // Silently fail - dropdown will just be empty
      }
    }
    load()
  }, [])

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
      <header className="sticky top-0 z-[100] transition-all duration-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-4">
                {/* Logo Image */}
                <div className="relative">
                  <Image
                    src="/logoisle&echo.png"
                    alt="ISLE & ECHO"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                {/* Logo Text */}
                <div className="hidden md:block">
                  <div className="text-[#1E3A8A] dark:text-blue-400 font-bold text-xl tracking-wide">ISLE & ECHO</div>
                  <div className="text-gray-600 dark:text-white text-xs font-light">Feel the Isle, Hear The Echo</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                item.name !== 'Tour Package' ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 font-medium relative group"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => toggleDropdown('tours')}
                      className="flex items-center space-x-1 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 font-medium"
                    >
                      <span>Tour Package</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeDropdown === 'tours' && (
                      <div className="absolute left-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 z-10 border border-white/20 dark:border-gray-700/20">
                        <Link
                          href="/tours"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-2 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                          onClick={() => setActiveDropdown('')}
                        >
                          All Tour Packages
                        </Link>
                        {featuredTours.map(t => (
                          <Link
                            key={t.id}
                            href={`/tours/${t.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-white transition-all duration-200 rounded-lg mx-2 hover:bg-gradient-to-r hover:from-[#4091FE] hover:to-[#187BFF]"
                            onClick={() => setActiveDropdown('')}
                          >
                            {t.name} {t.duration ? `– ${t.duration}` : ''}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ))}
            </nav>

                               {/* Desktop Utility Buttons */}
                   <div className="hidden lg:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('language')}
                  className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
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
                          setSelectedLanguage(language.code)
                          setActiveDropdown('')
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
                  onClick={() => toggleDropdown('currency')}
                  className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
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
                    onClick={() => toggleDropdown('user')}
                    className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-all duration-300 rounded-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {activeDropdown === 'user' && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl py-2 z-10 border border-white/20 dark:border-gray-700/20">
                      {user.role === 'admin' && (
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
                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm min-h-[44px] touch-manipulation"
                  >
                    Register
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 active:text-[#1E3A8A] transition-all duration-300 rounded-full p-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 backdrop-blur-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-t border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-3 text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] dark:hover:text-blue-400 active:text-[#1E3A8A] transition-all duration-300 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 font-medium min-h-[44px] flex items-center touch-manipulation"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                


                {/* Mobile Language & Currency */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between text-gray-800 dark:text-gray-200 text-sm font-medium">
                      <span>Language:</span>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
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
                      {user.role === 'admin' && (
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