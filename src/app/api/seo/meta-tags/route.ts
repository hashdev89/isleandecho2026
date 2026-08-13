import { NextRequest, NextResponse } from 'next/server'
import { loadSeoJson, saveSeoJson } from '@/lib/seoDataStore'

type MetaTag = {
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

async function loadMetaTags(): Promise<MetaTag[]> {
  const data = await loadSeoJson<MetaTag[]>('meta-tags.json', [])
  return Array.isArray(data) ? data : []
}

export async function GET() {
  try {
    const metaTags = await loadMetaTags()
    return NextResponse.json({ success: true, data: metaTags })
  } catch (error) {
    console.error('Error loading meta tags:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load meta tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const metaTags = await loadMetaTags()

    const newMetaTag: MetaTag = {
      id: `meta_${Date.now()}`,
      page: body.page,
      title: body.title,
      description: body.description,
      keywords: body.keywords || [],
      ogTitle: body.ogTitle || body.title,
      ogDescription: body.ogDescription || body.description,
      ogImage: body.ogImage || '',
      twitterTitle: body.twitterTitle || body.title,
      twitterDescription: body.twitterDescription || body.description,
      twitterImage: body.twitterImage || body.ogImage || '',
      canonical: body.canonical || '',
      robots: body.robots || 'index,follow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    metaTags.push(newMetaTag)
    await saveSeoJson('meta-tags.json', metaTags)

    return NextResponse.json({ success: true, data: newMetaTag }, { status: 201 })
  } catch (error) {
    console.error('Error creating meta tag:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create meta tag' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const metaTags = await loadMetaTags()
    const metaTagIndex = metaTags.findIndex((m) => m.id === body.id)
    if (metaTagIndex === -1) {
      return NextResponse.json({ success: false, message: 'Meta tag not found' }, { status: 404 })
    }

    const updatedMetaTag: MetaTag = {
      ...metaTags[metaTagIndex],
      page: body.page,
      title: body.title,
      description: body.description,
      keywords: body.keywords || [],
      ogTitle: body.ogTitle || body.title,
      ogDescription: body.ogDescription || body.description,
      ogImage: body.ogImage || '',
      twitterTitle: body.twitterTitle || body.title,
      twitterDescription: body.twitterDescription || body.description,
      twitterImage: body.twitterImage || body.ogImage || '',
      canonical: body.canonical || '',
      robots: body.robots || 'index,follow',
      updatedAt: new Date().toISOString(),
    }

    metaTags[metaTagIndex] = updatedMetaTag
    await saveSeoJson('meta-tags.json', metaTags)

    return NextResponse.json({ success: true, data: updatedMetaTag })
  } catch (error) {
    console.error('Error updating meta tag:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update meta tag' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'Meta tag ID is required' }, { status: 400 })
    }

    const metaTags = await loadMetaTags()
    const filteredMetaTags = metaTags.filter((m) => m.id !== id)
    if (filteredMetaTags.length === metaTags.length) {
      return NextResponse.json({ success: false, message: 'Meta tag not found' }, { status: 404 })
    }

    await saveSeoJson('meta-tags.json', filteredMetaTags)
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting meta tag:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete meta tag' },
      { status: 500 }
    )
  }
}
