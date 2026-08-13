import { NextRequest, NextResponse } from 'next/server'
import { loadSeoStore, saveSeoStore, type SeoStore } from '@/lib/siteSeo'

function toAnalytics(store: SeoStore) {
  return {
    googleAnalyticsId: store.googleAnalyticsId || '',
    googleTagManagerId: store.googleTagManagerId || '',
    googleSearchConsoleId: store.googleSearchConsoleId || '',
    googleSearchConsoleHtmlFile: store.googleSearchConsoleHtmlFile || '',
    googleSearchConsoleHtmlToken: store.googleSearchConsoleHtmlToken || '',
    facebookPixelId: store.facebookPixelId || '',
    googleAdsId: store.googleAdsId || '',
    bingWebmasterId: store.bingWebmasterId || '',
    yandexWebmasterId: store.yandexWebmasterId || '',
    updatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const analytics = toAnalytics(await loadSeoStore())
    return NextResponse.json({ success: true, data: analytics })
  } catch (error: unknown) {
    console.error('Error loading analytics:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load analytics settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const saved = await saveSeoStore({
      googleAnalyticsId: body.googleAnalyticsId || '',
      googleTagManagerId: body.googleTagManagerId || '',
      googleSearchConsoleId: body.googleSearchConsoleId || '',
      googleSearchConsoleHtmlFile: body.googleSearchConsoleHtmlFile || '',
      googleSearchConsoleHtmlToken: body.googleSearchConsoleHtmlToken || '',
      facebookPixelId: body.facebookPixelId || '',
      googleAdsId: body.googleAdsId || '',
      bingWebmasterId: body.bingWebmasterId || '',
      yandexWebmasterId: body.yandexWebmasterId || '',
    })

    return NextResponse.json({ success: true, data: toAnalytics(saved) })
  } catch (error: unknown) {
    console.error('Error updating analytics:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update analytics settings' },
      { status: 500 }
    )
  }
}
