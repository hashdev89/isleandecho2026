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
} from 'lucide-react'
import ImageSelector from '../../../components/ImageSelector'
import {
  ALL_SECTION_TYPES,
  SECTION_META,
  createBlankPage,
  createSection,
  normalizeSiteContent,
  type CmsPage,
  type PageSection,
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
          <Field label="Body" value={String(d.body || '')} onChange={(v) => set('body', v)} multiline rows={5} />
          <Field label="Body (2nd paragraph)" value={String(d.body2 || '')} onChange={(v) => set('body2', v)} multiline rows={4} />
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
      return <Field label="HTML" value={String(d.html || '')} onChange={(v) => set('html', v)} multiline rows={8} />
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
    if (!doc || !newPageTitle.trim() || !newPageSlug.trim()) {
      alert('Enter a page title and slug (e.g. /offers)')
      return
    }
    const page = createBlankPage(newPageTitle.trim(), newPageSlug.trim())
    if (doc.pages.some((p) => p.slug === page.slug)) {
      alert('A page with that slug already exists')
      return
    }
    updatePages([...doc.pages, page])
    setSelectedPageId(page.id)
    setSelectedSectionId(page.sections[0]?.id || '')
    setNewPageTitle('')
    setNewPageSlug('')
    setView('pages')
  }

  const footer = (doc?.footer || {}) as Record<string, unknown>

  if (loadingData || !doc) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading site content…</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Content</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage every page layout: add pages, add sections, reorder, and edit copy. Changes sync to the live site after
            save.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save all'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('pages')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            view === 'pages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          Pages & layouts
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add page</p>
              <input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border px-2 py-1.5 text-sm"
              />
              <input
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="/offers"
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
                Custom pages publish at <code className="rounded bg-slate-100 px-1">/p/your-slug</code>. Built-in routes
                (/about, /tours, …) use the matching slug.
              </p>
            </div>
          </div>

          {/* Layout / sections */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {selectedPage ? (
              <>
                <div className="mb-3 space-y-2">
                  <h2 className="text-sm font-bold text-slate-900">Layout</h2>
                  <Field
                    label="Page title"
                    value={selectedPage.title}
                    onChange={(v) => updatePage(selectedPage.id, { title: v })}
                  />
                  <Field
                    label="Slug"
                    value={selectedPage.slug}
                    onChange={(v) => updatePage(selectedPage.id, { slug: v, isCustom: !['/', '/about', '/contact', '/tours', '/rent-car', '/destinations', '/blog', '/custom-booking'].includes(v) })}
                  />
                  <button
                    type="button"
                    onClick={() => updatePage(selectedPage.id, { enabled: !selectedPage.enabled })}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
                  >
                    {selectedPage.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {selectedPage.enabled ? 'Page enabled' : 'Page disabled'}
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

          {/* Section content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {selectedSection && selectedPage ? (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    {SECTION_META[selectedSection.type]?.label || selectedSection.type}
                  </h2>
                  <p className="text-sm text-slate-500">{SECTION_META[selectedSection.type]?.description}</p>
                </div>
                <SectionEditor
                  section={selectedSection}
                  onChange={(data) => updateSection(selectedPage.id, selectedSection.id, { data })}
                />
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a section to edit its content.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
