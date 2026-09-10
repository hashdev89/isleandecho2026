'use client'

import SafeImage from './SafeImage'
import Link from 'next/link'
import {
  getEnabledSections,
  resolveSectionLayout,
  sectionContainerClass,
  type PageSection,
  type CmsPage,
  type SectionLayout,
} from '@/lib/siteContent'

function PageHeroBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  return (
    <section className="lp-page-hero">
      <div className={`${sectionContainerClass(layout)} text-center`}>
        {data.kicker ? <p className="lp-kicker mb-3">{String(data.kicker)}</p> : null}
        <h1 className="lp-section-title mb-4 px-2 text-3xl text-white sm:mb-6 sm:text-4xl md:text-5xl">
          {String(data.title || '')}
        </h1>
        {data.subtitle ? (
          <p className="mx-auto max-w-3xl px-2 text-base text-white/85 sm:text-lg md:text-xl">
            {String(data.subtitle)}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim())
}

/** Keep blank lines TipTap saves as empty <p> from collapsing on the public page */
function preserveEditorSpacing(html: string) {
  return html
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<p class="cms-spacer">&nbsp;</p>')
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<p class="cms-spacer">&nbsp;</p>')
}

function CmsHtml({
  content,
  className = '',
}: {
  content: string
  className?: string
}) {
  const raw = content.trim()
  if (!raw) return null
  if (looksLikeHtml(raw)) {
    return (
      <div
        className={`cms-prose ${className}`}
        dangerouslySetInnerHTML={{ __html: preserveEditorSpacing(raw) }}
      />
    )
  }
  return <p className={className}>{raw}</p>
}

function RichTextBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const image = String(data.image || '').trim()
  const resolved = layout || 'full'
  const split = Boolean(image) && resolved === 'full'
  return (
    <section className={`lp-section-ink ${image ? 'py-10 sm:py-14' : 'pt-10 pb-8 sm:pt-12 sm:pb-10'}`}>
      <div
        className={`${sectionContainerClass(layout)} grid items-center gap-8 py-5 ${
          split ? 'lg:grid-cols-2 lg:gap-12' : ''
        }`}
      >
        <div>
          {data.kicker ? <p className="lp-kicker mb-2">{String(data.kicker)}</p> : null}
          <h2 className="lp-section-title mb-4 text-2xl sm:mb-5 sm:text-3xl md:text-4xl">
            {String(data.title || '')}
          </h2>
          <CmsHtml
            content={String(data.body || '')}
            className="mb-4 text-base leading-relaxed text-[var(--ink-soft)] sm:mb-5 sm:text-lg"
          />
          <CmsHtml
            content={String(data.body2 || '')}
            className="text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg"
          />
        </div>
        {image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/5">
            <SafeImage src={image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function TeamBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const members = (data.members as Array<{ name?: string; position?: string; bio?: string; image?: string }>) || []
  const cols =
    resolveSectionLayout({ layout, type: 'team' }) === 'medium'
      ? 'sm:grid-cols-1'
      : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="lp-section-ink bg-white/70 py-10 sm:py-14">
      <div className={sectionContainerClass(layout)}>
        <div className="mb-8 max-w-2xl">
          <h2 className="lp-section-title text-2xl sm:text-3xl">{String(data.title || 'Our Team')}</h2>
          {data.subtitle ? <p className="mt-2 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className={`grid gap-6 ${cols}`}>
          {members.map((m, i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white p-6">
              <h3 className="text-lg font-bold text-[var(--ink)]">{m.name}</h3>
              <p className="text-sm font-semibold text-[var(--lagoon-deep)]">{m.position}</p>
              {m.bio ? <p className="mt-3 text-sm text-[var(--ink-soft)]">{m.bio}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValuesBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const items = (data.items as Array<{ title?: string; description?: string }>) || []
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'sm:grid-cols-1' : resolved === 'wide' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
  return (
    <section className="lp-section-ink py-10 sm:py-14">
      <div className={sectionContainerClass(layout)}>
        <div className="mb-8 max-w-2xl">
          <h2 className="lp-section-title text-2xl sm:text-3xl">{String(data.title || 'Our Values')}</h2>
          {data.subtitle ? <p className="mt-2 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className={`grid gap-6 ${cols}`}>
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white p-5">
              <h3 className="font-bold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  return (
    <section className="relative overflow-hidden bg-[var(--lagoon)] py-16 text-white sm:py-24">
      <div className={`relative z-10 ${sectionContainerClass(layout)}`}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data.title || '')}</h2>
          {data.subtitle ? <p className="mt-4 text-white/90">{String(data.subtitle)}</p> : null}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {data.primaryButtonText ? (
              <Link
                href={String(data.primaryButtonUrl || '/tours')}
                className="rounded-full bg-[var(--sun)] px-6 py-3 font-bold text-[var(--lagoon-deep)]"
              >
                {String(data.primaryButtonText)}
              </Link>
            ) : null}
            {data.secondaryButtonText ? (
              <Link
                href={String(data.secondaryButtonUrl || '/contact')}
                className="rounded-full border-2 border-white/80 px-6 py-3 font-bold text-white"
              >
                {String(data.secondaryButtonText)}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const items = (data.items as Array<{ title?: string; description?: string }>) || []
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'sm:grid-cols-1' : resolved === 'wide' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
  return (
    <section className="lp-section-ink bg-[var(--foam)] py-14 sm:py-20">
      <div className={sectionContainerClass(layout)}>
        <div className="mb-10 max-w-2xl">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data.sectionTitle || '')}</h2>
          {data.sectionSubtitle ? (
            <p className="mt-3 text-[var(--ink-soft)]">{String(data.sectionSubtitle)}</p>
          ) : null}
        </div>
        <div className={`grid gap-6 ${cols}`}>
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-black/5 bg-white p-5">
              <h3 className="font-bold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HtmlBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  return (
    <section className="lp-section-ink pt-6 pb-16 sm:pt-8 sm:pb-20">
      <div className={sectionContainerClass(layout)}>
        <CmsHtml content={String(data.html || '')} className="text-[var(--ink-soft)]" />
      </div>
    </section>
  )
}

function ContactInfoBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const cards = [
    { title: data.addressTitle, detail: data.address },
    { title: data.phoneTitle, detail: data.phone },
    { title: data.emailTitle, detail: data.email },
    { title: data.hoursTitle, detail: data.hours },
  ].filter((c) => c.detail)
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'sm:grid-cols-1' : resolved === 'wide' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
  return (
    <section className="lp-section-ink py-10">
      <div className={`${sectionContainerClass(layout)} grid gap-4 ${cols}`}>
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border border-black/5 bg-white p-5">
            <h3 className="font-bold text-[var(--ink)]">{String(c.title || '')}</h3>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{String(c.detail || '')}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatsBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const items = (data.items as Array<{ number?: string; label?: string }>) || []
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
  return (
    <section className="bg-[var(--lagoon-deep)] py-14 text-white sm:py-20">
      <div className={`${sectionContainerClass(layout)} grid gap-8 ${cols}`}>
        {items.map((item, i) => (
          <div key={i} className="text-center">
            <p className="font-display text-4xl text-[var(--sun)] sm:text-5xl">{item.number}</p>
            <p className="mt-2 text-sm text-white/80 sm:text-base">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function BannerBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const image = String(data.backgroundImage || '')
  return (
    <section className="relative overflow-hidden py-24 text-white sm:py-32">
      {image ? (
        <SafeImage src={image} alt="" fill className="object-cover" sizes="100vw" />
      ) : (
        <div className="absolute inset-0 bg-[var(--lagoon-deep)]" />
      )}
      <div className="absolute inset-0 bg-[var(--lagoon-deep)]/55" />
      <div className={`relative z-10 ${sectionContainerClass(layout)}`}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl">{String(data.title || '')}</h2>
          {data.subtitle ? <p className="mt-4 text-lg text-white/85">{String(data.subtitle)}</p> : null}
        </div>
      </div>
    </section>
  )
}

function SolutionsBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const items =
    (data.items as Array<{ title?: string; description?: string; image?: string; highlights?: string[] }>) ||
    []
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'md:grid-cols-1' : resolved === 'wide' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="lp-section-ink py-14 sm:py-20">
      <div className={sectionContainerClass(layout)}>
        <div className="mb-10 max-w-2xl">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data.title || '')}</h2>
          {data.subtitle ? <p className="mt-3 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className={`grid gap-6 ${cols}`}>
          {items.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-black/5 bg-white">
              {item.image ? (
                <div className="relative h-48">
                  <SafeImage src={item.image} alt="" fill className="object-cover" sizes="400px" />
                </div>
              ) : null}
              <div className="p-5">
                <h3 className="text-lg font-bold text-[var(--ink)]">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.description}</p>
                ) : null}
                {Array.isArray(item.highlights) && item.highlights.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm text-[var(--lagoon-deep)]">
                    {item.highlights.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  const items =
    (data.items as Array<{ name?: string; quote?: string; location?: string; rating?: number }>) || []
  const resolved = layout || 'full'
  const cols =
    resolved === 'medium' ? 'md:grid-cols-1' : resolved === 'wide' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
  return (
    <section className="lp-section-ink bg-white py-14 sm:py-20">
      <div className={sectionContainerClass(layout)}>
        <div className="mb-10 max-w-2xl">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data.title || 'Guest stories')}</h2>
          {data.subtitle ? <p className="mt-3 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className={`grid gap-6 ${cols}`}>
          {items.map((item, i) => (
            <blockquote key={i} className="rounded-2xl border border-black/5 bg-[var(--foam)] p-6">
              <p className="text-[var(--ink)] leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-[var(--lagoon-deep)]">
                {item.name}
                {item.location ? <span className="font-normal text-[var(--ink-soft)]"> · {item.location}</span> : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

function TitleSectionBlock({
  data,
  layout,
  titleKey = 'title',
  subtitleKey = 'subtitle',
}: {
  data: Record<string, unknown>
  layout?: SectionLayout
  titleKey?: string
  subtitleKey?: string
}) {
  return (
    <section className="lp-section-ink py-12 sm:py-16">
      <div className={sectionContainerClass(layout)}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data[titleKey] || '')}</h2>
          {data[subtitleKey] ? (
            <p className="mt-3 text-[var(--ink-soft)]">{String(data[subtitleKey])}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function ContactFormIntroBlock({ data, layout }: { data: Record<string, unknown>; layout?: SectionLayout }) {
  return (
    <section className="lp-section-ink py-10 sm:py-14">
      <div className={sectionContainerClass(layout)}>
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="lp-section-title text-3xl">{String(data.title || 'Send a message')}</h2>
          {data.subtitle ? <p className="mt-3 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-[var(--lagoon-deep)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--lagoon)]"
          >
            Open contact form
          </Link>
        </div>
      </div>
    </section>
  )
}

export function renderCmsSection(section: PageSection) {
  const layout = resolveSectionLayout(section)
  switch (section.type) {
    case 'pageHero':
      return <PageHeroBlock key={section.id} data={section.data} layout={layout} />
    case 'richText':
      return <RichTextBlock key={section.id} data={section.data} layout={layout} />
    case 'team':
      return <TeamBlock key={section.id} data={section.data} layout={layout} />
    case 'values':
      return <ValuesBlock key={section.id} data={section.data} layout={layout} />
    case 'cta':
      return <CtaBlock key={section.id} data={section.data} layout={layout} />
    case 'features':
      return <FeaturesBlock key={section.id} data={section.data} layout={layout} />
    case 'html':
      return <HtmlBlock key={section.id} data={section.data} layout={layout} />
    case 'contactInfo':
      return <ContactInfoBlock key={section.id} data={section.data} layout={layout} />
    case 'stats':
      return <StatsBlock key={section.id} data={section.data} layout={layout} />
    case 'sriLankaBanner':
      return <BannerBlock key={section.id} data={section.data} layout={layout} />
    case 'solutions':
      return <SolutionsBlock key={section.id} data={section.data} layout={layout} />
    case 'testimonials':
      return <TestimonialsBlock key={section.id} data={section.data} layout={layout} />
    case 'featuredTours':
    case 'destinations':
    case 'blogPreview':
      return <TitleSectionBlock key={section.id} data={section.data} layout={layout} />
    case 'contactForm':
      return <ContactFormIntroBlock key={section.id} data={section.data} layout={layout} />
    case 'hero':
      // Homepage hero is rendered by the dedicated home page; show a compact preview on CMS pages
      return (
        <section key={section.id} className="bg-[var(--lagoon-deep)] py-16 text-white">
          <div className={sectionContainerClass(layout)}>
            <div className="mx-auto max-w-3xl px-6 text-center">
              <p className="lp-kicker mb-3 text-[var(--sun)]">{String(section.data.badgeText || '')}</p>
              <h1 className="font-display text-4xl sm:text-5xl">
                {String(section.data.headline || '')}{' '}
                <span className="text-[var(--sun)]">{String(section.data.headlineHighlight || '')}</span>
              </h1>
              {section.data.subtitle ? (
                <p className="mt-4 text-white/80">{String(section.data.subtitle)}</p>
              ) : null}
            </div>
          </div>
        </section>
      )
    default:
      return null
  }
}

/** Renders ordered CMS sections for about / custom pages. */
export default function CmsPageSections({
  page,
  skipTypes = [],
}: {
  page: CmsPage | undefined
  skipTypes?: string[]
}) {
  const sections = getEnabledSections(page).filter((s) => !skipTypes.includes(s.type))
  return <>{sections.map((section) => renderCmsSection(section))}</>
}

export function CmsPageHero({
  page,
  fallback,
}: {
  page?: CmsPage
  fallback?: { kicker?: string; title: string; subtitle?: string }
}) {
  const heroSection = page?.sections.find((s) => s.type === 'pageHero' && s.enabled !== false)
  const data = heroSection?.data || {
    kicker: fallback?.kicker || '',
    title: fallback?.title || '',
    subtitle: fallback?.subtitle || '',
  }
  return <PageHeroBlock data={data} layout={heroSection ? resolveSectionLayout(heroSection) : 'full'} />
}
