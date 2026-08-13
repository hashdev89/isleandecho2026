import { cache } from 'react'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { loadAppJson, saveAppJson } from '@/lib/supabaseJsonStore'
import { loadSeoJson } from '@/lib/seoDataStore'
import fs from 'fs'
import path from 'path'

export type SeoStore = {
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  ogImageUrl?: string
  twitterHandle?: string
  googleAnalyticsId?: string
  googleTagManagerId?: string
  googleSearchConsoleId?: string
  googleSearchConsoleHtmlFile?: string
  googleSearchConsoleHtmlToken?: string
  facebookPixelId?: string
  googleAdsId?: string
  bingWebmasterId?: string
  yandexWebmasterId?: string
}

export type SiteSeo = {
  siteName: string
  siteDescription: string
  siteUrl: string
  seoTitle: string
  seoKeywords: string[]
  ogImageUrl: string
  faviconUrl: string
  logoUrl: string
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
  contactEmail: string
  contactPhone: string
  contactAddress: string
}

export type StoredPageMeta = {
  id?: string
  page: string
  title?: string
  description?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonical?: string
  robots?: string
}

const SEO_JSON_KEY = 'seo-settings.json'
const LOCAL_SEO_FILE = path.join(process.cwd(), 'data', 'seo', 'analytics.json')

export const DEFAULT_SEO_KEYWORDS = [
  'Sri Lanka tours',
  'Sri Lanka travel packages',
  'cultural heritage tours Sri Lanka',
  'beach holidays Sri Lanka',
  'adventure tours Sri Lanka',
  'tea plantation tours',
  'wildlife safaris Sri Lanka',
  'Ella train journey',
  'Sigiriya rock fortress',
  'Galle fort tours',
  'Yala national park',
  'Nuwara Eliya tours',
  'Kandy cultural tours',
  'ISLE & ECHO',
]

export const DEFAULT_SITE_SEO: SiteSeo = {
  siteName: 'ISLE & ECHO',
  siteDescription:
    'Discover the beauty of Sri Lanka with our curated tour packages and travel experiences. From cultural heritage to pristine beaches, explore the island paradise with ISLE & ECHO.',
  siteUrl: 'https://isleandecho.com',
  seoTitle: 'ISLE & ECHO - Feel the Isle, Hear The Echo',
  seoKeywords: DEFAULT_SEO_KEYWORDS,
  ogImageUrl: '/srilankabeach.jpg',
  faviconUrl: '/logoisle&echo.png',
  logoUrl: '/logoisle&echo.png',
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
  contactEmail: 'info@isleandecho.com',
  contactPhone: '+94 741 415 812',
  contactAddress: '55/A, Kulupana, Pokunuwita, Sri Lanka',
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(url && key && url.includes('supabase.co') && key.length > 50)
}

export function normalizeSiteUrl(url?: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_SEO.siteUrl
  const raw = (url || fallback || DEFAULT_SITE_SEO.siteUrl).trim()
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return parsed.origin.replace(/\/+$/, '')
  } catch {
    return DEFAULT_SITE_SEO.siteUrl
  }
}

export function parseKeywords(value?: string | string[] | null): string[] {
  if (Array.isArray(value)) {
    return value.map((k) => String(k).trim()).filter(Boolean)
  }
  if (!value) return []
  return String(value)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}

function readLocalSeoFile(): SeoStore {
  try {
    if (fs.existsSync(LOCAL_SEO_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_SEO_FILE, 'utf8')) as SeoStore
    }
  } catch (error) {
    console.error('Error reading local SEO file:', error)
  }
  return {}
}

function writeLocalSeoFile(store: SeoStore) {
  try {
    const dir = path.dirname(LOCAL_SEO_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(LOCAL_SEO_FILE, JSON.stringify(store, null, 2))
    return true
  } catch (error) {
    console.error('Error writing local SEO file:', error)
    return false
  }
}

function asSeoStore(raw: unknown): SeoStore {
  if (!raw || typeof raw !== 'object') return {}
  return raw as SeoStore
}

export async function loadSeoStore(): Promise<SeoStore> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabaseAdmin.from('settings').select('seo').eq('id', 'main').maybeSingle()
      if (!error && data && data.seo && typeof data.seo === 'object') {
        return asSeoStore(data.seo)
      }
    } catch (error) {
      console.error('loadSeoStore settings.seo:', error)
    }
    const fromStorage = await loadAppJson<SeoStore>(SEO_JSON_KEY)
    if (fromStorage) return fromStorage
  }
  return readLocalSeoFile()
}

export async function saveSeoStore(patch: Partial<SeoStore>): Promise<SeoStore> {
  const current = await loadSeoStore()
  const next: SeoStore = { ...current, ...patch }
  let saved = false

  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabaseAdmin.from('settings').select('id').eq('id', 'main').maybeSingle()
      const payload = {
        id: 'main',
        seo: next,
        updated_at: new Date().toISOString(),
      }
      const query = existing
        ? supabaseAdmin.from('settings').update({ seo: next, updated_at: payload.updated_at }).eq('id', 'main')
        : supabaseAdmin.from('settings').insert(payload)
      const { error } = await query
      if (!error) saved = true
      else console.error('saveSeoStore settings.seo:', error.message)
    } catch (error) {
      console.error('saveSeoStore settings.seo:', error)
    }
    const stored = await saveAppJson(SEO_JSON_KEY, next)
    if (stored) saved = true
  }

  if (!saved) writeLocalSeoFile(next)
  return next
}

function envFallback(store: SeoStore): SeoStore {
  return {
    googleAnalyticsId: store.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID || '',
    googleTagManagerId: store.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID || '',
    googleSearchConsoleId: store.googleSearchConsoleId || process.env.GOOGLE_SEARCH_CONSOLE_ID || '',
    facebookPixelId: store.facebookPixelId || process.env.FACEBOOK_PIXEL_ID || '',
    googleAdsId: store.googleAdsId || process.env.GOOGLE_ADS_ID || '',
    bingWebmasterId: store.bingWebmasterId || process.env.BING_WEBMASTER_ID || '',
    yandexWebmasterId: store.yandexWebmasterId || process.env.YANDEX_WEBMASTER_ID || '',
    googleSearchConsoleHtmlFile: store.googleSearchConsoleHtmlFile || '',
    googleSearchConsoleHtmlToken: store.googleSearchConsoleHtmlToken || '',
    seoTitle: store.seoTitle || '',
    seoDescription: store.seoDescription || '',
    seoKeywords: store.seoKeywords || '',
    ogImageUrl: store.ogImageUrl || '',
    twitterHandle: store.twitterHandle || '',
  }
}

export const getSiteSeo = cache(async (): Promise<SiteSeo> => {
  const store = envFallback(await loadSeoStore())
  let siteName = process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_SEO.siteName
  let siteDescription = DEFAULT_SITE_SEO.siteDescription
  let siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  let faviconUrl = DEFAULT_SITE_SEO.faviconUrl
  let logoUrl = DEFAULT_SITE_SEO.logoUrl
  let contactEmail = DEFAULT_SITE_SEO.contactEmail
  let contactPhone = DEFAULT_SITE_SEO.contactPhone
  let contactAddress = DEFAULT_SITE_SEO.contactAddress

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabaseAdmin.from('settings').select('*').eq('id', 'main').maybeSingle()
      if (data) {
        siteName = String(data.site_name || siteName)
        siteDescription = String(data.site_description || siteDescription)
        siteUrl = normalizeSiteUrl(String(data.site_url || siteUrl))
        faviconUrl = String(data.favicon_url || faviconUrl)
        logoUrl = String(data.logo_url || logoUrl)
        if (!faviconUrl || faviconUrl === '/favicon.ico') {
          faviconUrl = logoUrl || DEFAULT_SITE_SEO.faviconUrl
        }
        contactEmail = String(data.contact_email || contactEmail)
        contactPhone = String(data.contact_phone || contactPhone)
        contactAddress = String(data.contact_address || contactAddress)
      }
    } catch (error) {
      console.error('getSiteSeo settings:', error)
    }
  }

  const keywords = parseKeywords(store.seoKeywords)
  const twitter = (store.twitterHandle || DEFAULT_SITE_SEO.twitterHandle).trim()

  return {
    siteName,
    siteDescription,
    siteUrl,
    seoTitle: (store.seoTitle || `${siteName} - Feel the Isle, Hear The Echo`).trim(),
    seoKeywords: keywords.length ? keywords : DEFAULT_SEO_KEYWORDS,
    ogImageUrl: (store.ogImageUrl || logoUrl || DEFAULT_SITE_SEO.ogImageUrl).trim(),
    faviconUrl: faviconUrl || DEFAULT_SITE_SEO.faviconUrl,
    logoUrl: logoUrl || DEFAULT_SITE_SEO.logoUrl,
    twitterHandle: twitter.startsWith('@') ? twitter : `@${twitter.replace(/^@/, '')}`,
    googleAnalyticsId: (store.googleAnalyticsId || '').trim(),
    googleTagManagerId: (store.googleTagManagerId || '').trim(),
    googleSearchConsoleId: (store.googleSearchConsoleId || '').trim(),
    googleSearchConsoleHtmlFile: (store.googleSearchConsoleHtmlFile || '').trim(),
    googleSearchConsoleHtmlToken: (
      store.googleSearchConsoleHtmlToken ||
      store.googleSearchConsoleId ||
      ''
    ).trim(),
    facebookPixelId: (store.facebookPixelId || '').trim(),
    googleAdsId: (store.googleAdsId || '').trim(),
    bingWebmasterId: (store.bingWebmasterId || '').trim(),
    yandexWebmasterId: (store.yandexWebmasterId || '').trim(),
    contactEmail,
    contactPhone,
    contactAddress,
  }
})

export function absoluteUrl(siteUrl: string, pathOrUrl?: string | null): string {
  if (!pathOrUrl) return siteUrl
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${siteUrl}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function verificationMeta(seo: SiteSeo): Metadata['verification'] | undefined {
  const verification: NonNullable<Metadata['verification']> = {}
  if (seo.googleSearchConsoleId && !/^your-google/i.test(seo.googleSearchConsoleId)) {
    verification.google = seo.googleSearchConsoleId
  }
  if (seo.yandexWebmasterId && !/^your-yandex/i.test(seo.yandexWebmasterId)) {
    verification.yandex = seo.yandexWebmasterId
  }
  if (seo.bingWebmasterId && !/^your-/i.test(seo.bingWebmasterId)) {
    verification.other = { 'msvalidate.01': seo.bingWebmasterId }
  }
  return Object.keys(verification).length ? verification : undefined
}

export function buildRootMetadata(seo: SiteSeo): Metadata {
  const ogImage = absoluteUrl(seo.siteUrl, seo.ogImageUrl)
  return {
    metadataBase: new URL(seo.siteUrl),
    title: {
      default: seo.seoTitle,
      template: `%s | ${seo.siteName}`,
    },
    description: seo.siteDescription,
    keywords: seo.seoKeywords,
    authors: [{ name: seo.siteName }],
    creator: seo.siteName,
    publisher: seo.siteName,
    applicationName: seo.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: seo.faviconUrl || seo.logoUrl || '/logoisle&echo.png', type: 'image/png' },
        { url: '/favicon.png', type: 'image/png' },
      ],
      shortcut: seo.faviconUrl || seo.logoUrl || '/logoisle&echo.png',
      apple: seo.logoUrl || seo.faviconUrl || '/logoisle&echo.png',
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: seo.siteUrl,
      siteName: seo.siteName,
      title: seo.seoTitle,
      description: seo.siteDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: seo.seoTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.seoTitle,
      description: seo.siteDescription,
      images: [ogImage],
      creator: seo.twitterHandle,
    },
    verification: verificationMeta(seo),
    alternates: {
      canonical: seo.siteUrl,
    },
    category: 'Travel & Tourism',
  }
}

export function buildPageMetadata(
  seo: SiteSeo,
  opts: {
    title?: string
    description?: string
    path?: string
    image?: string
    keywords?: string[]
    robots?: string
    canonical?: string
  } = {}
): Metadata {
  const title = (opts.title || seo.seoTitle).trim()
  const description = (opts.description || seo.siteDescription).trim()
  const canonical = opts.canonical || (opts.path ? absoluteUrl(seo.siteUrl, opts.path) : seo.siteUrl)
  const image = absoluteUrl(seo.siteUrl, opts.image || seo.ogImageUrl)
  const robotsValue = opts.robots || 'index,follow'
  const noindex = /noindex/i.test(robotsValue)

  return {
    title,
    description,
    keywords: opts.keywords?.length ? opts.keywords : seo.seoKeywords,
    robots: {
      index: !noindex,
      follow: !/nofollow/i.test(robotsValue),
    },
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical,
      siteName: seo.siteName,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: seo.twitterHandle,
    },
  }
}

function normalizePageKey(page: string) {
  return page.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function getStoredPageMeta(pageKey: string): Promise<StoredPageMeta | null> {
  const key = normalizePageKey(pageKey)
  try {
    const list = await loadSeoJson<StoredPageMeta[]>('meta-tags.json', [])
    return (
      list.find((item) => normalizePageKey(String(item.page || '')) === key) ||
      list.find((item) => normalizePageKey(String(item.page || '')) === key.replace(/^\//, '')) ||
      null
    )
  } catch (error) {
    console.error('getStoredPageMeta:', error)
    return null
  }
}

export async function buildRouteMetadata(pageKey: string, path: string, fallbackTitle?: string, fallbackDescription?: string) {
  const seo = await getSiteSeo()
  const stored = await getStoredPageMeta(pageKey)
  return buildPageMetadata(seo, {
    title: stored?.title || fallbackTitle,
    description: stored?.description || fallbackDescription,
    path,
    image: stored?.ogImage,
    keywords: stored?.keywords,
    robots: stored?.robots,
    canonical: stored?.canonical,
  })
}

export function organizationJsonLd(seo: SiteSeo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: seo.siteName,
    description: seo.siteDescription,
    url: seo.siteUrl,
    logo: absoluteUrl(seo.siteUrl, seo.logoUrl),
    image: absoluteUrl(seo.siteUrl, seo.ogImageUrl),
    email: seo.contactEmail,
    telephone: seo.contactPhone,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: seo.contactPhone,
      email: seo.contactEmail,
      contactType: 'customer service',
      areaServed: 'LK',
      availableLanguage: ['English', 'Sinhala', 'Tamil'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: seo.contactAddress,
      addressCountry: 'LK',
    },
    sameAs: [
      'https://www.facebook.com/isleandecho',
      'https://www.instagram.com/isleandecho',
      'https://www.twitter.com/isleandecho',
    ],
  }
}

export function websiteJsonLd(seo: SiteSeo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seo.siteName,
    url: seo.siteUrl,
    description: seo.siteDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${seo.siteUrl}/tours?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function googleVerificationFileName(seo: SiteSeo): string {
  const raw = (seo.googleSearchConsoleHtmlFile || '').trim()
  if (!raw) return ''
  const base = raw.replace(/^\/+/, '')
  return base.toLowerCase().endsWith('.html') ? base : `${base}.html`
}
