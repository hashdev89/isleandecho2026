'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  getEnabledSections,
  type PageSection,
  type CmsPage,
} from '@/lib/siteContent'

function PageHeroBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="lp-page-hero">
      <div className="mx-auto w-full max-w-[1920px] lp-gutter text-center">
        {data.kicker ? <p className="lp-kicker mb-3">{String(data.kicker)}</p> : null}
        <h1 className="lp-section-title mb-4 px-2 text-3xl text-white sm:mb-6 sm:text-4xl md:text-5xl">
          {String(data.title || '')}
        </h1>
        {data.subtitle ? (
          <p className="mx-auto max-w-3xl px-2 text-base text-white/85 sm:text-lg md:text-xl">{String(data.subtitle)}</p>
        ) : null}
      </div>
    </section>
  )
}

function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const image = String(data.image || '')
  return (
    <section className="lp-section-ink py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-[1920px] items-center gap-8 lp-gutter lg:grid-cols-2 lg:gap-12">
        <div>
          {data.kicker ? <p className="lp-kicker mb-2">{String(data.kicker)}</p> : null}
          <h2 className="lp-section-title mb-4 text-2xl sm:mb-6 sm:text-3xl md:text-4xl">{String(data.title || '')}</h2>
          {data.body ? (
            <p className="mb-4 text-base leading-relaxed text-[var(--ink-soft)] sm:mb-6 sm:text-lg">{String(data.body)}</p>
          ) : null}
          {data.body2 ? (
            <p className="text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">{String(data.body2)}</p>
          ) : null}
        </div>
        {image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/5">
            <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function TeamBlock({ data }: { data: Record<string, unknown> }) {
  const members = (data.members as Array<{ name?: string; position?: string; bio?: string; image?: string }>) || []
  return (
    <section className="lp-section-ink bg-white/70 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[1920px] lp-gutter">
        <div className="mb-8 max-w-2xl">
          <h2 className="lp-section-title text-2xl sm:text-3xl">{String(data.title || 'Our Team')}</h2>
          {data.subtitle ? <p className="mt-2 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

function ValuesBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ title?: string; description?: string }>) || []
  return (
    <section className="lp-section-ink py-10 sm:py-14">
      <div className="mx-auto w-full max-w-[1920px] lp-gutter">
        <div className="mb-8 max-w-2xl">
          <h2 className="lp-section-title text-2xl sm:text-3xl">{String(data.title || 'Our Values')}</h2>
          {data.subtitle ? <p className="mt-2 text-[var(--ink-soft)]">{String(data.subtitle)}</p> : null}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden bg-[var(--lagoon)] py-16 text-white sm:py-24">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lp-gutter">
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
    </section>
  )
}

function FeaturesBlock({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ title?: string; description?: string }>) || []
  return (
    <section className="lp-section-ink bg-[var(--foam)] py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1920px] lp-gutter">
        <div className="mb-10 max-w-2xl">
          <h2 className="lp-section-title text-3xl sm:text-4xl">{String(data.sectionTitle || '')}</h2>
          {data.sectionSubtitle ? (
            <p className="mt-3 text-[var(--ink-soft)]">{String(data.sectionSubtitle)}</p>
          ) : null}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

function HtmlBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="lp-section-ink py-8">
      <div
        className="prose mx-auto max-w-[1920px] lp-gutter"
        dangerouslySetInnerHTML={{ __html: String(data.html || '') }}
      />
    </section>
  )
}

function ContactInfoBlock({ data }: { data: Record<string, unknown> }) {
  const cards = [
    { title: data.addressTitle, detail: data.address },
    { title: data.phoneTitle, detail: data.phone },
    { title: data.emailTitle, detail: data.email },
    { title: data.hoursTitle, detail: data.hours },
  ].filter((c) => c.detail)
  return (
    <section className="lp-section-ink py-10">
      <div className="mx-auto grid w-full max-w-[1920px] gap-4 lp-gutter sm:grid-cols-2 lg:grid-cols-4">
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

export function renderCmsSection(section: PageSection) {
  switch (section.type) {
    case 'pageHero':
      return <PageHeroBlock key={section.id} data={section.data} />
    case 'richText':
      return <RichTextBlock key={section.id} data={section.data} />
    case 'team':
      return <TeamBlock key={section.id} data={section.data} />
    case 'values':
      return <ValuesBlock key={section.id} data={section.data} />
    case 'cta':
      return <CtaBlock key={section.id} data={section.data} />
    case 'features':
      return <FeaturesBlock key={section.id} data={section.data} />
    case 'html':
      return <HtmlBlock key={section.id} data={section.data} />
    case 'contactInfo':
      return <ContactInfoBlock key={section.id} data={section.data} />
    default:
      return null
  }
}

/** Renders ordered CMS sections for about / custom pages (skips types that need page-specific UI). */
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

export function CmsPageHero({ page, fallback }: { page?: CmsPage; fallback?: { kicker?: string; title: string; subtitle?: string } }) {
  const hero = page?.sections.find((s) => s.type === 'pageHero' && s.enabled !== false)?.data
  const data = hero || {
    kicker: fallback?.kicker || '',
    title: fallback?.title || '',
    subtitle: fallback?.subtitle || '',
  }
  return <PageHeroBlock data={data} />
}
