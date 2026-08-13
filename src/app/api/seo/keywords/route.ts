import { NextRequest, NextResponse } from 'next/server'
import { loadSeoJson, saveSeoJson } from '@/lib/seoDataStore'

type SeoKeyword = {
  id: string
  keyword: string
  category: string
  priority: string
  searchVolume?: number
  difficulty?: number
  currentRank?: number | null
  targetRank: number
  status: string
  createdAt: string
  updatedAt: string
}

async function loadKeywords(): Promise<SeoKeyword[]> {
  const data = await loadSeoJson<SeoKeyword[]>('keywords.json', [])
  return Array.isArray(data) ? data : []
}

export async function GET() {
  try {
    const keywords = await loadKeywords()
    return NextResponse.json({ success: true, data: keywords })
  } catch (error) {
    console.error('Error loading keywords:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load keywords' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const keywords = await loadKeywords()
    const newKeyword: SeoKeyword = {
      id: `keyword_${Date.now()}`,
      keyword: body.keyword,
      category: body.category,
      priority: body.priority || 'medium',
      searchVolume: body.searchVolume || 0,
      difficulty: body.difficulty || 0,
      currentRank: body.currentRank || null,
      targetRank: body.targetRank || 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    keywords.push(newKeyword)
    await saveSeoJson('keywords.json', keywords)
    return NextResponse.json({ success: true, data: newKeyword }, { status: 201 })
  } catch (error) {
    console.error('Error creating keyword:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create keyword' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const keywords = await loadKeywords()
    const keywordIndex = keywords.findIndex((k) => k.id === body.id)
    if (keywordIndex === -1) {
      return NextResponse.json({ success: false, message: 'Keyword not found' }, { status: 404 })
    }
    const updatedKeyword: SeoKeyword = {
      ...keywords[keywordIndex],
      keyword: body.keyword,
      category: body.category,
      priority: body.priority,
      status: body.status,
      targetRank: body.targetRank,
      updatedAt: new Date().toISOString(),
    }
    keywords[keywordIndex] = updatedKeyword
    await saveSeoJson('keywords.json', keywords)
    return NextResponse.json({ success: true, data: updatedKeyword })
  } catch (error) {
    console.error('Error updating keyword:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update keyword' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'Keyword ID is required' }, { status: 400 })
    }
    const keywords = await loadKeywords()
    const filteredKeywords = keywords.filter((k) => k.id !== id)
    if (filteredKeywords.length === keywords.length) {
      return NextResponse.json({ success: false, message: 'Keyword not found' }, { status: 404 })
    }
    await saveSeoJson('keywords.json', filteredKeywords)
    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting keyword:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete keyword' },
      { status: 500 }
    )
  }
}
