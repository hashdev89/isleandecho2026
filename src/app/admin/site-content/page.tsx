'use client'

import { useState, useEffect } from 'react'
import {
  Save,
  Layout,
  Image as ImageIcon,
  Type,
  List,
  Mail,
  FileText,
  Menu,
  Home,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import ImageSelector from '../../../components/ImageSelector'

type SiteContent = Record<string, unknown>

const defaultContent: SiteContent = {}

export default function AdminSiteContentPage() {
  const [activeTab, setActiveTab] = useState('hero')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [saved, setSaved] = useState(false)
  const [content, setContent] = useState<SiteContent>(defaultContent)
  const [heroImageSelectorOpen, setHeroImageSelectorOpen] = useState(false)
  const [heroImageSelectIndex, setHeroImageSelectIndex] = useState<number | null>(null)
  const [sriLankaImageSelectorOpen, setSriLankaImageSelectorOpen] = useState(false)
  const [aboutImageSelectorOpen, setAboutImageSelectorOpen] = useState(false)
  const [solutionsImageSelectorOpen, setSolutionsImageSelectorOpen] = useState(false)
  const [solutionsImageSelectIndex, setSolutionsImageSelectIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true)
        const res = await fetch('/api/site-content')
        const json = await res.json()
        if (json.success && json.data) setContent(json.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  const update = (section: string, data: Record<string, unknown>) => {
    setContent((prev) => ({ ...prev, [section]: { ...(prev[section] as Record<string, unknown>), ...data } }))
  }

  const updateNested = (section: string, key: string, value: unknown) => {
    setContent((prev) => {
      const sec = (prev[section] as Record<string, unknown>) || {}
      return { ...prev, [section]: { ...sec, [key]: value } }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const json = await res.json()
      if (json.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert(json.error || 'Failed to save')
      }
    } catch (e) {
      alert('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'hero', label: 'Hero', icon: Home },
    { id: 'featuredTours', label: 'Featured Tours', icon: Layout },
    { id: 'stats', label: 'Stats', icon: List },
    { id: 'sriLankaBanner', label: 'Sri Lanka Banner', icon: Type },
    { id: 'features', label: 'Why Choose / Features', icon: CheckCircle },
    { id: 'solutions', label: 'Discover Sri Lanka (Solutions)', icon: ImageIcon },
    { id: 'destinationsSection', label: 'Destinations Section', icon: Layout },
    { id: 'cta', label: 'CTA Section', icon: Type },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'footer', label: 'Footer & Menus', icon: Menu },
  ]

  const hero = (content.hero as Record<string, unknown>) || {}
  const featuredTours = (content.featuredTours as Record<string, unknown>) || {}
  const stats = (content.stats as Array<{ number?: string; label?: string }>) || []
  const sriLanka = (content.sriLankaBanner as Record<string, unknown>) || {}
  const features = (content.features as Record<string, unknown>) || {}
  const solutions = (content.solutions as Record<string, unknown>) || {}
  const destinationsSection = (content.destinationsSection as Record<string, unknown>) || {}
  const cta = (content.cta as Record<string, unknown>) || {}
  const about = (content.about as Record<string, unknown>) || {}
  const contact = (content.contact as Record<string, unknown>) || {}
  const footer = (content.footer as Record<string, unknown>) || {}

  const Input = ({
    label,
    value,
    onChange,
    multiline,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    multiline?: boolean
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      )}
    </div>
  )

  if (loadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site Content (CMS)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage home page titles, descriptions, images, about, contact, and footer menus.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saved ? <CheckCircle className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {loading ? 'Saving...' : saved ? 'Saved' : 'Save all'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hero Section</h2>
            <Input label="Badge text" value={String(hero.badgeText ?? '')} onChange={(v) => update('hero', { badgeText: v })} />
            <Input label="Headline (before highlight)" value={String(hero.headline ?? '')} onChange={(v) => update('hero', { headline: v })} />
            <Input label="Headline highlight (e.g. Sri Lanka)" value={String(hero.headlineHighlight ?? '')} onChange={(v) => update('hero', { headlineHighlight: v })} />
            <Input label="Subtitle" value={String(hero.subtitle ?? '')} onChange={(v) => update('hero', { subtitle: v })} multiline />
            <Input label="CTA button text" value={String(hero.ctaPrimaryText ?? '')} onChange={(v) => update('hero', { ctaPrimaryText: v })} />
            <Input label="CTA button URL" value={String(hero.ctaPrimaryUrl ?? '')} onChange={(v) => update('hero', { ctaPrimaryUrl: v })} />
            <Input label="Video URL (YouTube embed)" value={String(hero.videoUrl ?? '')} onChange={(v) => update('hero', { videoUrl: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hero carousel images</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload or select an image for each slide, like in the Sri Lanka banner section.</p>
              <div className="space-y-4">
                {(Array.isArray(hero.heroImages) ? (hero.heroImages as string[]) : []).map((url, index) => (
                  <div key={index} className="relative inline-block align-top">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700/50 inline-block min-w-[280px]">
                      {typeof url === 'string' && url ? (
                        <img
                          src={url}
                          alt={`Slide ${index + 1}`}
                          className="max-w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.svg' }}
                        />
                      ) : (
                        <div className="w-48 h-40 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                          No image
                        </div>
                      )}
                      <div className="mt-2 space-y-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Image URL</label>
                        <input
                          type="url"
                          value={typeof url === 'string' ? url : ''}
                          onChange={(e) => {
                            const list = Array.isArray(hero.heroImages) ? [...(hero.heroImages as string[])] : []
                            list[index] = e.target.value
                            update('hero', { heroImages: list })
                          }}
                          placeholder="Paste image URL or use Upload below"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHeroImageSelectIndex(index)
                              setHeroImageSelectorOpen(true)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            {url ? 'Change Image' : 'Upload or Select Image'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const list = Array.isArray(hero.heroImages) ? (hero.heroImages as string[]).filter((_, i) => i !== index) : []
                              update('hero', { heroImages: list })
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            title="Remove slide"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setHeroImageSelectIndex(Array.isArray(hero.heroImages) ? (hero.heroImages as string[]).length : 0)
                  setHeroImageSelectorOpen(true)
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add slide
              </button>
            </div>
          </div>
        )}

        {activeTab === 'featuredTours' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Featured Tour Packages</h2>
            <Input label="Section title" value={String(featuredTours.title ?? '')} onChange={(v) => update('featuredTours', { title: v })} />
            <Input label="Subtitle (optional)" value={String(featuredTours.subtitle ?? '')} onChange={(v) => update('featuredTours', { subtitle: v })} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stats Section (e.g. 500+ Happy Travelers)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">One stat per line: number,label (e.g. 500+,Happy Travelers)</p>
            <textarea
              value={stats.map((s) => `${s?.number ?? ''},${s?.label ?? ''}`).join('\n')}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean)
                const next = lines.map((line) => {
                  const [number, ...rest] = line.split(',')
                  return { number: (number ?? '').trim(), label: rest.join(',').trim() }
                })
                setContent((prev) => ({ ...prev, stats: next }))
              }}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {activeTab === 'sriLankaBanner' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sri Lanka Banner</h2>
            <Input label="Title" value={String(sriLanka.title ?? '')} onChange={(v) => update('sriLankaBanner', { title: v })} />
            <Input label="Subtitle" value={String(sriLanka.subtitle ?? '')} onChange={(v) => update('sriLankaBanner', { subtitle: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background image</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Paste an image URL or upload/select from library.</p>
              <div className="space-y-2 mb-3">
                <input
                  type="url"
                  value={typeof sriLanka.backgroundImage === 'string' ? sriLanka.backgroundImage : ''}
                  onChange={(e) => update('sriLankaBanner', { backgroundImage: e.target.value })}
                  placeholder="https://... or leave empty and use Upload"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setSriLankaImageSelectorOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {sriLanka.backgroundImage ? 'Change Image' : 'Upload or Select Image'}
                </button>
              </div>
              {typeof sriLanka.backgroundImage === 'string' && sriLanka.backgroundImage ? (
                <div className="mt-4 relative inline-block">
                  <img
                    src={String(sriLanka.backgroundImage)}
                    alt="Banner background"
                    className="max-w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.svg' }}
                  />
                  <button
                    type="button"
                    onClick={() => update('sriLankaBanner', { backgroundImage: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Why Choose / Features</h2>
            <Input label="Section title" value={String(features.sectionTitle ?? '')} onChange={(v) => update('features', { sectionTitle: v })} />
            <Input label="Section subtitle" value={String(features.sectionSubtitle ?? '')} onChange={(v) => update('features', { sectionSubtitle: v })} multiline />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Feature items (title, description) – one per block. Edit in code or add a simple list: title|description per line.</p>
            <textarea
              value={Array.isArray(features.items)
                ? (features.items as Array<{ title?: string; description?: string }>)
                    .map((i) => `${i?.title ?? ''}|${i?.description ?? ''}`)
                    .join('\n')
                : ''}
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(Boolean)
                const items = lines.map((line) => {
                  const [title, ...rest] = line.split('|')
                  return { title: (title ?? '').trim(), description: rest.join('|').trim(), color: 'text-blue-600' }
                })
                setContent((prev) => ({ ...prev, features: { ...features, items } }))
              }}
              rows={8}
              placeholder="Safe & Secure Travel|Your safety is our priority..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Discover Sri Lanka (Solutions) Section</h2>
            <Input label="Section title" value={String(solutions.sectionTitle ?? '')} onChange={(v) => update('solutions', { sectionTitle: v })} />
            <Input label="Section subtitle" value={String(solutions.sectionSubtitle ?? '')} onChange={(v) => update('solutions', { sectionSubtitle: v })} multiline />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Solution items (each with image)</label>
              {(Array.isArray(solutions.items) ? (solutions.items as Array<{ title?: string; description?: string; image?: string; highlights?: string[] }>) : []).map((item, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-700/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Item {idx + 1}</span>
                  </div>
                  <Input label="Title" value={String(item?.title ?? '')} onChange={(v) => {
                    const items = [...(Array.isArray(solutions.items) ? (solutions.items as Array<Record<string, unknown>>) : [])]
                    if (!items[idx]) items[idx] = {}
                    items[idx] = { ...items[idx], title: v }
                    setContent((prev) => ({ ...prev, solutions: { ...solutions, items } }))
                  }} />
                  <Input label="Description" value={String(item?.description ?? '')} onChange={(v) => {
                    const items = [...(Array.isArray(solutions.items) ? (solutions.items as Array<Record<string, unknown>>) : [])]
                    if (!items[idx]) items[idx] = {}
                    items[idx] = { ...items[idx], description: v }
                    setContent((prev) => ({ ...prev, solutions: { ...solutions, items } }))
                  }} multiline />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image (URL or upload)</label>
                    <input
                      type="url"
                      value={String(item?.image ?? '')}
                      onChange={(e) => {
                        const items = [...(Array.isArray(solutions.items) ? (solutions.items as Array<Record<string, unknown>>) : [])]
                        if (!items[idx]) items[idx] = {}
                        items[idx] = { ...items[idx], image: e.target.value }
                        setContent((prev) => ({ ...prev, solutions: { ...solutions, items } }))
                      }}
                      placeholder="Paste image URL or use Upload below"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSolutionsImageSelectIndex(idx)
                          setSolutionsImageSelectorOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        {item?.image ? 'Change Image' : 'Upload or Select Image'}
                      </button>
                      {typeof item?.image === 'string' && item.image ? (
                        <div className="inline-block relative">
                          <img src={item.image} alt="" className="h-16 w-24 object-cover rounded border border-gray-200 dark:border-gray-600" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Highlights (comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(item?.highlights) ? (item.highlights as string[]).join(', ') : ''}
                      onChange={(e) => {
                        const highlights = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        const items = [...(Array.isArray(solutions.items) ? (solutions.items as Array<Record<string, unknown>>) : [])]
                        if (!items[idx]) items[idx] = {}
                        items[idx] = { ...items[idx], highlights }
                        setContent((prev) => ({ ...prev, solutions: { ...solutions, items } }))
                      }}
                      placeholder="e.g. Sigiriya, Temple of the Tooth"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'destinationsSection' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Destinations Section</h2>
            <Input label="Section title" value={String(destinationsSection.title ?? '')} onChange={(v) => update('destinationsSection', { title: v })} />
            <Input label="Section subtitle" value={String(destinationsSection.subtitle ?? '')} onChange={(v) => update('destinationsSection', { subtitle: v })} multiline />
          </div>
        )}

        {activeTab === 'cta' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CTA Section (Ready to Start…)</h2>
            <Input label="Title" value={String(cta.title ?? '')} onChange={(v) => update('cta', { title: v })} />
            <Input label="Subtitle" value={String(cta.subtitle ?? '')} onChange={(v) => update('cta', { subtitle: v })} multiline />
            <Input label="Primary button text" value={String(cta.primaryButtonText ?? '')} onChange={(v) => update('cta', { primaryButtonText: v })} />
            <Input label="Primary button URL" value={String(cta.primaryButtonUrl ?? '')} onChange={(v) => update('cta', { primaryButtonUrl: v })} />
            <Input label="Secondary button text" value={String(cta.secondaryButtonText ?? '')} onChange={(v) => update('cta', { secondaryButtonText: v })} />
            <Input label="Secondary button URL" value={String(cta.secondaryButtonUrl ?? '')} onChange={(v) => update('cta', { secondaryButtonUrl: v })} />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
            <Input label="Title" value={String(about.title ?? '')} onChange={(v) => update('about', { title: v })} />
            <Input label="Description" value={String(about.description ?? '')} onChange={(v) => update('about', { description: v })} multiline />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image (URL or upload)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Paste an image URL or upload/select from library.</p>
              <input
                type="url"
                value={String(about.image ?? '')}
                onChange={(e) => update('about', { image: e.target.value })}
                placeholder="https://... or use Upload below"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
              />
              <button
                type="button"
                onClick={() => setAboutImageSelectorOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {about.image ? 'Change Image' : 'Upload or Select Image'}
              </button>
              {typeof about.image === 'string' && about.image ? (
                <div className="mt-4 relative inline-block">
                  <img
                    src={String(about.image)}
                    alt="About"
                    className="max-w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.svg' }}
                  />
                  <button
                    type="button"
                    onClick={() => update('about', { image: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact</h2>
            <Input label="Title" value={String(contact.title ?? '')} onChange={(v) => update('contact', { title: v })} />
            <Input label="Description" value={String(contact.description ?? '')} onChange={(v) => update('contact', { description: v })} multiline />
            <Input label="Email" value={String(contact.email ?? '')} onChange={(v) => update('contact', { email: v })} />
            <Input label="Phone" value={String(contact.phone ?? '')} onChange={(v) => update('contact', { phone: v })} />
            <Input label="Address" value={String(contact.address ?? '')} onChange={(v) => update('contact', { address: v })} />
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Footer & Menus</h2>
            <Input label="Newsletter title" value={String(footer.newsletterTitle ?? '')} onChange={(v) => updateNested('footer', 'newsletterTitle', v)} />
            <Input label="Newsletter subtitle" value={String(footer.newsletterSubtitle ?? '')} onChange={(v) => updateNested('footer', 'newsletterSubtitle', v)} />
            <Input label="Newsletter button text" value={String(footer.newsletterButtonText ?? '')} onChange={(v) => updateNested('footer', 'newsletterButtonText', v)} />
            <Input label="Contact heading" value={String(footer.contactHeading ?? '')} onChange={(v) => updateNested('footer', 'contactHeading', v)} />
            <Input label="Contact phone" value={String(footer.contactPhone ?? '')} onChange={(v) => updateNested('footer', 'contactPhone', v)} />
            <Input label="Contact email" value={String(footer.contactEmail ?? '')} onChange={(v) => updateNested('footer', 'contactEmail', v)} />
            <Input label="Copyright text" value={String(footer.copyrightText ?? '')} onChange={(v) => updateNested('footer', 'copyrightText', v)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company links (label,url one per line)</label>
              <textarea
                value={Array.isArray(footer.companyLinks)
                  ? (footer.companyLinks as Array<{ label?: string; url?: string }>).map((l) => `${l?.label ?? ''},${l?.url ?? ''}`).join('\n')
                  : ''}
                onChange={(e) => {
                  const links = e.target.value.split('\n').filter(Boolean).map((line) => {
                    const [label, ...rest] = line.split(',')
                    return { label: (label ?? '').trim(), url: (rest.join(',').trim() || '#') }
                  })
                  setContent((prev) => ({ ...prev, footer: { ...footer, companyLinks: links } }))
                }}
                rows={4}
                placeholder="About Us,/about"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support links (label,url one per line)</label>
              <textarea
                value={Array.isArray(footer.supportLinks)
                  ? (footer.supportLinks as Array<{ label?: string; url?: string }>).map((l) => `${l?.label ?? ''},${l?.url ?? ''}`).join('\n')
                  : ''}
                onChange={(e) => {
                  const links = e.target.value.split('\n').filter(Boolean).map((line) => {
                    const [label, ...rest] = line.split(',')
                    return { label: (label ?? '').trim(), url: (rest.join(',').trim() || '#') }
                  })
                  updateNested('footer', 'supportLinks', links)
                }}
                rows={4}
                placeholder="Contact,/contact"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other services links (label,url one per line)</label>
              <textarea
                value={Array.isArray(footer.otherServicesLinks)
                  ? (footer.otherServicesLinks as Array<{ label?: string; url?: string }>).map((l) => `${l?.label ?? ''},${l?.url ?? ''}`).join('\n')
                  : ''}
                onChange={(e) => {
                  const links = e.target.value.split('\n').filter(Boolean).map((line) => {
                    const [label, ...rest] = line.split(',')
                    return { label: (label ?? '').trim(), url: (rest.join(',').trim() || '#') }
                  })
                  setContent((prev) => ({ ...prev, footer: { ...footer, otherServicesLinks: links } }))
                }}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hero carousel image selector */}
      <ImageSelector
        isOpen={heroImageSelectorOpen}
        onClose={() => {
          setHeroImageSelectorOpen(false)
          setHeroImageSelectIndex(null)
        }}
        onSelect={(imageUrl) => {
          const current = (content.hero as Record<string, unknown>)?.heroImages as string[] | undefined
          const list = Array.isArray(current) ? [...current] : []
          if (heroImageSelectIndex !== null) {
            list[heroImageSelectIndex] = imageUrl
          } else {
            list.push(imageUrl)
          }
          update('hero', { heroImages: list })
          setHeroImageSelectorOpen(false)
          setHeroImageSelectIndex(null)
        }}
        currentImageUrl={heroImageSelectIndex !== null && Array.isArray((content.hero as Record<string, unknown>)?.heroImages) ? ((content.hero as Record<string, unknown>).heroImages as string[])[heroImageSelectIndex] : undefined}
      />

      {/* Sri Lanka banner background image selector */}
      <ImageSelector
        isOpen={sriLankaImageSelectorOpen}
        onClose={() => setSriLankaImageSelectorOpen(false)}
        onSelect={(imageUrl) => {
          update('sriLankaBanner', { backgroundImage: imageUrl })
          setSriLankaImageSelectorOpen(false)
        }}
        currentImageUrl={sriLanka.backgroundImage ? String(sriLanka.backgroundImage) : undefined}
      />

      {/* About image selector */}
      <ImageSelector
        isOpen={aboutImageSelectorOpen}
        onClose={() => setAboutImageSelectorOpen(false)}
        onSelect={(imageUrl) => {
          update('about', { image: imageUrl })
          setAboutImageSelectorOpen(false)
        }}
        currentImageUrl={about.image ? String(about.image) : undefined}
      />

      {/* Solutions item image selector */}
      <ImageSelector
        isOpen={solutionsImageSelectorOpen}
        onClose={() => {
          setSolutionsImageSelectorOpen(false)
          setSolutionsImageSelectIndex(null)
        }}
        onSelect={(imageUrl) => {
          if (solutionsImageSelectIndex === null) return
          const items = [...(Array.isArray(solutions.items) ? (solutions.items as Array<Record<string, unknown>>) : [])]
          if (!items[solutionsImageSelectIndex]) items[solutionsImageSelectIndex] = {}
          items[solutionsImageSelectIndex] = { ...items[solutionsImageSelectIndex], image: imageUrl }
          setContent((prev) => ({ ...prev, solutions: { ...solutions, items } }))
          setSolutionsImageSelectorOpen(false)
          setSolutionsImageSelectIndex(null)
        }}
        currentImageUrl={
          solutionsImageSelectIndex !== null && Array.isArray(solutions.items) && (solutions.items as Array<{ image?: string }>)[solutionsImageSelectIndex]?.image
            ? (solutions.items as Array<{ image?: string }>)[solutionsImageSelectIndex].image
            : undefined
        }
      />
    </div>
  )
}
