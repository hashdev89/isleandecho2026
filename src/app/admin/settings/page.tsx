'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Phone,
  CheckCircle,
  Info,
  Search,
  ExternalLink
} from 'lucide-react'

interface SettingsData {
  // General Settings
  siteName: string
  siteDescription: string
  siteUrl: string
  adminEmail: string
  timezone: string
  language: string
  
  // Contact Information
  contactEmail: string
  contactPhone: string
  contactAddress: string
  businessHours: string
  whatsappPhone: string
  
  // Email Settings
  smtpHost: string
  smtpPort: string
  smtpUsername: string
  smtpPassword: string
  fromEmail: string
  fromName: string
  
  // Notification Settings
  emailNotifications: boolean
  bookingNotifications: boolean
  paymentNotifications: boolean
  maintenanceNotifications: boolean
  
  // Security Settings
  sessionTimeout: number
  passwordMinLength: number
  requireTwoFactor: boolean
  allowedFileTypes: string[]
  
  // Payment Settings
  currency: string
  paymentMethods: string[]
  taxRate: number
  bookingDeposit: number
  // PayHere Settings
  payhereMerchantId: string
  payhereMerchantSecret: string
  payhereSandbox: boolean
  payhereBaseUrl: string
  
  // Appearance Settings
  primaryColor: string
  secondaryColor: string
  logoUrl: string
  faviconUrl: string
  theme: string

  // SEO & Google
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  ogImageUrl: string
  twitterHandle: string
  googleAnalyticsId: string
  googleTagManagerId: string
  googleSearchConsoleId: string
  googleSearchConsoleHtmlFile: string
  googleSearchConsoleHtmlToken: string
  facebookPixelId: string
  googleAdsId: string
  bingWebmasterId: string
  yandexWebmasterId: string
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Default settings
  const defaultSettings: SettingsData = {
    // General Settings
    siteName: 'Isle & Echo Travel',
    siteDescription: 'Your gateway to Sri Lankan adventures',
    siteUrl: 'https://isleandecho.com',
    adminEmail: 'admin@isleandecho.com',
    timezone: 'Asia/Colombo',
    language: 'en',
    
    // Contact Information
    contactEmail: 'info@isleandecho.com',
    contactPhone: '+94 11 234 5678',
    contactAddress: '123 Galle Road, Colombo 03, Sri Lanka',
    businessHours: 'Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM',
    whatsappPhone: '94741415812',
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@isleandecho.com',
    fromName: 'Isle & Echo Travel',
    
    // Notification Settings
    emailNotifications: true,
    bookingNotifications: true,
    paymentNotifications: true,
    maintenanceNotifications: false,
    
    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    
    // Payment Settings
    currency: 'LKR',
    paymentMethods: ['payhere', 'credit_card', 'bank_transfer', 'cash'],
    taxRate: 15,
    bookingDeposit: 50,
    // PayHere Settings
    payhereMerchantId: '',
    payhereMerchantSecret: '',
    payhereSandbox: true,
    payhereBaseUrl: 'http://localhost:3000',
    
    // Appearance Settings
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    logoUrl: '/logoisle&echo.png',
    faviconUrl: '/logoisle&echo.png',
    theme: 'light',

    seoTitle: 'ISLE & ECHO - Feel the Isle, Hear The Echo',
    seoDescription: 'Discover the beauty of Sri Lanka with our curated tour packages and travel experiences.',
    seoKeywords: 'Sri Lanka tours, Sri Lanka travel packages, ISLE & ECHO',
    ogImageUrl: '/srilankabeach.jpg',
    twitterHandle: '@isleandecho',
    googleAnalyticsId: '',
    googleTagManagerId: '',
    googleSearchConsoleId: '',
    googleSearchConsoleHtmlFile: '',
    googleSearchConsoleHtmlToken: '',
    facebookPixelId: '',
    googleAdsId: '',
    bingWebmasterId: '',
    yandexWebmasterId: '',
  }
  
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true)
        const response = await fetch('/api/settings')
        const result = await response.json()
        
        if (result.success && result.data) {
          // Ensure paymentMethods is always an array
          let paymentMethods = Array.isArray(result.data.paymentMethods) 
            ? result.data.paymentMethods 
            : (result.data.paymentMethods ? [result.data.paymentMethods] : [])
          
          // If paymentMethods is empty, use defaults
          if (paymentMethods.length === 0) {
            paymentMethods = defaultSettings.paymentMethods
          }
          
          console.log('Loaded payment methods:', paymentMethods)
          
          // Normalize all settings to ensure no null values
          const loadedSettings: SettingsData = {
            ...defaultSettings,
            ...result.data,
            // Ensure all string fields are never null
            siteName: result.data.siteName || defaultSettings.siteName,
            siteDescription: result.data.siteDescription || defaultSettings.siteDescription,
            siteUrl: result.data.siteUrl || defaultSettings.siteUrl,
            adminEmail: result.data.adminEmail || defaultSettings.adminEmail,
            timezone: result.data.timezone || defaultSettings.timezone,
            language: result.data.language || defaultSettings.language,
            contactEmail: result.data.contactEmail || defaultSettings.contactEmail,
            contactPhone: result.data.contactPhone || defaultSettings.contactPhone,
            contactAddress: result.data.contactAddress || defaultSettings.contactAddress,
            businessHours: result.data.businessHours || defaultSettings.businessHours,
            whatsappPhone: result.data.whatsappPhone || defaultSettings.whatsappPhone,
            smtpHost: result.data.smtpHost || defaultSettings.smtpHost,
            smtpPort: result.data.smtpPort || defaultSettings.smtpPort,
            smtpUsername: result.data.smtpUsername || defaultSettings.smtpUsername,
            smtpPassword: result.data.smtpPassword || defaultSettings.smtpPassword,
            fromEmail: result.data.fromEmail || defaultSettings.fromEmail,
            fromName: result.data.fromName || defaultSettings.fromName,
            currency: result.data.currency || defaultSettings.currency,
            payhereMerchantId: result.data.payhereMerchantId || defaultSettings.payhereMerchantId,
            payhereMerchantSecret: result.data.payhereMerchantSecret || defaultSettings.payhereMerchantSecret,
            payhereBaseUrl: result.data.payhereBaseUrl || defaultSettings.payhereBaseUrl,
            primaryColor: result.data.primaryColor || defaultSettings.primaryColor,
            secondaryColor: result.data.secondaryColor || defaultSettings.secondaryColor,
            logoUrl: result.data.logoUrl || defaultSettings.logoUrl,
            faviconUrl: result.data.faviconUrl || defaultSettings.faviconUrl,
            theme: result.data.theme || defaultSettings.theme,
            seoTitle: result.data.seoTitle || defaultSettings.seoTitle,
            seoDescription: result.data.seoDescription || defaultSettings.seoDescription,
            seoKeywords: result.data.seoKeywords || defaultSettings.seoKeywords,
            ogImageUrl: result.data.ogImageUrl || defaultSettings.ogImageUrl,
            twitterHandle: result.data.twitterHandle || defaultSettings.twitterHandle,
            googleAnalyticsId: result.data.googleAnalyticsId || defaultSettings.googleAnalyticsId,
            googleTagManagerId: result.data.googleTagManagerId || defaultSettings.googleTagManagerId,
            googleSearchConsoleId: result.data.googleSearchConsoleId || defaultSettings.googleSearchConsoleId,
            googleSearchConsoleHtmlFile: result.data.googleSearchConsoleHtmlFile || defaultSettings.googleSearchConsoleHtmlFile,
            googleSearchConsoleHtmlToken: result.data.googleSearchConsoleHtmlToken || defaultSettings.googleSearchConsoleHtmlToken,
            facebookPixelId: result.data.facebookPixelId || defaultSettings.facebookPixelId,
            googleAdsId: result.data.googleAdsId || defaultSettings.googleAdsId,
            bingWebmasterId: result.data.bingWebmasterId || defaultSettings.bingWebmasterId,
            yandexWebmasterId: result.data.yandexWebmasterId || defaultSettings.yandexWebmasterId,
            paymentMethods: paymentMethods,
            // Ensure number fields are never null
            sessionTimeout: result.data.sessionTimeout ?? defaultSettings.sessionTimeout,
            passwordMinLength: result.data.passwordMinLength ?? defaultSettings.passwordMinLength,
            taxRate: result.data.taxRate ?? defaultSettings.taxRate,
            bookingDeposit: result.data.bookingDeposit ?? defaultSettings.bookingDeposit,
            // Ensure boolean fields are never null
            emailNotifications: result.data.emailNotifications ?? defaultSettings.emailNotifications,
            bookingNotifications: result.data.bookingNotifications ?? defaultSettings.bookingNotifications,
            paymentNotifications: result.data.paymentNotifications ?? defaultSettings.paymentNotifications,
            maintenanceNotifications: result.data.maintenanceNotifications ?? defaultSettings.maintenanceNotifications,
            requireTwoFactor: result.data.requireTwoFactor ?? defaultSettings.requireTwoFactor,
            payhereSandbox: result.data.payhereSandbox ?? defaultSettings.payhereSandbox,
            // Ensure array fields are never null
            allowedFileTypes: Array.isArray(result.data.allowedFileTypes) ? result.data.allowedFileTypes : defaultSettings.allowedFileTypes
          }
          setSettings(loadedSettings)
        } else {
          // If no data loaded, use defaults
          console.log('No settings data, using defaults')
          setSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoadingSettings(false)
      }
    }
    
    loadSettings()
  }, [])

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'seo', label: 'SEO & Google', icon: Search }
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      // Ensure paymentMethods is always an array
      const paymentMethodsToSave = Array.isArray(settings.paymentMethods) 
        ? settings.paymentMethods 
        : (settings.paymentMethods ? [settings.paymentMethods] : [])
      
      console.log('Saving payment methods:', paymentMethodsToSave)
      
      const settingsToSave = {
        ...settings,
        paymentMethods: paymentMethodsToSave
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToSave }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Save successful, reloading settings...')
        // Reload settings from server to ensure consistency
        const reloadResponse = await fetch('/api/settings')
        const reloadResult = await reloadResponse.json()
        
        if (reloadResult.success && reloadResult.data) {
          // Ensure paymentMethods is always an array when reloading
          let paymentMethods = Array.isArray(reloadResult.data.paymentMethods) 
            ? reloadResult.data.paymentMethods 
            : (reloadResult.data.paymentMethods ? [reloadResult.data.paymentMethods] : [])
          
          console.log('Reloaded payment methods:', paymentMethods)
          
          const reloadedSettings = {
            ...reloadResult.data,
            paymentMethods: paymentMethods
          }
          setSettings(reloadedSettings)
        }
        
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        console.error('Save failed:', result.error)
        alert(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(defaultSettings)
    }
  }

  const updateSetting = (key: keyof SettingsData, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => updateSetting('siteName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site URL</label>
          <input
            type="url"
            value={settings.siteUrl}
            onChange={(e) => updateSetting('siteUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => updateSetting('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
          <input
            type="email"
            value={settings.adminEmail}
            onChange={(e) => updateSetting('adminEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => updateSetting('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Asia/Colombo">Asia/Colombo</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <select
          value={settings.language}
          onChange={(e) => updateSetting('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="en">English</option>
          <option value="si">Sinhala</option>
          <option value="ta">Tamil</option>
        </select>
      </div>
    </div>
  )

  const renderContactSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => updateSetting('contactEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
          <input
            type="tel"
            value={settings.contactPhone}
            onChange={(e) => updateSetting('contactPhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
        <textarea
          value={settings.contactAddress}
          onChange={(e) => updateSetting('contactAddress', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
        <input
          type="text"
          value={settings.businessHours}
          onChange={(e) => updateSetting('businessHours', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Mon-Fri: 9:00 AM - 6:00 PM"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Phone Number</label>
        <input
          type="text"
          value={settings.whatsappPhone}
          onChange={(e) => updateSetting('whatsappPhone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 94741415812 (country code + number without + or spaces)"
        />
        <p className="mt-1 text-xs text-gray-500">Format: country code + number (e.g., 94741415812 for +94 741 415 812)</p>
      </div>
    </div>
  )

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
          <p className="text-sm text-blue-800 font-medium">How to set up SMTP for sending emails</p>
        </div>
        <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 ml-7">
          <li>Fill in the fields below and click Save. Settings are stored in the database and used for all outgoing emails (invoices, booking confirmations).</li>
          <li>Or use environment variables: <code className="bg-blue-100 px-1 rounded">SMTP_HOST</code>, <code className="bg-blue-100 px-1 rounded">SMTP_PORT</code>, <code className="bg-blue-100 px-1 rounded">SMTP_USERNAME</code>, <code className="bg-blue-100 px-1 rounded">SMTP_PASSWORD</code>, <code className="bg-blue-100 px-1 rounded">FROM_EMAIL</code>, <code className="bg-blue-100 px-1 rounded">FROM_NAME</code>. Env is used only if no SMTP host/username is set here.</li>
          <li>Port 587 = TLS (recommended), 465 = SSL. Gmail: use <code className="bg-blue-100 px-1 rounded">smtp.gmail.com</code> and port 587; enable &quot;App passwords&quot; in your Google account and use that as SMTP Password, not your normal password.</li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
          <input
            type="text"
            value={settings.smtpHost}
            onChange={(e) => updateSetting('smtpHost', e.target.value)}
            placeholder="e.g. smtp.gmail.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
          <input
            type="number"
            value={settings.smtpPort}
            onChange={(e) => updateSetting('smtpPort', e.target.value)}
            placeholder="587 or 465"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">587 (TLS) or 465 (SSL)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
          <input
            type="text"
            value={settings.smtpUsername}
            onChange={(e) => updateSetting('smtpUsername', e.target.value)}
            placeholder="Usually your full email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
          <input
            type="password"
            value={settings.smtpPassword}
            onChange={(e) => updateSetting('smtpPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">For Gmail: use an App Password, not your account password.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
          <input
            type="email"
            value={settings.fromEmail}
            onChange={(e) => updateSetting('fromEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
          <input
            type="text"
            value={settings.fromName}
            onChange={(e) => updateSetting('fromName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-600">Enable email notifications for admin activities</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Booking Notifications</h4>
            <p className="text-sm text-gray-600">Get notified when new bookings are made</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.bookingNotifications}
              onChange={(e) => updateSetting('bookingNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Payment Notifications</h4>
            <p className="text-sm text-gray-600">Get notified when payments are received</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentNotifications}
              onChange={(e) => updateSetting('paymentNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Maintenance Notifications</h4>
            <p className="text-sm text-gray-600">Get notified about system maintenance</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceNotifications}
              onChange={(e) => updateSetting('maintenanceNotifications', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
          <input
            type="number"
            value={settings.passwordMinLength}
            onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireTwoFactor}
            onChange={(e) => updateSetting('requireTwoFactor', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
        <div className="flex flex-wrap gap-2">
          {settings.allowedFileTypes.map((type, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {type}
              <button
                onClick={() => {
                  const newTypes = settings.allowedFileTypes.filter((_, i) => i !== index)
                  updateSetting('allowedFileTypes', newTypes)
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add file type (e.g., pdf)"
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const newType = e.currentTarget.value.trim().toLowerCase()
              if (newType && !settings.allowedFileTypes.includes(newType)) {
                updateSetting('allowedFileTypes', [...settings.allowedFileTypes, newType])
                e.currentTarget.value = ''
              }
            }
          }}
        />
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-8">
      {/* PayHere Configuration */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">PayHere Payment Gateway</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">PayHere Integration</p>
              <p>Configure your PayHere merchant credentials. Get your Merchant ID and Merchant Secret from your PayHere account dashboard.</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant ID
              </label>
              <input
                type="text"
                value={settings.payhereMerchantId}
                onChange={(e) => updateSetting('payhereMerchantId', e.target.value)}
                placeholder="e.g., 121XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Found in PayHere Dashboard &gt; Integrations</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant Secret
              </label>
              <input
                type="password"
                value={settings.payhereMerchantSecret}
                onChange={(e) => updateSetting('payhereMerchantSecret', e.target.value)}
                placeholder="Enter your merchant secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Generated for your domain in PayHere Dashboard</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL for Callbacks
              </label>
              <input
                type="url"
                value={settings.payhereBaseUrl}
                onChange={(e) => updateSetting('payhereBaseUrl', e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Must be publicly accessible (not localhost for production)</p>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Sandbox Mode</h4>
                <p className="text-sm text-gray-600">Use PayHere sandbox for testing</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payhereSandbox}
                  onChange={(e) => updateSetting('payhereSandbox', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* General Payment Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Payment Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="LKR">LKR (Sri Lankan Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Booking Deposit (%)</label>
          <input
            type="number"
            value={settings.bookingDeposit}
            onChange={(e) => updateSetting('bookingDeposit', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Payment Methods</label>
          <div className="space-y-2 mt-2">
            {['payhere', 'credit_card', 'bank_transfer', 'cash', 'paypal', 'stripe'].map((method) => {
              const isChecked = Array.isArray(settings.paymentMethods) && settings.paymentMethods.includes(method)
              return (
                <label key={method} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const currentMethods = Array.isArray(settings.paymentMethods) ? settings.paymentMethods : []
                      if (e.target.checked) {
                        if (!currentMethods.includes(method)) {
                          const newMethods = [...currentMethods, method]
                          console.log('Adding payment method:', method, 'New array:', newMethods)
                          updateSetting('paymentMethods', newMethods)
                        }
                      } else {
                        const newMethods = currentMethods.filter(m => m !== method)
                        console.log('Removing payment method:', method, 'New array:', newMethods)
                        updateSetting('paymentMethods', newMethods)
                      }
                    }}
                    className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="capitalize text-sm text-gray-700">
                    {method === 'payhere' ? 'PayHere' : method.replace('_', ' ')}
                  </span>
                  {method === 'payhere' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Recommended
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => updateSetting('primaryColor', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={settings.primaryColor}
              onChange={(e) => updateSetting('primaryColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => updateSetting('secondaryColor', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={settings.secondaryColor}
              onChange={(e) => updateSetting('secondaryColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
          <input
            type="url"
            value={settings.logoUrl}
            onChange={(e) => updateSetting('logoUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
          <input
            type="url"
            value={settings.faviconUrl}
            onChange={(e) => updateSetting('faviconUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => updateSetting('theme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>
    </div>
  )

  const renderSeoSettings = () => (
    <div className="space-y-8">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">Google Search Console setup</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Open <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Search Console</a> and add your site URL ({settings.siteUrl || 'https://isleandecho.com'}).</li>
          <li>Choose <strong>HTML tag</strong> verification and paste the content value (not the full meta tag) below.</li>
          <li>Or choose <strong>HTML file</strong> and enter the filename Google gives you, e.g. <code>google1234567890.html</code>.</li>
          <li>Save settings, then click Verify in Search Console. Submit <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="underline">/sitemap.xml</a>.</li>
        </ol>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Default page SEO</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SEO title</label>
          <input
            type="text"
            value={settings.seoTitle}
            onChange={(e) => updateSetting('seoTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ISLE & ECHO - Feel the Isle, Hear The Echo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meta description</label>
          <textarea
            value={settings.seoDescription}
            onChange={(e) => updateSetting('seoDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Discover Sri Lanka tours and travel experiences..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
          <input
            type="text"
            value={settings.seoKeywords}
            onChange={(e) => updateSetting('seoKeywords', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Sri Lanka tours, beach holidays, ISLE & ECHO"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Open Graph image URL</label>
            <input
              type="text"
              value={settings.ogImageUrl}
              onChange={(e) => updateSetting('ogImageUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/srilankabeach.jpg or https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Twitter / X handle</label>
            <input
              type="text"
              value={settings.twitterHandle}
              onChange={(e) => updateSetting('twitterHandle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="@isleandecho"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Google Search Console</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verification code (HTML tag)</label>
          <input
            type="text"
            value={settings.googleSearchConsoleId}
            onChange={(e) => updateSetting('googleSearchConsoleId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste google-site-verification content only"
          />
          <p className="mt-1 text-xs text-gray-500">
            From a tag like <code>&lt;meta name=&quot;google-site-verification&quot; content=&quot;ABC123&quot; /&gt;</code>, enter <strong>ABC123</strong> only.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification HTML filename</label>
            <input
              type="text"
              value={settings.googleSearchConsoleHtmlFile}
              onChange={(e) => updateSetting('googleSearchConsoleHtmlFile', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="google1234567890.html"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML file token (optional)</label>
            <input
              type="text"
              value={settings.googleSearchConsoleHtmlToken}
              onChange={(e) => updateSetting('googleSearchConsoleHtmlToken', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Defaults to verification code"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Analytics & ads</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Tag Manager ID</label>
            <input
              type="text"
              value={settings.googleTagManagerId}
              onChange={(e) => updateSetting('googleTagManagerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads ID</label>
            <input
              type="text"
              value={settings.googleAdsId}
              onChange={(e) => updateSetting('googleAdsId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="AW-XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Pixel ID</label>
            <input
              type="text"
              value={settings.facebookPixelId}
              onChange={(e) => updateSetting('facebookPixelId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123456789012345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bing Webmaster</label>
            <input
              type="text"
              value={settings.bingWebmasterId}
              onChange={(e) => updateSetting('bingWebmasterId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="msvalidate.01 code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yandex Webmaster</label>
            <input
              type="text"
              value={settings.yandexWebmasterId}
              onChange={(e) => updateSetting('yandexWebmasterId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="yandex-verification code"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ExternalLink className="h-4 w-4 mr-1" /> Sitemap
        </a>
        <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ExternalLink className="h-4 w-4 mr-1" /> Robots.txt
        </a>
        <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ExternalLink className="h-4 w-4 mr-1" /> Google Search Console
        </a>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'contact':
        return renderContactSettings()
      case 'email':
        return renderEmailSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'security':
        return renderSecuritySettings()
      case 'payments':
        return renderPaymentSettings()
      case 'appearance':
        return renderAppearanceSettings()
      case 'seo':
        return renderSeoSettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Settings className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your application settings and preferences</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading settings...</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  )
}
