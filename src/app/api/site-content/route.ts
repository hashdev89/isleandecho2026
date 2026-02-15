import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'

const SITE_CONTENT_FILE = path.join(process.cwd(), 'data', 'site-content.json')
const SITE_CONTENT_BUCKET = 'site-content'
const SITE_CONTENT_KEY = 'content.json'

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function loadFromSupabase(): Promise<Record<string, unknown> | null> {
  if (!hasSupabase) return null
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SITE_CONTENT_BUCKET)
      .download(SITE_CONTENT_KEY)
    if (error || !data) return null
    const text = await data.text()
    return JSON.parse(text) as Record<string, unknown>
  } catch (e) {
    console.error('Site content load from Supabase:', e)
    return null
  }
}

async function saveToSupabase(content: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabase) return { ok: false, error: 'Supabase not configured' }
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === SITE_CONTENT_BUCKET)
    if (!bucketExists) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(
        SITE_CONTENT_BUCKET,
        { public: false, allowedMimeTypes: ['application/json'], fileSizeLimit: '5MB' }
      )
      if (createErr) {
        console.error('Site content bucket create:', createErr)
        return { ok: false, error: createErr.message }
      }
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(SITE_CONTENT_BUCKET)
      .upload(SITE_CONTENT_KEY, blob, { contentType: 'application/json', upsert: true })
    if (uploadErr) {
      console.error('Site content upload:', uploadErr)
      return { ok: false, error: uploadErr.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Site content save to Supabase:', e)
    return { ok: false, error: msg }
  }
}

function ensureDataDir() {
  const dir = path.dirname(SITE_CONTENT_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadSiteContentFromFile(): Record<string, unknown> | null {
  try {
    if (fs.existsSync(SITE_CONTENT_FILE)) {
      const raw = fs.readFileSync(SITE_CONTENT_FILE, 'utf8')
      return JSON.parse(raw) as Record<string, unknown>
    }
  } catch (e) {
    console.error('Error loading site content from file:', e)
  }
  return null
}

function saveSiteContentToFile(data: Record<string, unknown>): boolean {
  try {
    ensureDataDir()
    fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (e) {
    console.error('Error saving site content to file:', e)
    return false
  }
}

const defaults: Record<string, unknown> = {
  hero: {
    badgeText: 'Top Rated Travel Agency',
    headline: 'Discover the Magic of',
    headlineHighlight: 'Sri Lanka',
    subtitle: 'Experience breathtaking landscapes, rich culture, and unforgettable adventures with our expertly crafted tour packages.',
    ctaPrimaryText: 'Explore Tours',
    ctaPrimaryUrl: '/tours',
 
    videoUrl: 'https://www.youtube.com/embed/y5bHGWAE50c?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&start=0&cc_load_policy=0&playsinline=1&enablejsapi=1',
  },
  searchTabs: [
    { id: 'tours', label: 'Tours' },
    { id: 'plan-trip', label: 'Plan Your Trip' },
    { id: 'rent-car', label: 'Rent a Car' },
  ],
  featuredTours: {
    title: 'Featured Tour Packages',
    subtitle: '',
  },
  stats: [
    { number: '500+', label: 'Happy Travelers' },
    { number: '50+', label: 'Tour Packages' },
    { number: '4.9', label: 'Average Rating' },
    { number: '24/7', label: 'Customer Support' },
  ],
  sriLankaBanner: {
    title: 'Sri Lanka',
    subtitle: 'Mystic Isle of Echoes',
    backgroundImage: '',
  },
  features: {
    sectionTitle: 'Why Choose ISLE & ECHO?',
    sectionSubtitle: 'We provide exceptional travel experiences with unmatched service and attention to detail.',
    items: [
      { title: 'Safe & Secure Travel', description: 'Your safety is our priority with comprehensive travel insurance and 24/7 support.', color: 'text-blue-600' },
      { title: 'Flexible Scheduling', description: 'Customize your itinerary with flexible dates and personalized experiences.', color: 'text-green-600' },
      { title: 'Expert Guides', description: 'Professional local guides with deep knowledge of Sri Lankan culture and history.', color: 'text-purple-600' },
      { title: 'Memorable Experiences', description: 'Create unforgettable memories with our carefully curated tour experiences.', color: 'text-orange-600' },
    ],
  },
  solutions: {
    sectionTitle: 'Discover Sri Lanka',
    sectionSubtitle: 'From ancient temples to pristine beaches, explore the diverse beauty of Sri Lanka.',
    items: [
      { title: 'Cultural Heritage Tours', description: 'Explore ancient temples, UNESCO World Heritage sites, and rich cultural traditions.', image: '', highlights: ['Sigiriya Rock Fortress', 'Temple of the Tooth', 'Ancient Cities'] },
      { title: 'Wildlife Safari Adventures', description: "Discover Sri Lanka's incredible biodiversity with expert-guided wildlife safaris.", image: '', highlights: ['Yala National Park', 'Elephant Watching', 'Bird Watching'] },
      { title: 'Beach & Coastal Escapes', description: "Relax on pristine beaches and enjoy water sports along Sri Lanka's beautiful coastline.", image: '', highlights: ['Mirissa Beach', 'Whale Watching', 'Water Sports'] },
    ],
  },
  destinationsSection: {
    title: "Discover Sri Lanka's Destinations",
    subtitle: 'Explore the diverse beauty of Sri Lanka with our curated list of destinations and activities.',
  },
  cta: {
    title: 'Ready to Start Your Sri Lankan Adventure?',
    subtitle: 'Let us help you create unforgettable memories with our expertly crafted tour packages.',
    primaryButtonText: 'Get Started Today',
    primaryButtonUrl: '/tours',
    secondaryButtonText: 'Contact Us',
    secondaryButtonUrl: '/contact',
  },
  about: {
    title: 'About Us',
    description: '',
    image: '',
  },
  contact: {
    title: 'Contact Us',
    description: '',
    email: 'info@isleandecho.com',
    phone: '+94 741 415 812',
    address: 'Sri Lanka',
  },
  footer: {
    newsletterTitle: 'Your Travel Journey Starts Here',
    newsletterSubtitle: "Sign up and we'll send the best deals to you",
    newsletterButtonText: 'Subscribe',
    contactHeading: 'Contact Us',
    contactPhone: '+94 741 415 812',
    contactEmail: 'info@isleandecho.com',
    companyHeading: 'Company',
    companyLinks: [
      { label: 'About Us', url: '/about' },
      { label: 'Careers', url: '#' },
      { label: 'Blog', url: '/blog' },
      { label: 'Press', url: '#' },
      { label: 'Gift Cards', url: '#' },
    ],
    supportHeading: 'Support',
    supportLinks: [
      { label: 'Contact', url: '/contact' },
      { label: 'Legal Notice', url: '#' },
      { label: 'Privacy Policy', url: '#' },
      { label: 'Terms and Conditions', url: '#' },
      { label: 'Sitemap', url: '/sitemap.xml' },
    ],
    otherServicesHeading: 'Other Services',
    otherServicesLinks: [
      { label: 'Car Hire', url: '#' },
      { label: 'Activity Finder', url: '#' },
      { label: 'Tour List', url: '/tours' },
      { label: 'Flight Finder', url: '#' },
      { label: 'Cruise Ticket', url: '#' },
      { label: 'Holiday Rental', url: '#' },
      { label: 'Travel Agents', url: '#' },
    ],
    mobileHeading: 'Mobile',
    copyrightText: '© 2024 by ISLE & ECHO. All rights reserved.',
    bottomLinks: [
      { label: 'Privacy', url: '#' },
      { label: 'Terms', url: '#' },
      { label: 'Site Map', url: '/sitemap.xml' },
    ],
  },
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const out = { ...base }
  for (const k of Object.keys(override)) {
    const b = base[k]
    const o = override[k]
    if (o != null && typeof o === 'object' && !Array.isArray(o) && typeof b === 'object' && b != null && !Array.isArray(b)) {
      out[k] = deepMerge(b as Record<string, unknown>, o as Record<string, unknown>)
    } else if (o !== undefined) {
      out[k] = o
    }
  }
  return out
}

export async function GET() {
  try {
    let stored: Record<string, unknown> | null = await loadFromSupabase()
    if (stored == null) stored = loadSiteContentFromFile()
    const data = stored ? deepMerge(defaults, stored) : defaults
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    })
  } catch (e) {
    console.error('Site content GET error:', e)
    return NextResponse.json({ success: false, error: 'Failed to load site content' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    let stored: Record<string, unknown> | null = await loadFromSupabase()
    if (stored == null) stored = loadSiteContentFromFile()
    const merged = stored ? deepMerge(stored, body) : deepMerge(defaults, body)

    const onVercel = !!process.env.VERCEL
    if (onVercel) {
      if (!hasSupabase) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Site content cannot be saved on Vercel without Supabase. In Vercel → Settings → Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.',
          },
          { status: 500 }
        )
      }
      const result = await saveToSupabase(merged)
      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error ?? 'Failed to save site content to Supabase Storage.' },
          { status: 500 }
        )
      }
    } else {
      const saved = (await saveToSupabase(merged)).ok || saveSiteContentToFile(merged)
      if (!saved) {
        return NextResponse.json(
          { success: false, error: 'Failed to save site content.' },
          { status: 500 }
        )
      }
    }
    return NextResponse.json({ success: true, data: merged, message: 'Site content saved' })
  } catch (e) {
    console.error('Site content PUT error:', e)
    return NextResponse.json({ success: false, error: 'Failed to save site content' }, { status: 500 })
  }
}
