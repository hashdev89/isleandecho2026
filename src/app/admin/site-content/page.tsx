'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  LayoutTemplate,
  FilePlus,
  Menu,
  ExternalLink,
  Settings2,
  PanelsTopLeft,
  PanelLeftClose,
} from 'lucide-react'
import Link from 'next/link'
import ImageSelector from '../../../components/ImageSelector'
import CmsRichTextEditor from '../../../components/CmsRichTextEditor'
import {
  ALL_SECTION_TYPES,
  SECTION_META,
  SECTION_LAYOUT_OPTIONS,
  createBlankPage,
  createSection,
  getPagePublicUrl,
  isBuiltinPageSlug,
  normalizeSiteContent,
  normalizeSlug,
  resolveSectionLayout,
  type CmsPage,
  type PageSection,
  type SectionLayout,
  type SectionType,
  type SiteContentDoc,
  type SiteLink,
} from '@/lib/siteContent'

function Field({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  rows?: number
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      )}
    </label>
  )
}

function LinksEditor({
  label,
  links,
  onChange,
}: {
  label: string
  links: SiteLink[]
  onChange: (links: SiteLink[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...links, { label: 'New link', url: '/' }])}
          className="text-xs font-semibold text-teal-700 hover:underline"
        >
          Add link
        </button>
      </div>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={link.label}
              onChange={(e) => {
                const next = [...links]
                next[i] = { ...next[i], label: e.target.value }
                onChange(next)
              }}
              placeholder="Label"
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
            <input
              value={link.url}
              onChange={(e) => {
                const next = [...links]
                next[i] = { ...next[i], url: e.target.value }
                onChange(next)
              }}
              placeholder="/path"
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(links.filter((_, idx) => idx !== i))}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              aria-label="Remove link"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLayoutPicker({
  value,
  onChange,
}: {
  value: SectionLayout
  onChange: (layout: SectionLayout) => void
}) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <PanelsTopLeft className="h-4 w-4 text-teal-700" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section layout</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SECTION_LAYOUT_OPTIONS.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                active
                  ? 'border-teal-500 bg-white shadow-sm ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mb-2 flex h-8 items-end justify-center gap-0.5 px-1">
                <span
                  className={`block h-full rounded-sm ${active ? 'bg-teal-600' : 'bg-slate-300'} ${
                    opt.id === 'full' ? 'w-full' : opt.id === 'wide' ? 'w-4/5' : 'w-1/2'
                  }`}
                  style={{
                    width: opt.id === 'full' ? '100%' : opt.id === 'wide' ? '78%' : '48%',
                  }}
                />
              </div>
              <p className={`text-sm font-semibold ${active ? 'text-teal-800' : 'text-slate-800'}`}>
                {opt.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionEditor({
  section,
  onChange,
}: {
  section: PageSection
  onChange: (data: Record<string, unknown>) => void
}) {
  const d = section.data
  const set = (key: string, value: unknown) => onChange({ ...d, [key]: value })
  const [imageOpen, setImageOpen] = useState(false)
  const [imageKey, setImageKey] = useState<string | null>(null)
  const [listImageIndex, setListImageIndex] = useState<number | null>(null)

  const openImage = (key: string, index?: number) => {
    setImageKey(key)
    setListImageIndex(index ?? null)
    setImageOpen(true)
  }

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <Field label="Badge" value={String(d.badgeText || '')} onChange={(v) => set('badgeText', v)} />
          <Field label="Brand line" value={String(d.brandLine || '')} onChange={(v) => set('brandLine', v)} />
          <Field label="Headline" value={String(d.headline || '')} onChange={(v) => set('headline', v)} />
          <Field
            label="Headline highlight"
            value={String(d.headlineHighlight || '')}
            onChange={(v) => set('headlineHighlight', v)}
          />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary CTA text" value={String(d.ctaPrimaryText || '')} onChange={(v) => set('ctaPrimaryText', v)} />
            <Field label="Primary CTA URL" value={String(d.ctaPrimaryUrl || '')} onChange={(v) => set('ctaPrimaryUrl', v)} />
            <Field label="Secondary CTA text" value={String(d.ctaSecondaryText || '')} onChange={(v) => set('ctaSecondaryText', v)} />
            <Field label="Secondary CTA URL" value={String(d.ctaSecondaryUrl || '')} onChange={(v) => set('ctaSecondaryUrl', v)} />
          </div>
          <Field label="Video embed URL" value={String(d.videoUrl || '')} onChange={(v) => set('videoUrl', v)} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero images</span>
              <button
                type="button"
                className="text-xs font-semibold text-teal-700"
                onClick={() => {
                  const imgs = [...((d.heroImages as string[]) || []), '']
                  set('heroImages', imgs)
                  openImage('heroImages', imgs.length - 1)
                }}
              >
                Add image
              </button>
            </div>
            {((d.heroImages as string[]) || []).map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => {
                    const imgs = [...((d.heroImages as string[]) || [])]
                    imgs[i] = e.target.value
                    set('heroImages', imgs)
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <button type="button" className="rounded-lg border px-2 text-xs" onClick={() => openImage('heroImages', i)}>
                  Pick
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-red-600"
                  onClick={() => set('heroImages', ((d.heroImages as string[]) || []).filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <ImageSelector
            isOpen={imageOpen}
            onClose={() => setImageOpen(false)}
            onSelect={(url) => {
              if (imageKey === 'heroImages' && listImageIndex != null) {
                const imgs = [...((d.heroImages as string[]) || [])]
                imgs[listImageIndex] = url
                set('heroImages', imgs)
              }
              setImageOpen(false)
            }}
          />
        </div>
      )
    case 'featuredTours':
    case 'destinations':
    case 'blogPreview':
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
        </div>
      )
    case 'stats': {
      const items = (d.items as Array<{ number?: string; label?: string }>) || []
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input
                value={item.number || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], number: e.target.value }
                  set('items', next)
                }}
                placeholder="500+"
                className="rounded-lg border px-2 py-1.5 text-sm"
              />
              <input
                value={item.label || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], label: e.target.value }
                  set('items', next)
                }}
                placeholder="Label"
                className="rounded-lg border px-2 py-1.5 text-sm"
              />
              <button type="button" className="text-red-600" onClick={() => set('items', items.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('items', [...items, { number: '0', label: 'New stat' }])}
          >
            Add stat
          </button>
        </div>
      )
    }
    case 'sriLankaBanner':
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} />
          <div className="flex gap-2">
            <input
              value={String(d.backgroundImage || '')}
              onChange={(e) => set('backgroundImage', e.target.value)}
              className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
              placeholder="Background image URL"
            />
            <button type="button" className="rounded-lg border px-3 text-sm" onClick={() => openImage('backgroundImage')}>
              Pick
            </button>
          </div>
          <ImageSelector
            isOpen={imageOpen}
            onClose={() => setImageOpen(false)}
            onSelect={(url) => {
              if (imageKey) set(imageKey, url)
              setImageOpen(false)
            }}
          />
        </div>
      )
    case 'features': {
      const items = (d.items as Array<{ title?: string; description?: string }>) || []
      return (
        <div className="space-y-4">
          <Field label="Section title" value={String(d.sectionTitle || '')} onChange={(v) => set('sectionTitle', v)} />
          <Field
            label="Section subtitle"
            value={String(d.sectionSubtitle || '')}
            onChange={(v) => set('sectionSubtitle', v)}
            multiline
          />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Feature {i + 1}</span>
                <button type="button" className="text-red-600" onClick={() => set('items', items.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.title || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], title: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Title"
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], description: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={2}
                placeholder="Description"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('items', [...items, { title: 'New feature', description: '' }])}
          >
            Add feature
          </button>
        </div>
      )
    }
    case 'solutions': {
      const items =
        (d.items as Array<{ title?: string; description?: string; image?: string; highlights?: string[] }>) || []
      return (
        <div className="space-y-4">
          <Field label="Section title" value={String(d.sectionTitle || '')} onChange={(v) => set('sectionTitle', v)} />
          <Field
            label="Section subtitle"
            value={String(d.sectionSubtitle || '')}
            onChange={(v) => set('sectionSubtitle', v)}
            multiline
          />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Card {i + 1}</span>
                <button type="button" className="text-red-600" onClick={() => set('items', items.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.title || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], title: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], description: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  value={item.image || ''}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = { ...next[i], image: e.target.value }
                    set('items', next)
                  }}
                  className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
                  placeholder="Image URL"
                />
                <button type="button" className="rounded-lg border px-2 text-xs" onClick={() => openImage('solutionsImage', i)}>
                  Pick
                </button>
              </div>
              <textarea
                value={(item.highlights || []).join('\n')}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = {
                    ...next[i],
                    highlights: e.target.value
                      .split('\n')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={3}
                placeholder="Highlights (one per line)"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('items', [...items, { title: 'New card', description: '', image: '', highlights: [] }])}
          >
            Add card
          </button>
          <ImageSelector
            isOpen={imageOpen}
            onClose={() => setImageOpen(false)}
            onSelect={(url) => {
              if (imageKey === 'solutionsImage' && listImageIndex != null) {
                const next = [...items]
                next[listImageIndex] = { ...next[listImageIndex], image: url }
                set('items', next)
              }
              setImageOpen(false)
            }}
          />
        </div>
      )
    }
    case 'cta':
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button" value={String(d.primaryButtonText || '')} onChange={(v) => set('primaryButtonText', v)} />
            <Field label="Primary URL" value={String(d.primaryButtonUrl || '')} onChange={(v) => set('primaryButtonUrl', v)} />
            <Field
              label="Secondary button"
              value={String(d.secondaryButtonText || '')}
              onChange={(v) => set('secondaryButtonText', v)}
            />
            <Field
              label="Secondary URL"
              value={String(d.secondaryButtonUrl || '')}
              onChange={(v) => set('secondaryButtonUrl', v)}
            />
          </div>
        </div>
      )
    case 'pageHero':
      return (
        <div className="space-y-4">
          <Field label="Kicker" value={String(d.kicker || '')} onChange={(v) => set('kicker', v)} />
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
        </div>
      )
    case 'richText':
      return (
        <div className="space-y-4">
          <Field label="Kicker" value={String(d.kicker || '')} onChange={(v) => set('kicker', v)} />
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <CmsRichTextEditor
            label="Body content"
            value={String(d.body || '')}
            onChange={(v) => set('body', v)}
            placeholder="Write the main section content…"
            minHeightClass="min-h-[200px]"
          />
          <CmsRichTextEditor
            label="Extra content (optional)"
            value={String(d.body2 || '')}
            onChange={(v) => set('body2', v)}
            placeholder="Optional second content block…"
            minHeightClass="min-h-[140px]"
          />
          <div className="flex gap-2">
            <input
              value={String(d.image || '')}
              onChange={(e) => set('image', e.target.value)}
              className="flex-1 rounded-lg border px-2 py-1.5 text-sm"
              placeholder="Image URL"
            />
            <button type="button" className="rounded-lg border px-3 text-sm" onClick={() => openImage('image')}>
              Pick
            </button>
          </div>
          <ImageSelector
            isOpen={imageOpen}
            onClose={() => setImageOpen(false)}
            onSelect={(url) => {
              if (imageKey) set(imageKey, url)
              setImageOpen(false)
            }}
          />
        </div>
      )
    case 'testimonials': {
      const items =
        (d.items as Array<{ name?: string; location?: string; quote?: string; rating?: number; image?: string }>) || []
      return (
        <div className="space-y-4">
          <Field label="Kicker" value={String(d.kicker || '')} onChange={(v) => set('kicker', v)} />
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Testimonial {i + 1}</span>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => set('items', items.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.name || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], name: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Guest name"
              />
              <input
                value={item.location || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], location: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Location / country"
              />
              <textarea
                value={item.quote || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], quote: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={3}
                placeholder="Testimonial quote"
              />
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                value={item.rating ?? 5}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)) }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Rating 1–5"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('items', [...items, { name: '', location: '', quote: '', rating: 5, image: '' }])}
          >
            Add testimonial
          </button>
        </div>
      )
    }
    case 'team': {
      const members = (d.members as Array<{ name?: string; position?: string; bio?: string; image?: string }>) || []
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} />
          {members.map((m, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Member {i + 1}</span>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => set('members', members.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={m.name || ''}
                onChange={(e) => {
                  const next = [...members]
                  next[i] = { ...next[i], name: e.target.value }
                  set('members', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Name"
              />
              <input
                value={m.position || ''}
                onChange={(e) => {
                  const next = [...members]
                  next[i] = { ...next[i], position: e.target.value }
                  set('members', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                placeholder="Position"
              />
              <textarea
                value={m.bio || ''}
                onChange={(e) => {
                  const next = [...members]
                  next[i] = { ...next[i], bio: e.target.value }
                  set('members', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('members', [...members, { name: '', position: '', bio: '', image: '' }])}
          >
            Add member
          </button>
        </div>
      )
    }
    case 'values': {
      const items = (d.items as Array<{ title?: string; description?: string }>) || []
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} />
          {items.map((item, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Value {i + 1}</span>
                <button type="button" className="text-red-600" onClick={() => set('items', items.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                value={item.title || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], title: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const next = [...items]
                  next[i] = { ...next[i], description: e.target.value }
                  set('items', next)
                }}
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-teal-700"
            onClick={() => set('items', [...items, { title: '', description: '' }])}
          >
            Add value
          </button>
        </div>
      )
    }
    case 'contactInfo':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address title" value={String(d.addressTitle || '')} onChange={(v) => set('addressTitle', v)} />
          <Field label="Address" value={String(d.address || '')} onChange={(v) => set('address', v)} />
          <Field label="Phone title" value={String(d.phoneTitle || '')} onChange={(v) => set('phoneTitle', v)} />
          <Field label="Phone" value={String(d.phone || '')} onChange={(v) => set('phone', v)} />
          <Field label="Email title" value={String(d.emailTitle || '')} onChange={(v) => set('emailTitle', v)} />
          <Field label="Email" value={String(d.email || '')} onChange={(v) => set('email', v)} />
          <Field label="Hours title" value={String(d.hoursTitle || '')} onChange={(v) => set('hoursTitle', v)} />
          <Field label="Hours" value={String(d.hours || '')} onChange={(v) => set('hours', v)} />
        </div>
      )
    case 'contactForm':
      return (
        <div className="space-y-4">
          <Field label="Title" value={String(d.title || '')} onChange={(v) => set('title', v)} />
          <Field label="Subtitle" value={String(d.subtitle || '')} onChange={(v) => set('subtitle', v)} multiline />
          <Field label="Button text" value={String(d.buttonText || '')} onChange={(v) => set('buttonText', v)} />
        </div>
      )
    case 'html':
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Use the visual editor for formatted content. Switch to HTML source only if you need raw markup.
          </p>
          <CmsRichTextEditor
            label="Rich content"
            value={String(d.html || '')}
            onChange={(v) => set('html', v)}
            placeholder="Write page content with headings, lists, links…"
            minHeightClass="min-h-[320px]"
          />
        </div>
      )
    default:
      return <p className="text-sm text-slate-500">No editor for this section type yet.</p>
  }
}

export default function AdminSiteContentPage() {
  const [doc, setDoc] = useState<SiteContentDoc | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [view, setView] = useState<'pages' | 'footer'>('pages')
  const [editorTab, setEditorTab] = useState<'content' | 'settings'>('content')
  const [addSectionType, setAddSectionType] = useState<SectionType>('richText')
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true)
        const res = await fetch('/api/site-content')
        const json = await res.json()
        if (json.success && json.data) {
          const normalized = normalizeSiteContent(json.data)
          setDoc(normalized)
          setSelectedPageId(normalized.pages[0]?.id || '')
          setSelectedSectionId(normalized.pages[0]?.sections[0]?.id || '')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  const selectedPage = useMemo(
    () => doc?.pages.find((p) => p.id === selectedPageId) || null,
    [doc, selectedPageId]
  )
  const selectedSection = useMemo(
    () => selectedPage?.sections.find((s) => s.id === selectedSectionId) || null,
    [selectedPage, selectedSectionId]
  )

  const updatePages = (pages: CmsPage[]) => {
    setDoc((prev) => (prev ? { ...prev, pages } : prev))
  }

  const updatePage = (pageId: string, patch: Partial<CmsPage>) => {
    if (!doc) return
    updatePages(doc.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)))
  }

  const updateSection = (pageId: string, sectionId: string, patch: Partial<PageSection>) => {
    if (!doc) return
    updatePages(
      doc.pages.map((p) =>
        p.id !== pageId
          ? p
          : {
              ...p,
              sections: p.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
            }
      )
    )
  }

  const moveSection = (pageId: string, sectionId: string, dir: -1 | 1) => {
    if (!doc) return
    const page = doc.pages.find((p) => p.id === pageId)
    if (!page) return
    const idx = page.sections.findIndex((s) => s.id === sectionId)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= page.sections.length) return
    const sections = [...page.sections]
    ;[sections[idx], sections[next]] = [sections[next], sections[idx]]
    updatePage(pageId, { sections })
  }

  const handleSave = async () => {
    if (!doc) return
    setSaving(true)
    try {
      const payload = normalizeSiteContent(doc as unknown as Record<string, unknown>)
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setDoc(normalizeSiteContent(json.data))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        alert(json.error || 'Failed to save')
      }
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addPage = () => {
    if (!doc || !newPageTitle.trim()) {
      alert('Enter a page title')
      return
    }
    const slugInput = newPageSlug.trim() || `/${newPageTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    const page = createBlankPage(newPageTitle.trim(), slugInput)
    if (doc.pages.some((p) => normalizeSlug(p.slug) === page.slug)) {
      alert('A page with that slug already exists')
      return
    }
    updatePages([...doc.pages, page])
    setSelectedPageId(page.id)
    setSelectedSectionId(page.sections[0]?.id || '')
    setEditorTab('content')
    setNewPageTitle('')
    setNewPageSlug('')
    setView('pages')
  }

  const footer = (doc?.footer || {}) as Record<string, unknown>
  const publicUrl = selectedPage ? getPagePublicUrl(selectedPage) : ''

  if (loadingData || !doc) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50 text-slate-500">Loading pages CMS…</div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">CMS</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Pages &amp; layout editor</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Create website pages, add or reorder sections, edit content, and publish. Built-in routes (Home, About,
              Tours…) keep their URLs; new pages go live at{' '}
              <code className="rounded bg-slate-100 px-1">/p/your-slug</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedPage && publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Preview page
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save all'}
            </button>
            <Link
              href="/admin"
              title="Close Pages CMS and return to Admin Panel"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <PanelLeftClose className="h-4 w-4" />
              <span className="hidden sm:inline">Close</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('pages')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            view === 'pages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <PanelsTopLeft className="h-4 w-4" />
          Page editor
        </button>
        <button
          type="button"
          onClick={() => setView('footer')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            view === 'footer' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Menu className="h-4 w-4" />
          Footer & menus
        </button>
      </div>

      {view === 'footer' ? (
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-2">
          <Field
            label="Newsletter title"
            value={String(footer.newsletterTitle || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, newsletterTitle: v } })}
          />
          <Field
            label="Newsletter subtitle"
            value={String(footer.newsletterSubtitle || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, newsletterSubtitle: v } })}
          />
          <Field
            label="Newsletter button"
            value={String(footer.newsletterButtonText || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, newsletterButtonText: v } })}
          />
          <Field
            label="Contact heading"
            value={String(footer.contactHeading || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, contactHeading: v } })}
          />
          <Field
            label="Contact phone"
            value={String(footer.contactPhone || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, contactPhone: v } })}
          />
          <Field
            label="Contact email"
            value={String(footer.contactEmail || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, contactEmail: v } })}
          />
          <Field
            label="Copyright"
            value={String(footer.copyrightText || '')}
            onChange={(v) => setDoc({ ...doc, footer: { ...footer, copyrightText: v } })}
          />
          <LinksEditor
            label="Company links"
            links={(footer.companyLinks as SiteLink[]) || []}
            onChange={(links) => setDoc({ ...doc, footer: { ...footer, companyLinks: links } })}
          />
          <LinksEditor
            label="Support links"
            links={(footer.supportLinks as SiteLink[]) || []}
            onChange={(links) => setDoc({ ...doc, footer: { ...footer, supportLinks: links } })}
          />
          <LinksEditor
            label="Other services"
            links={(footer.otherServicesLinks as SiteLink[]) || []}
            onChange={(links) => setDoc({ ...doc, footer: { ...footer, otherServicesLinks: links } })}
          />
          <LinksEditor
            label="Bottom links"
            links={(footer.bottomLinks as SiteLink[]) || []}
            onChange={(links) => setDoc({ ...doc, footer: { ...footer, bottomLinks: links } })}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_280px_1fr]">
          {/* Pages list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Pages</h2>
            <div className="space-y-1">
              {doc.pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setSelectedPageId(page.id)
                    setSelectedSectionId(page.sections[0]?.id || '')
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                    selectedPageId === page.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>
                    {page.title}
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">{page.slug}</span>
                  </span>
                  {!page.enabled && <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Create new page</p>
              <input
                value={newPageTitle}
                onChange={(e) => {
                  const title = e.target.value
                  setNewPageTitle(title)
                  const auto = `/${title
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')}`
                  // Keep slug in sync while creating unless user typed a custom slug first
                  setNewPageSlug((prev) => {
                    if (!prev) return auto === '/' ? '' : auto
                    const prevAutoFromOldTitle = `/${newPageTitle
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')}`
                    if (prev === prevAutoFromOldTitle || prev === '/') return auto === '/' ? '' : auto
                    return prev
                  })
                }}
                placeholder="Page title"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
              <input
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="/offers (optional)"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={addPage}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <FilePlus className="h-4 w-4" />
                Create page
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">
                New pages publish at <code className="rounded bg-slate-100 px-1">/p/…</code>. Edit Home/About/Contact
                from the list to change their sections and copy.
              </p>
            </div>
          </div>

          {/* Layout / sections */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {selectedPage ? (
              <>
                <div className="mb-3 space-y-2">
                  <h2 className="text-sm font-bold text-slate-900">Sections / layout</h2>
                  <p className="text-[11px] text-slate-500">
                    Drag order with arrows. Toggle visibility or delete sections. Live URL:{' '}
                    <code className="rounded bg-slate-100 px-1">{publicUrl}</code>
                  </p>
                  <Field
                    label="Page title"
                    value={selectedPage.title}
                    onChange={(v) => updatePage(selectedPage.id, { title: v })}
                  />
                  <Field
                    label="Slug"
                    value={selectedPage.slug}
                    onChange={(v) =>
                      updatePage(selectedPage.id, {
                        slug: v,
                        isCustom: !isBuiltinPageSlug(v),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => updatePage(selectedPage.id, { enabled: !selectedPage.enabled })}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
                  >
                    {selectedPage.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {selectedPage.enabled ? 'Page published' : 'Page unpublished'}
                  </button>
                </div>
                <div className="space-y-1">
                  {selectedPage.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className={`flex items-center gap-1 rounded-xl border px-2 py-1.5 ${
                        selectedSectionId === section.id ? 'border-teal-400 bg-teal-50' : 'border-slate-100'
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-800"
                        onClick={() => setSelectedSectionId(section.id)}
                      >
                        {SECTION_META[section.type]?.label || section.type}
                        <span className="ml-1 font-normal text-slate-400">
                          · {resolveSectionLayout(section)}
                        </span>
                        {!section.enabled && <span className="ml-1 text-slate-400">(off)</span>}
                      </button>
                      <button type="button" className="p-1 text-slate-500" onClick={() => moveSection(selectedPage.id, section.id, -1)} disabled={index === 0}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-slate-500"
                        onClick={() => moveSection(selectedPage.id, section.id, 1)}
                        disabled={index === selectedPage.sections.length - 1}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 text-slate-500"
                        onClick={() => updateSection(selectedPage.id, section.id, { enabled: !section.enabled })}
                      >
                        {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        className="p-1 text-red-600"
                        onClick={() => {
                          const sections = selectedPage.sections.filter((s) => s.id !== section.id)
                          updatePage(selectedPage.id, { sections })
                          if (selectedSectionId === section.id) setSelectedSectionId(sections[0]?.id || '')
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <select
                    value={addSectionType}
                    onChange={(e) => setAddSectionType(e.target.value as SectionType)}
                    className="flex-1 rounded-lg border px-2 py-1.5 text-xs"
                  >
                    {ALL_SECTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SECTION_META[t].label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2 py-1.5 text-xs font-semibold text-white"
                    onClick={() => {
                      const section = createSection(addSectionType)
                      updatePage(selectedPage.id, { sections: [...selectedPage.sections, section] })
                      setSelectedSectionId(section.id)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                {selectedPage.isCustom && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (!confirm('Delete this custom page?')) return
                      const pages = doc.pages.filter((p) => p.id !== selectedPage.id)
                      updatePages(pages)
                      setSelectedPageId(pages[0]?.id || '')
                      setSelectedSectionId(pages[0]?.sections[0]?.id || '')
                    }}
                  >
                    Delete custom page
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a page</p>
            )}
          </div>

          {/* Section content / page settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {selectedPage ? (
              <>
                <div className="mb-4 flex gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setEditorTab('content')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      editorTab === 'content' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Section content
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('settings')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      editorTab === 'settings' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Page settings
                  </button>
                </div>

                {editorTab === 'settings' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      SEO and publish settings for <strong>{selectedPage.title}</strong>.
                    </p>
                    <Field
                      label="SEO title"
                      value={String(selectedPage.seoTitle || '')}
                      onChange={(v) => updatePage(selectedPage.id, { seoTitle: v })}
                    />
                    <Field
                      label="SEO description"
                      value={String(selectedPage.seoDescription || '')}
                      onChange={(v) => updatePage(selectedPage.id, { seoDescription: v })}
                      multiline
                      rows={4}
                    />
                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">Public URL:</span>{' '}
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">
                          {publicUrl}
                        </a>
                      </p>
                      <p className="mt-2">
                        <span className="font-semibold text-slate-800">Type:</span>{' '}
                        {selectedPage.isCustom ? 'Custom CMS page' : 'Built-in website page'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Home page section order is partly fixed in the homepage design; About and custom pages follow
                        this layout order exactly.
                      </p>
                    </div>
                  </div>
                ) : selectedSection ? (
                  <>
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-slate-900">
                        {SECTION_META[selectedSection.type]?.label || selectedSection.type}
                      </h2>
                      <p className="text-sm text-slate-500">{SECTION_META[selectedSection.type]?.description}</p>
                    </div>
                    <SectionLayoutPicker
                      value={resolveSectionLayout(selectedSection)}
                      onChange={(layout) =>
                        updateSection(selectedPage.id, selectedSection.id, { layout })
                      }
                    />
                    <SectionEditor
                      section={selectedSection}
                      onChange={(data) => updateSection(selectedPage.id, selectedSection.id, { data })}
                    />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a section in the layout panel to edit its content.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a page to start editing.</p>
            )}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
