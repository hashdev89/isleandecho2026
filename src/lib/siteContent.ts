/** Site Content CMS — pages with ordered, typed sections */

export type SiteLink = { label: string; url: string }

export type SectionType =
  | 'hero'
  | 'featuredTours'
  | 'stats'
  | 'sriLankaBanner'
  | 'features'
  | 'solutions'
  | 'destinations'
  | 'blogPreview'
  | 'cta'
  | 'pageHero'
  | 'richText'
  | 'team'
  | 'values'
  | 'contactInfo'
  | 'contactForm'
  | 'html'

export type PageSection = {
  id: string
  type: SectionType
  enabled: boolean
  data: Record<string, unknown>
}

export type CmsPage = {
  id: string
  slug: string
  title: string
  enabled: boolean
  /** When true, also available at /p/[slug] for custom pages */
  isCustom?: boolean
  sections: PageSection[]
}

export type SiteContentDoc = {
  version: 2
  pages: CmsPage[]
  footer: Record<string, unknown>
  /** Legacy flat keys kept in sync for older consumers */
  hero?: Record<string, unknown>
  featuredTours?: Record<string, unknown>
  stats?: unknown
  sriLankaBanner?: Record<string, unknown>
  features?: Record<string, unknown>
  solutions?: Record<string, unknown>
  destinationsSection?: Record<string, unknown>
  cta?: Record<string, unknown>
  about?: Record<string, unknown>
  contact?: Record<string, unknown>
  searchTabs?: unknown
  [key: string]: unknown
}

export const SECTION_META: Record<
  SectionType,
  { label: string; description: string }
> = {
  hero: { label: 'Hero', description: 'Homepage hero copy, CTAs, images, video' },
  featuredTours: { label: 'Featured Tours', description: 'Title/subtitle for featured tour rail' },
  stats: { label: 'Stats', description: 'Counter strip (number + label)' },
  sriLankaBanner: { label: 'Sri Lanka Banner', description: 'Full-bleed image banner' },
  features: { label: 'Why Choose / Features', description: 'Feature cards grid' },
  solutions: { label: 'Discover cards', description: 'Image cards with highlights' },
  destinations: { label: 'Destinations', description: 'Destinations section titles' },
  blogPreview: { label: 'Blog preview', description: 'Latest posts section titles' },
  cta: { label: 'CTA band', description: 'Call-to-action with buttons' },
  pageHero: { label: 'Page hero', description: 'Inner page hero (kicker, title, subtitle)' },
  richText: { label: 'Rich text / story', description: 'Heading + paragraphs + optional image' },
  team: { label: 'Team', description: 'Team member cards' },
  values: { label: 'Values', description: 'Values / principles grid' },
  contactInfo: { label: 'Contact info', description: 'Address, phone, email, hours' },
  contactForm: { label: 'Contact form intro', description: 'Form section title & helper text' },
  html: { label: 'Custom HTML', description: 'Raw HTML block (advanced)' },
}

export const ALL_SECTION_TYPES = Object.keys(SECTION_META) as SectionType[]

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function createSection(type: SectionType, data?: Record<string, unknown>): PageSection {
  return {
    id: uid(type),
    type,
    enabled: true,
    data: { ...defaultDataForSection(type), ...data },
  }
}

export function defaultDataForSection(type: SectionType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return {
        badgeText: 'Top Rated Travel Agency',
        brandLine: 'ISLE & ECHO',
        headline: 'Discover the Magic of',
        headlineHighlight: 'Sri Lanka',
        subtitle:
          'Experience breathtaking landscapes, rich culture, and unforgettable adventures with our expertly crafted tour packages.',
        ctaPrimaryText: 'Explore Tours',
        ctaPrimaryUrl: '/tours',
        ctaSecondaryText: 'Plan a trip',
        ctaSecondaryUrl: '/custom-booking',
        videoUrl:
          'https://www.youtube.com/embed/y5bHGWAE50c?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&start=0&cc_load_policy=0&playsinline=1&enablejsapi=1',
        heroImages: [] as string[],
      }
    case 'featuredTours':
      return { title: 'Featured tour packages', subtitle: 'Hand-picked journeys across the island' }
    case 'stats':
      return {
        items: [
          { number: '500+', label: 'Happy Travelers' },
          { number: '50+', label: 'Tour Packages' },
          { number: '4.9', label: 'Average Rating' },
          { number: '24/7', label: 'Customer Support' },
        ],
      }
    case 'sriLankaBanner':
      return { title: 'Sri Lanka', subtitle: 'Mystic Isle of Echoes', backgroundImage: '' }
    case 'features':
      return {
        sectionTitle: 'Why Choose ISLE & ECHO?',
        sectionSubtitle:
          'We provide exceptional travel experiences with unmatched service and attention to detail.',
        items: [
          {
            title: 'Safe & Secure Travel',
            description: 'Your safety is our priority with comprehensive travel insurance and 24/7 support.',
          },
          {
            title: 'Flexible Scheduling',
            description: 'Customize your itinerary with flexible dates and personalized experiences.',
          },
          {
            title: 'Expert Guides',
            description: 'Professional local guides with deep knowledge of Sri Lankan culture and history.',
          },
          {
            title: 'Memorable Experiences',
            description: 'Create unforgettable memories with our carefully curated tour experiences.',
          },
        ],
      }
    case 'solutions':
      return {
        sectionTitle: 'Discover Sri Lanka',
        sectionSubtitle: 'From ancient temples to pristine beaches, explore the diverse beauty of Sri Lanka.',
        items: [
          {
            title: 'Cultural Heritage Tours',
            description: 'Explore ancient temples, UNESCO World Heritage sites, and rich cultural traditions.',
            image: '',
            highlights: ['Sigiriya Rock Fortress', 'Temple of the Tooth', 'Ancient Cities'],
          },
          {
            title: 'Wildlife Safari Adventures',
            description: "Discover Sri Lanka's incredible biodiversity with expert-guided wildlife safaris.",
            image: '',
            highlights: ['Yala National Park', 'Elephant Watching', 'Bird Watching'],
          },
          {
            title: 'Beach & Coastal Escapes',
            description: "Relax on pristine beaches and enjoy water sports along Sri Lanka's beautiful coastline.",
            image: '',
            highlights: ['Mirissa Beach', 'Whale Watching', 'Water Sports'],
          },
        ],
      }
    case 'destinations':
      return {
        title: "Discover Sri Lanka's destinations",
        subtitle: 'Explore the diverse beauty of Sri Lanka with our curated list of destinations and activities.',
      }
    case 'blogPreview':
      return { title: 'Travel stories & tips', subtitle: 'Ideas and inspiration for your next island escape' }
    case 'cta':
      return {
        title: 'Ready to Start Your Sri Lankan Adventure?',
        subtitle: 'Let us help you create unforgettable memories with our expertly crafted tour packages.',
        primaryButtonText: 'Get Started Today',
        primaryButtonUrl: '/tours',
        secondaryButtonText: 'Contact Us',
        secondaryButtonUrl: '/contact',
      }
    case 'pageHero':
      return {
        kicker: 'Our story',
        title: 'About ISLE & ECHO',
        subtitle: "We're passionate about connecting travelers with the authentic beauty and rich culture of Sri Lanka",
      }
    case 'richText':
      return {
        kicker: 'Who we are',
        title: 'Our story',
        body: 'Founded in 2020, ISLE & ECHO was born from a deep love for Sri Lanka and a desire to share its incredible beauty with the world.',
        body2: '',
        image: '',
      }
    case 'team':
      return {
        title: 'Our Team',
        subtitle: 'The people behind your journey',
        members: [
          {
            name: 'Aravinda Silva',
            position: 'Founder & CEO',
            image: '',
            bio: "Passionate about showcasing Sri Lanka's beauty to the world.",
          },
          {
            name: 'Priya Fernando',
            position: 'Head of Operations',
            image: '',
            bio: 'Ensuring every journey is seamless and memorable.',
          },
          {
            name: 'Rajith Perera',
            position: 'Travel Curator',
            image: '',
            bio: 'Creating authentic experiences that connect travelers with local culture.',
          },
        ],
      }
    case 'values':
      return {
        title: 'Our Values',
        subtitle: 'What guides every journey we craft',
        items: [
          {
            title: 'Sustainability',
            description: "Committed to eco-friendly tourism and preserving Sri Lanka's natural beauty.",
          },
          {
            title: 'Authenticity',
            description: 'Providing genuine local experiences that go beyond typical tourist attractions.',
          },
          {
            title: 'Quality',
            description: 'Delivering exceptional service and carefully curated travel experiences.',
          },
          {
            title: 'Passion',
            description: 'Driven by our love for Sri Lanka and desire to share its magic with the world.',
          },
        ],
      }
    case 'contactInfo':
      return {
        addressTitle: 'Visit Us',
        address: '55/A, Kulupana, Pokunuwita, Sri Lanka',
        phoneTitle: 'Call Us',
        phone: '+94 741 415 812',
        emailTitle: 'Email Us',
        email: 'info@isleandecho.com',
        hoursTitle: 'Hours',
        hours: 'Mon–Sat 9:00–18:00',
      }
    case 'contactForm':
      return {
        title: 'Send us a message',
        subtitle: 'Tell us about your trip — we usually reply within one business day.',
        buttonText: 'Send message',
      }
    case 'html':
      return { html: '<p></p>' }
    default:
      return {}
  }
}

export const defaultFooter: Record<string, unknown> = {
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
  ] as SiteLink[],
  supportHeading: 'Support',
  supportLinks: [
    { label: 'Contact', url: '/contact' },
    { label: 'Legal Notice', url: '#' },
    { label: 'Privacy Policy', url: '#' },
    { label: 'Terms and Conditions', url: '#' },
    { label: 'Sitemap', url: '/sitemap.xml' },
  ] as SiteLink[],
  otherServicesHeading: 'Other Services',
  otherServicesLinks: [
    { label: 'Car Hire', url: '/rent-car' },
    { label: 'Tour List', url: '/tours' },
    { label: 'Custom Trip', url: '/custom-booking' },
  ] as SiteLink[],
  mobileHeading: 'Mobile',
  copyrightText: '© 2024 by ISLE & ECHO. All rights reserved.',
  bottomLinks: [
    { label: 'Privacy', url: '#' },
    { label: 'Terms', url: '#' },
    { label: 'Site Map', url: '/sitemap.xml' },
  ] as SiteLink[],
}

function buildHomeSections(legacy: Record<string, unknown> = {}): PageSection[] {
  const hero = (legacy.hero as Record<string, unknown>) || {}
  const featured = (legacy.featuredTours as Record<string, unknown>) || {}
  const statsRaw = legacy.stats
  const banner = (legacy.sriLankaBanner as Record<string, unknown>) || {}
  const features = (legacy.features as Record<string, unknown>) || {}
  const solutions = (legacy.solutions as Record<string, unknown>) || {}
  const dest = (legacy.destinationsSection as Record<string, unknown>) || {}
  const cta = (legacy.cta as Record<string, unknown>) || {}

  return [
    createSection('hero', { ...defaultDataForSection('hero'), ...hero }),
    createSection('featuredTours', { ...defaultDataForSection('featuredTours'), ...featured }),
    createSection('stats', {
      items: Array.isArray(statsRaw) ? statsRaw : (defaultDataForSection('stats').items as unknown[]),
    }),
    createSection('sriLankaBanner', { ...defaultDataForSection('sriLankaBanner'), ...banner }),
    createSection('features', { ...defaultDataForSection('features'), ...features }),
    createSection('solutions', { ...defaultDataForSection('solutions'), ...solutions }),
    createSection('destinations', { ...defaultDataForSection('destinations'), ...dest }),
    createSection('blogPreview'),
    createSection('cta', { ...defaultDataForSection('cta'), ...cta }),
  ]
}

function buildAboutSections(legacy: Record<string, unknown> = {}): PageSection[] {
  const about = (legacy.about as Record<string, unknown>) || {}
  return [
    createSection('pageHero', {
      kicker: 'Our story',
      title: (about.title as string) || 'About ISLE & ECHO',
      subtitle:
        (about.description as string) ||
        "We're passionate about connecting travelers with the authentic beauty and rich culture of Sri Lanka",
    }),
    createSection('richText', {
      kicker: 'Who we are',
      title: 'Our story',
      body:
        (about.description as string) ||
        'Founded in 2020, ISLE & ECHO was born from a deep love for Sri Lanka and a desire to share its incredible beauty with the world. What started as a small local tour operation has grown into a trusted travel partner for thousands of visitors.',
      body2:
        'We believe that travel should be more than just visiting places – it should be about experiencing cultures, connecting with people, and creating memories that last a lifetime.',
      image: (about.image as string) || '',
    }),
    createSection('team'),
    createSection('values'),
  ]
}

function buildContactSections(legacy: Record<string, unknown> = {}): PageSection[] {
  const contact = (legacy.contact as Record<string, unknown>) || {}
  return [
    createSection('pageHero', {
      kicker: 'Get in touch',
      title: (contact.title as string) || 'Contact Us',
      subtitle:
        (contact.description as string) ||
        'Questions about tours, rentals, or a custom trip? We are here to help.',
    }),
    createSection('contactInfo', {
      ...defaultDataForSection('contactInfo'),
      email: (contact.email as string) || 'info@isleandecho.com',
      phone: (contact.phone as string) || '+94 741 415 812',
      address: (contact.address as string) || '55/A, Kulupana, Pokunuwita, Sri Lanka',
    }),
    createSection('contactForm'),
  ]
}

export function buildDefaultPages(legacy: Record<string, unknown> = {}): CmsPage[] {
  return [
    {
      id: 'page_home',
      slug: '/',
      title: 'Home',
      enabled: true,
      sections: buildHomeSections(legacy),
    },
    {
      id: 'page_about',
      slug: '/about',
      title: 'About',
      enabled: true,
      sections: buildAboutSections(legacy),
    },
    {
      id: 'page_contact',
      slug: '/contact',
      title: 'Contact',
      enabled: true,
      sections: buildContactSections(legacy),
    },
    {
      id: 'page_tours',
      slug: '/tours',
      title: 'Tours',
      enabled: true,
      sections: [
        createSection('pageHero', {
          kicker: 'Journeys',
          title: 'Tour packages',
          subtitle: 'Curated experiences across Sri Lanka — culture, wildlife, beaches, and adventure.',
        }),
      ],
    },
    {
      id: 'page_rent_car',
      slug: '/rent-car',
      title: 'Rent a Car',
      enabled: true,
      sections: [
        createSection('pageHero', {
          kicker: 'Freedom to roam',
          title: 'Rent a car',
          subtitle: 'Self-drive and chauffeur options for every island itinerary.',
        }),
      ],
    },
    {
      id: 'page_destinations',
      slug: '/destinations',
      title: 'Destinations',
      enabled: true,
      sections: [
        createSection('pageHero', {
          kicker: 'Explore',
          title: 'Destinations',
          subtitle: 'From misty highlands to golden coasts — discover where to go next.',
        }),
      ],
    },
    {
      id: 'page_blog',
      slug: '/blog',
      title: 'Blog',
      enabled: true,
      sections: [
        createSection('pageHero', {
          kicker: 'Stories',
          title: 'Travel blog',
          subtitle: 'Tips, guides, and inspiration for your Sri Lanka trip.',
        }),
      ],
    },
    {
      id: 'page_custom_booking',
      slug: '/custom-booking',
      title: 'Custom Trip',
      enabled: true,
      sections: [
        createSection('pageHero', {
          kicker: 'Made for you',
          title: 'Plan a custom trip',
          subtitle: 'Tell us your dates, interests, and pace — we will craft the itinerary.',
        }),
        createSection('cta', {
          title: 'Prefer to talk it through?',
          subtitle: 'Our travel team can help refine your plan by phone or email.',
          primaryButtonText: 'Contact us',
          primaryButtonUrl: '/contact',
          secondaryButtonText: 'Browse tours',
          secondaryButtonUrl: '/tours',
        }),
      ],
    },
  ]
}

/** Sync flat legacy keys from home/about/contact pages for Footer + old readers */
export function syncLegacyFromPages(doc: SiteContentDoc): SiteContentDoc {
  const home = doc.pages.find((p) => p.slug === '/')
  const about = doc.pages.find((p) => p.slug === '/about')
  const contact = doc.pages.find((p) => p.slug === '/contact')

  const sectionData = (page: CmsPage | undefined, type: SectionType) =>
    page?.sections.find((s) => s.type === type)?.data

  const hero = sectionData(home, 'hero')
  const featuredTours = sectionData(home, 'featuredTours')
  const statsSec = sectionData(home, 'stats')
  const banner = sectionData(home, 'sriLankaBanner')
  const features = sectionData(home, 'features')
  const solutions = sectionData(home, 'solutions')
  const destinations = sectionData(home, 'destinations')
  const cta = sectionData(home, 'cta')
  const aboutHero = sectionData(about, 'pageHero')
  const aboutRich = sectionData(about, 'richText')
  const contactHero = sectionData(contact, 'pageHero')
  const contactInfo = sectionData(contact, 'contactInfo')

  return {
    ...doc,
    version: 2,
    hero: hero || doc.hero,
    featuredTours: featuredTours || doc.featuredTours,
    stats: (statsSec?.items as unknown) || doc.stats,
    sriLankaBanner: banner || doc.sriLankaBanner,
    features: features || doc.features,
    solutions: solutions || doc.solutions,
    destinationsSection: destinations || doc.destinationsSection,
    cta: cta || doc.cta,
    about: {
      title: (aboutHero?.title as string) || '',
      description: (aboutRich?.body as string) || (aboutHero?.subtitle as string) || '',
      image: (aboutRich?.image as string) || '',
    },
    contact: {
      title: (contactHero?.title as string) || '',
      description: (contactHero?.subtitle as string) || '',
      email: (contactInfo?.email as string) || '',
      phone: (contactInfo?.phone as string) || '',
      address: (contactInfo?.address as string) || '',
    },
  }
}

export function normalizeSiteContent(raw: Record<string, unknown> | null | undefined): SiteContentDoc {
  const input = raw && typeof raw === 'object' ? { ...raw } : {}
  const footer = {
    ...defaultFooter,
    ...((input.footer as Record<string, unknown>) || {}),
  }

  let pages: CmsPage[] = []
  if (Array.isArray(input.pages) && input.pages.length > 0) {
    pages = (input.pages as CmsPage[]).map((p) => ({
      id: p.id || uid('page'),
      slug: normalizeSlug(p.slug || '/'),
      title: p.title || 'Untitled',
      enabled: p.enabled !== false,
      isCustom: Boolean(p.isCustom),
      sections: Array.isArray(p.sections)
        ? p.sections.map((s) => ({
            id: s.id || uid(s.type || 'sec'),
            type: (s.type || 'richText') as SectionType,
            enabled: s.enabled !== false,
            data: { ...defaultDataForSection((s.type || 'richText') as SectionType), ...(s.data || {}) },
          }))
        : [],
    }))

    const defaults = buildDefaultPages(input)
    for (const d of defaults) {
      if (!pages.some((p) => p.slug === d.slug)) {
        pages.push(d)
      }
    }
  } else {
    pages = buildDefaultPages(input)
  }

  const doc: SiteContentDoc = {
    ...input,
    version: 2,
    pages,
    footer,
  }

  return syncLegacyFromPages(doc)
}

export function normalizeSlug(slug: string): string {
  const s = slug.trim() || '/'
  if (s === '/') return '/'
  const withSlash = s.startsWith('/') ? s : `/${s}`
  return withSlash.replace(/\/+$/, '') || '/'
}

export function getPageBySlug(doc: SiteContentDoc, slug: string): CmsPage | undefined {
  const target = normalizeSlug(slug)
  return doc.pages.find((p) => normalizeSlug(p.slug) === target && p.enabled !== false)
}

export function getSection<T extends Record<string, unknown> = Record<string, unknown>>(
  page: CmsPage | undefined,
  type: SectionType
): T | undefined {
  const sec = page?.sections.find((s) => s.type === type && s.enabled !== false)
  return sec?.data as T | undefined
}

export function isSectionEnabled(page: CmsPage | undefined, type: SectionType): boolean {
  return Boolean(page?.sections.find((s) => s.type === type && s.enabled !== false))
}

export function getEnabledSections(page: CmsPage | undefined): PageSection[] {
  return (page?.sections || []).filter((s) => s.enabled !== false)
}

export function createBlankPage(title: string, slug: string): CmsPage {
  return {
    id: uid('page'),
    slug: normalizeSlug(slug),
    title: title || 'New page',
    enabled: true,
    isCustom: true,
    sections: [
      createSection('pageHero', {
        kicker: 'New page',
        title: title || 'New page',
        subtitle: 'Edit this content in Site Content CMS.',
      }),
      createSection('richText', {
        kicker: '',
        title: 'Content',
        body: 'Add your story here. Reorder or add more sections from the layout panel.',
        body2: '',
        image: '',
      }),
    ],
  }
}
