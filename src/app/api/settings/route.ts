import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'
import { loadSeoStore, saveSeoStore, type SeoStore } from '@/lib/siteSeo'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json')

// Load settings from file (fallback)
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return null
}

// Save settings to file (fallback)
function saveSettings(settings: unknown) {
  try {
    const dir = path.dirname(SETTINGS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

function seoFromRecord(data: Record<string, unknown> = {}, extra: SeoStore = {}): SeoStore {
  const nested = (data.seo && typeof data.seo === 'object' ? data.seo : {}) as SeoStore
  return {
    seoTitle: extra.seoTitle || nested.seoTitle || '',
    seoDescription: extra.seoDescription || nested.seoDescription || '',
    seoKeywords: extra.seoKeywords || nested.seoKeywords || '',
    ogImageUrl: extra.ogImageUrl || nested.ogImageUrl || '',
    twitterHandle: extra.twitterHandle || nested.twitterHandle || '@isleandecho',
    googleAnalyticsId: extra.googleAnalyticsId || nested.googleAnalyticsId || '',
    googleTagManagerId: extra.googleTagManagerId || nested.googleTagManagerId || '',
    googleSearchConsoleId: extra.googleSearchConsoleId || nested.googleSearchConsoleId || '',
    googleSearchConsoleHtmlFile: extra.googleSearchConsoleHtmlFile || nested.googleSearchConsoleHtmlFile || '',
    googleSearchConsoleHtmlToken: extra.googleSearchConsoleHtmlToken || nested.googleSearchConsoleHtmlToken || '',
    facebookPixelId: extra.facebookPixelId || nested.facebookPixelId || '',
    googleAdsId: extra.googleAdsId || nested.googleAdsId || '',
    bingWebmasterId: extra.bingWebmasterId || nested.bingWebmasterId || '',
    yandexWebmasterId: extra.yandexWebmasterId || nested.yandexWebmasterId || '',
  }
}

function seoFromFrontend(data: Record<string, unknown>): SeoStore {
  return {
    seoTitle: String(data.seoTitle || ''),
    seoDescription: String(data.seoDescription || ''),
    seoKeywords: String(data.seoKeywords || ''),
    ogImageUrl: String(data.ogImageUrl || ''),
    twitterHandle: String(data.twitterHandle || ''),
    googleAnalyticsId: String(data.googleAnalyticsId || ''),
    googleTagManagerId: String(data.googleTagManagerId || ''),
    googleSearchConsoleId: String(data.googleSearchConsoleId || ''),
    googleSearchConsoleHtmlFile: String(data.googleSearchConsoleHtmlFile || ''),
    googleSearchConsoleHtmlToken: String(data.googleSearchConsoleHtmlToken || ''),
    facebookPixelId: String(data.facebookPixelId || ''),
    googleAdsId: String(data.googleAdsId || ''),
    bingWebmasterId: String(data.bingWebmasterId || ''),
    yandexWebmasterId: String(data.yandexWebmasterId || ''),
  }
}

// Map Supabase settings to frontend format
function mapSupabaseToFrontend(data: Record<string, unknown>, seoStore: SeoStore = {}) {
  const seo = seoFromRecord(data, seoStore)
  return {
    siteName: data.site_name || '',
    siteDescription: data.site_description || '',
    siteUrl: data.site_url || '',
    adminEmail: data.admin_email || '',
    timezone: data.timezone || '',
    language: data.language || '',
    contactEmail: data.contact_email || '',
    contactPhone: data.contact_phone || '',
    contactAddress: data.contact_address || '',
    businessHours: data.business_hours || '',
    smtpHost: data.smtp_host || '',
    smtpPort: data.smtp_port || '',
    smtpUsername: data.smtp_username || '',
    smtpPassword: data.smtp_password || '',
    fromEmail: data.from_email || '',
    fromName: data.from_name || '',
    emailNotifications: data.email_notifications ?? true,
    bookingNotifications: data.booking_notifications ?? true,
    paymentNotifications: data.payment_notifications ?? true,
    maintenanceNotifications: data.maintenance_notifications ?? false,
    sessionTimeout: data.session_timeout || 30,
    passwordMinLength: data.password_min_length || 8,
    requireTwoFactor: data.require_two_factor ?? false,
    allowedFileTypes: (data.allowed_file_types as string[]) || [],
    currency: data.currency || 'LKR',
    paymentMethods: Array.isArray(data.payment_methods) && data.payment_methods.length > 0
      ? (data.payment_methods as string[])
      : (data.payment_methods && !Array.isArray(data.payment_methods) 
          ? [data.payment_methods as string] 
          : ['payhere', 'credit_card', 'bank_transfer', 'cash']), // Default if empty
    taxRate: data.tax_rate || 15,
    bookingDeposit: data.booking_deposit || 50,
    payhereMerchantId: data.payhere_merchant_id || '',
    payhereMerchantSecret: data.payhere_merchant_secret || '',
    payhereSandbox: data.payhere_sandbox ?? true,
    payhereBaseUrl: data.payhere_base_url || 'http://localhost:3000',
    primaryColor: data.primary_color || '#3B82F6',
    secondaryColor: data.secondary_color || '#1E40AF',
    logoUrl: data.logo_url || '',
    faviconUrl: data.favicon_url || '',
    theme: data.theme || 'light',
    whatsappPhone: data.whatsapp_phone || '94741415812',
    ...seo,
  }
}

// Map frontend format to Supabase format
function mapFrontendToSupabase(data: Record<string, unknown>) {
  return {
    site_name: data.siteName,
    site_description: data.siteDescription,
    site_url: data.siteUrl,
    admin_email: data.adminEmail,
    timezone: data.timezone,
    language: data.language,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone,
    contact_address: data.contactAddress,
    business_hours: data.businessHours,
    smtp_host: data.smtpHost,
    smtp_port: data.smtpPort,
    smtp_username: data.smtpUsername,
    smtp_password: data.smtpPassword,
    from_email: data.fromEmail,
    from_name: data.fromName,
    email_notifications: data.emailNotifications ?? true,
    booking_notifications: data.bookingNotifications ?? true,
    payment_notifications: data.paymentNotifications ?? true,
    maintenance_notifications: data.maintenanceNotifications ?? false,
    session_timeout: data.sessionTimeout || 30,
    password_min_length: data.passwordMinLength || 8,
    require_two_factor: data.requireTwoFactor ?? false,
    allowed_file_types: data.allowedFileTypes || [],
    currency: data.currency || 'LKR',
    payment_methods: Array.isArray(data.paymentMethods) ? data.paymentMethods : (data.paymentMethods ? [data.paymentMethods] : []),
    tax_rate: data.taxRate || 15,
    booking_deposit: data.bookingDeposit || 50,
    payhere_merchant_id: data.payhereMerchantId || '',
    payhere_merchant_secret: data.payhereMerchantSecret || '',
    payhere_sandbox: data.payhereSandbox ?? true,
    payhere_base_url: data.payhereBaseUrl || 'http://localhost:3000',
    primary_color: data.primaryColor || '#3B82F6',
    secondary_color: data.secondaryColor || '#1E40AF',
    logo_url: data.logoUrl || '',
    favicon_url: data.faviconUrl || '',
    theme: data.theme || 'light',
    whatsapp_phone: data.whatsappPhone || '94741415812',
    seo: seoFromFrontend(data),
  }
}

// GET /api/settings - Get settings
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .eq('id', 'main')
        .single()

      if (error) {
        console.error('Supabase settings error:', error)
        // Fall through to file storage
      } else if (data) {
        console.log('Loaded payment methods from DB:', data.payment_methods)
        const seoStore = await loadSeoStore()
        const mappedSettings = mapSupabaseToFrontend(data, seoStore)
        console.log('Mapped payment methods:', mappedSettings.paymentMethods)
        return NextResponse.json({ success: true, data: mappedSettings })
      }
    }

    // Fallback to file storage
    const fileSettings = loadSettings()
    const seoStore = await loadSeoStore()
    if (fileSettings) {
      return NextResponse.json({ success: true, data: { ...fileSettings, ...seoFromRecord({}, seoStore), ...seoStore } })
    }

    // Return default settings
    const defaultSettings = mapSupabaseToFrontend({
      site_name: 'Isle & Echo Travel',
      site_description: 'Your gateway to Sri Lankan adventures',
      site_url: 'https://isleandecho.com',
      admin_email: 'admin@isleandecho.com',
      timezone: 'Asia/Colombo',
      language: 'en',
      payment_methods: ['payhere', 'credit_card', 'bank_transfer', 'cash']
    }, seoStore)

    return NextResponse.json({ success: true, data: defaultSettings })
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = body.settings || body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const isSupabaseConfigured = supabaseUrl && 
                                  supabaseKey && 
                                  supabaseUrl.includes('supabase.co') && 
                                  supabaseKey.length > 50

    if (isSupabaseConfigured) {
      const supabaseData = mapFrontendToSupabase(settings)
      
      // Ensure payment_methods is properly formatted as an array
      if (supabaseData.payment_methods && !Array.isArray(supabaseData.payment_methods)) {
        supabaseData.payment_methods = [supabaseData.payment_methods]
      }
      
      console.log('Saving payment methods:', supabaseData.payment_methods)

      const seoPatch = seoFromFrontend(settings)
      await saveSeoStore(seoPatch)
      
      let { data, error } = await supabaseAdmin
        .from('settings')
        .upsert({
          id: 'main',
          ...supabaseData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single()

      if (error && /seo/i.test(error.message || '')) {
        const { seo: _seoCol, ...withoutSeo } = supabaseData as Record<string, unknown> & { seo?: unknown }
        const retry = await supabaseAdmin
          .from('settings')
          .upsert({
            id: 'main',
            ...withoutSeo,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()
        data = retry.data
        error = retry.error
      }

      if (error) {
        console.error('Supabase update error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        // When Supabase is configured, return the real error so the client knows the update failed.
        return NextResponse.json(
          { success: false, error: `Settings update failed: ${error.message}` },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (data) {
        console.log('Settings saved successfully, payment methods:', data.payment_methods)
        const mappedSettings = mapSupabaseToFrontend(data, seoPatch)
        return NextResponse.json({ 
          success: true, 
          data: mappedSettings,
          message: 'Settings saved successfully' 
        })
      }
    }

    // Fallback to file storage
    if (saveSettings(settings)) {
      return NextResponse.json({ 
        success: true, 
        data: settings,
        message: 'Settings saved successfully' 
      })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

