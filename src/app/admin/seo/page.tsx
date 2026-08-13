'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Tag,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Download,
  X
} from 'lucide-react'

interface SEOKeyword {
  id: string
  keyword: string
  category: string
  priority: 'high' | 'medium' | 'low'
  searchVolume?: number
  difficulty?: number
  currentRank?: number
  targetRank: number
  status: 'active' | 'inactive' | 'monitoring'
  createdAt: string
  updatedAt: string
}

interface MetaTag {
  id: string
  page: string
  title: string
  description: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonical?: string
  robots?: string
  createdAt: string
  updatedAt: string
}

interface AnalyticsSettings {
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

export default function SEOManagement() {
  const [activeTab, setActiveTab] = useState('keywords')
  const [keywords, setKeywords] = useState<SEOKeyword[]>([])
  const [metaTags, setMetaTags] = useState<MetaTag[]>([])
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: '',
    googleTagManagerId: '',
    googleSearchConsoleId: '',
    googleSearchConsoleHtmlFile: '',
    googleSearchConsoleHtmlToken: '',
    facebookPixelId: '',
    googleAdsId: '',
    bingWebmasterId: '',
    yandexWebmasterId: ''
  })
  const [loading, setLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    category: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    targetRank: 1
  })
  const [newMetaTag, setNewMetaTag] = useState({
    page: '',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonical: '',
    robots: 'index,follow'
  })
  const [editingKeyword, setEditingKeyword] = useState<SEOKeyword | null>(null)
  const [editingMetaTag, setEditingMetaTag] = useState<MetaTag | null>(null)

  const tabs = [
    { id: 'keywords', name: 'Keywords', icon: Search },
    { id: 'meta', name: 'Meta Tags', icon: Tag },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'settings', name: 'SEO Settings', icon: Settings }
  ]

  const keywordCategories = [
    'Primary Keywords',
    'Long-tail Keywords',
    'Location-based',
    'Service-based',
    'Competitor Keywords',
    'Brand Keywords'
  ]

  const pages = [
    'Home',
    'Tours',
    'Destinations',
    'About',
    'Contact',
    'Blog',
    'Custom Booking',
    'Rent Car'
  ]

  useEffect(() => {
    loadSEOData()
  }, [])

  const loadSEOData = async () => {
    setLoading(true)
    try {
      // Load keywords
      const keywordsRes = await fetch('/api/seo/keywords')
      const keywordsData = await keywordsRes.json()
      if (keywordsData.success) {
        setKeywords(keywordsData.data)
      }

      // Load meta tags
      const metaRes = await fetch('/api/seo/meta-tags')
      const metaData = await metaRes.json()
      if (metaData.success) {
        setMetaTags(metaData.data)
      }

      // Load analytics settings
      const analyticsRes = await fetch('/api/seo/analytics')
      const analyticsData = await analyticsRes.json()
      if (analyticsData.success) {
        setAnalyticsSettings({
          googleAnalyticsId: '',
          googleTagManagerId: '',
          googleSearchConsoleId: '',
          googleSearchConsoleHtmlFile: '',
          googleSearchConsoleHtmlToken: '',
          facebookPixelId: '',
          googleAdsId: '',
          bingWebmasterId: '',
          yandexWebmasterId: '',
          ...analyticsData.data,
        })
      }
    } catch (error) {
      console.error('Error loading SEO data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.keyword.trim()) return

    try {
      const response = await fetch('/api/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyword)
      })

      const result = await response.json()
      if (result.success) {
        setKeywords([...keywords, result.data])
        setNewKeyword({ keyword: '', category: '', priority: 'medium', targetRank: 1 })
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
    }
  }

  const updateKeyword = async () => {
    if (!editingKeyword || !editingKeyword.keyword.trim()) return

    try {
      const response = await fetch('/api/seo/keywords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingKeyword,
          updatedAt: new Date().toISOString()
        })
      })

      const result = await response.json()
      if (result.success) {
        setKeywords(keywords.map(k => k.id === editingKeyword.id ? result.data : k))
        setEditingKeyword(null)
        alert('Keyword updated successfully!')
      }
    } catch (error) {
      console.error('Error updating keyword:', error)
      alert('Error updating keyword. Please try again.')
    }
  }

  const editKeyword = (keyword: SEOKeyword) => {
    setEditingKeyword({ ...keyword })
  }

  const cancelEditKeyword = () => {
    setEditingKeyword(null)
  }

  const addMetaTag = async () => {
    if (!newMetaTag.page.trim() || !newMetaTag.title.trim()) return

    try {
      const response = await fetch('/api/seo/meta-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMetaTag,
          keywords: newMetaTag.keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      })

      const result = await response.json()
      if (result.success) {
        setMetaTags([...metaTags, result.data])
        setNewMetaTag({
          page: '',
          title: '',
          description: '',
          keywords: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          canonical: '',
          robots: 'index,follow'
        })
      }
    } catch (error) {
      console.error('Error adding meta tag:', error)
    }
  }

  const updateMetaTag = async () => {
    if (!editingMetaTag || !editingMetaTag.page.trim() || !editingMetaTag.title.trim()) return

    try {
      const response = await fetch('/api/seo/meta-tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingMetaTag,
          updatedAt: new Date().toISOString()
        })
      })

      const result = await response.json()
      if (result.success) {
        setMetaTags(metaTags.map(m => m.id === editingMetaTag.id ? result.data : m))
        setEditingMetaTag(null)
        alert('Meta tag updated successfully!')
      }
    } catch (error) {
      console.error('Error updating meta tag:', error)
      alert('Error updating meta tag. Please try again.')
    }
  }

  const editMetaTag = (metaTag: MetaTag) => {
    setEditingMetaTag({ ...metaTag })
  }

  const cancelEditMetaTag = () => {
    setEditingMetaTag(null)
  }

  const saveAnalyticsSettings = async () => {
    try {
      const response = await fetch('/api/seo/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsSettings)
      })

      const result = await response.json()
      if (result.success) {
        alert('Analytics settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving analytics settings:', error)
    }
  }

  const deleteKeyword = async (id: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return

    try {
      const response = await fetch(`/api/seo/keywords?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setKeywords(keywords.filter(k => k.id !== id))
      }
    } catch (error) {
      console.error('Error deleting keyword:', error)
    }
  }

  const deleteMetaTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meta tag?')) return

    try {
      const response = await fetch(`/api/seo/meta-tags?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setMetaTags(metaTags.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Error deleting meta tag:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'monitoring': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO & Analytics Management</h1>
          <p className="text-gray-600">Manage keywords, meta tags, and analytics settings</p>
        </div>
        <button
          onClick={loadSEOData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Website SEO setup confirmation */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Website SEO setup status</h2>
        <p className="text-sm text-gray-600 mb-4">
          Core SEO is always enabled. Tracking and verification tags are loaded from the Analytics tab and shown on the live site when configured below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">Core metadata</p>
              <p className="text-xs text-gray-600">Title, description, OG, Twitter, robots</p>
            </div>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sitemap</p>
              <p className="text-xs text-gray-600">/sitemap.xml</p>
            </div>
          </div>
          <div className="flex items-center p-3 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-900">Robots.txt</p>
              <p className="text-xs text-gray-600">Crawl rules, sitemap ref</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.googleAnalyticsId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.googleAnalyticsId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Google Analytics</p>
              <p className="text-xs text-gray-600">{analyticsSettings.googleAnalyticsId ? 'Configured' : 'Set in Analytics tab'}</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.googleTagManagerId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.googleTagManagerId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Google Tag Manager</p>
              <p className="text-xs text-gray-600">{analyticsSettings.googleTagManagerId ? 'Configured' : 'Set in Analytics tab'}</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.googleSearchConsoleId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.googleSearchConsoleId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Search Console</p>
              <p className="text-xs text-gray-600">{analyticsSettings.googleSearchConsoleId ? 'Verification meta added' : 'Add verification code in Analytics'}</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.facebookPixelId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.facebookPixelId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Facebook Pixel</p>
              <p className="text-xs text-gray-600">{analyticsSettings.facebookPixelId ? 'Configured' : 'Set in Analytics tab'}</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.googleAdsId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.googleAdsId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Google Ads</p>
              <p className="text-xs text-gray-600">{analyticsSettings.googleAdsId ? 'Configured' : 'Set in Analytics tab'}</p>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg border ${analyticsSettings.bingWebmasterId ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'}`}>
            {analyticsSettings.bingWebmasterId ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mr-2" /> : <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mr-2" />}
            <div>
              <p className="text-sm font-medium text-gray-900">Bing Webmaster</p>
              <p className="text-xs text-gray-600">{analyticsSettings.bingWebmasterId ? 'Verification meta added' : 'Add verification in Analytics'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" /> Sitemap
          </a>
          <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" /> Robots.txt
          </a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" /> Google Search Console
          </a>
          <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" /> Bing Webmaster
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          {/* Add New Keyword */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Keyword</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({...newKeyword, keyword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keyword"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newKeyword.category}
                  onChange={(e) => setNewKeyword({...newKeyword, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {keywordCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newKeyword.priority}
                  onChange={(e) => setNewKeyword({...newKeyword, priority: e.target.value as 'high' | 'medium' | 'low'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addKeyword}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </button>
              </div>
            </div>
          </div>

          {/* Keywords List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Keywords ({keywords.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.map((keyword) => (
                    <tr key={keyword.id}>
                      {editingKeyword && editingKeyword.id === keyword.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editingKeyword.keyword}
                              onChange={(e) => setEditingKeyword({...editingKeyword, keyword: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editingKeyword.category}
                              onChange={(e) => setEditingKeyword({...editingKeyword, category: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Category</option>
                              {keywordCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editingKeyword.priority}
                              onChange={(e) => setEditingKeyword({...editingKeyword, priority: e.target.value as 'high' | 'medium' | 'low'})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editingKeyword.status}
                              onChange={(e) => setEditingKeyword({...editingKeyword, status: e.target.value as 'active' | 'inactive' | 'monitoring'})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="monitoring">Monitoring</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={editingKeyword.targetRank}
                              onChange={(e) => setEditingKeyword({...editingKeyword, targetRank: parseInt(e.target.value)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={updateKeyword}
                                className="text-green-600 hover:text-green-900"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={cancelEditKeyword}
                                className="text-gray-600 hover:text-gray-900"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{keyword.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(keyword.priority)}`}>
                              {keyword.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(keyword.status)}`}>
                              {keyword.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{keyword.targetRank}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => editKeyword(keyword)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteKeyword(keyword.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Meta Tags Tab */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          {/* Add New Meta Tag */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Meta Tag</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                <select
                  value={newMetaTag.page}
                  onChange={(e) => setNewMetaTag({...newMetaTag, page: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Page</option>
                  {pages.map(page => (
                    <option key={page} value={page.toLowerCase()}>{page}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newMetaTag.title}
                  onChange={(e) => setNewMetaTag({...newMetaTag, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Page title"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newMetaTag.description}
                  onChange={(e) => setNewMetaTag({...newMetaTag, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Meta description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={newMetaTag.keywords}
                  onChange={(e) => setNewMetaTag({...newMetaTag, keywords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                <input
                  type="text"
                  value={newMetaTag.canonical}
                  onChange={(e) => setNewMetaTag({...newMetaTag, canonical: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://isleandecho.com/page"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={addMetaTag}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Meta Tag
                </button>
              </div>
            </div>
          </div>

          {/* Meta Tags List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Meta Tags ({metaTags.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metaTags.map((meta) => (
                    <tr key={meta.id}>
                      {editingMetaTag && editingMetaTag.id === meta.id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={editingMetaTag.page}
                              onChange={(e) => setEditingMetaTag({...editingMetaTag, page: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Page</option>
                              {pages.map(page => (
                                <option key={page} value={page.toLowerCase()}>{page}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editingMetaTag.title}
                              onChange={(e) => setEditingMetaTag({...editingMetaTag, title: e.target.value})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <textarea
                              value={editingMetaTag.description}
                              onChange={(e) => setEditingMetaTag({...editingMetaTag, description: e.target.value})}
                              rows={2}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editingMetaTag.keywords.join(', ')}
                              onChange={(e) => setEditingMetaTag({...editingMetaTag, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)})}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="keyword1, keyword2"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={updateMetaTag}
                                className="text-green-600 hover:text-green-900"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={cancelEditMetaTag}
                                className="text-gray-600 hover:text-gray-900"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 capitalize">{meta.page}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{meta.title}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{meta.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{meta.keywords.join(', ')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => editMetaTag(meta)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteMetaTag(meta.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Analytics & Tracking Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                <input
                  type="text"
                  value={analyticsSettings.googleAnalyticsId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleAnalyticsId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Tag Manager ID</label>
                <input
                  type="text"
                  value={analyticsSettings.googleTagManagerId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleTagManagerId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              <div className="md:col-span-2 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Add the property in <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Search Console</a>, then paste the HTML-tag verification code here. These values also live under Settings → SEO & Google.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Search Console (HTML tag)</label>
                <input
                  type="text"
                  value={analyticsSettings.googleSearchConsoleId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleSearchConsoleId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste google-site-verification content only"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Console HTML filename</label>
                <input
                  type="text"
                  value={analyticsSettings.googleSearchConsoleHtmlFile}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleSearchConsoleHtmlFile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="google1234567890.html"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Console HTML token (optional)</label>
                <input
                  type="text"
                  value={analyticsSettings.googleSearchConsoleHtmlToken}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleSearchConsoleHtmlToken: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Defaults to verification code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
                <input
                  type="text"
                  value={analyticsSettings.facebookPixelId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, facebookPixelId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456789012345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Ads ID</label>
                <input
                  type="text"
                  value={analyticsSettings.googleAdsId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, googleAdsId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AW-XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bing Webmaster</label>
                <input
                  type="text"
                  value={analyticsSettings.bingWebmasterId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, bingWebmasterId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Verification code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yandex Webmaster</label>
                <input
                  type="text"
                  value={analyticsSettings.yandexWebmasterId}
                  onChange={(e) => setAnalyticsSettings({...analyticsSettings, yandexWebmasterId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="yandex-verification code"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveAnalyticsSettings}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>

          {/* Analytics Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Analytics Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  {analyticsSettings.googleAnalyticsId ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Google Analytics</p>
                  <p className="text-sm text-gray-500">
                    {analyticsSettings.googleAnalyticsId ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  {analyticsSettings.googleTagManagerId ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Google Tag Manager</p>
                  <p className="text-sm text-gray-500">
                    {analyticsSettings.googleTagManagerId ? 'Configured' : 'Not configured'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">SEO Tools & Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rows = [['keyword', 'category', 'priority', 'status', 'targetRank'], ...keywords.map((k) => [k.keyword, k.category, k.priority, k.status, String(k.targetRank)])]
                      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'seo-keywords.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-3 text-blue-500" />
                    Export Keywords CSV
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const url = `${window.location.origin}/sitemap.xml`
                      await navigator.clipboard.writeText(url)
                      alert(`Copied: ${url}`)
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-3 text-blue-500" />
                    Copy Sitemap URL
                  </button>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-3 text-blue-500" />
                    Open Google Search Console
                  </a>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">SEO Checklist</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Sitemap generated</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Robots.txt configured</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700">Meta tags implemented</span>
                  </div>
                  <div className="flex items-center">
                    {analyticsSettings.googleAnalyticsId ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Google Analytics setup</span>
                  </div>
                  <div className="flex items-center">
                    {analyticsSettings.googleSearchConsoleId || analyticsSettings.googleSearchConsoleHtmlFile ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700">Google Search Console verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
