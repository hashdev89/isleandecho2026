import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { normalizeSiteContent, syncLegacyFromPages, type SiteContentDoc } from '@/lib/siteContent'

const SITE_CONTENT_FILE = path.join(process.cwd(), 'data', 'site-content.json')
const SITE_CONTENT_BUCKET = 'site-content'
const SITE_CONTENT_KEY = 'content.json'

const hasSupabase = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function loadFromSupabase(): Promise<Record<string, unknown> | null> {
  if (!hasSupabase) return null
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(SITE_CONTENT_BUCKET)
      .download(SITE_CONTENT_KEY)
    if (error || !data) return null
    const text = await data.text()
    return JSON.parse(text) as Record<string, unknown>
  } catch (e) {
    console.error('Site content load from Supabase:', e)
    return null
  }
}

async function saveToSupabase(content: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabase) return { ok: false, error: 'Supabase not configured' }
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === SITE_CONTENT_BUCKET)
    if (!bucketExists) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(
        SITE_CONTENT_BUCKET,
        { public: false, allowedMimeTypes: ['application/json'], fileSizeLimit: '5MB' }
      )
      if (createErr) {
        console.error('Site content bucket create:', createErr)
        return { ok: false, error: createErr.message }
      }
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(SITE_CONTENT_BUCKET)
      .upload(SITE_CONTENT_KEY, blob, { contentType: 'application/json', upsert: true })
    if (uploadErr) {
      console.error('Site content upload:', uploadErr)
      return { ok: false, error: uploadErr.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('Site content save to Supabase:', e)
    return { ok: false, error: msg }
  }
}

function ensureDataDir() {
  const dir = path.dirname(SITE_CONTENT_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function loadSiteContentFromFile(): Record<string, unknown> | null {
  try {
    if (fs.existsSync(SITE_CONTENT_FILE)) {
      const raw = fs.readFileSync(SITE_CONTENT_FILE, 'utf8')
      return JSON.parse(raw) as Record<string, unknown>
    }
  } catch (e) {
    console.error('Error loading site content from file:', e)
  }
  return null
}

function saveSiteContentToFile(data: Record<string, unknown>): boolean {
  try {
    ensureDataDir()
    fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (e) {
    console.error('Error saving site content to file:', e)
    return false
  }
}

async function loadNormalized(): Promise<SiteContentDoc> {
  let stored: Record<string, unknown> | null = await loadFromSupabase()
  if (stored == null) stored = loadSiteContentFromFile()
  return normalizeSiteContent(stored)
}

export async function GET() {
  try {
    const data = await loadNormalized()
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
        },
      }
    )
  } catch (e) {
    console.error('Site content GET error:', e)
    return NextResponse.json({ success: false, error: 'Failed to load site content' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const existing = await loadNormalized()
    const mergedRaw = {
      ...existing,
      ...body,
      pages: Array.isArray(body.pages) ? body.pages : existing.pages,
      footer: {
        ...(existing.footer || {}),
        ...((body.footer as Record<string, unknown>) || {}),
      },
    }
    const merged = syncLegacyFromPages(normalizeSiteContent(mergedRaw))

    const onVercel = !!process.env.VERCEL
    if (onVercel) {
      if (!hasSupabase) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Site content cannot be saved on Vercel without Supabase. In Vercel → Settings → Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.',
          },
          { status: 500 }
        )
      }
      const result = await saveToSupabase(merged)
      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error ?? 'Failed to save site content to Supabase Storage.' },
          { status: 500 }
        )
      }
    } else {
      const saved = (await saveToSupabase(merged)).ok || saveSiteContentToFile(merged)
      if (!saved) {
        return NextResponse.json(
          { success: false, error: 'Failed to save site content.' },
          { status: 500 }
        )
      }
    }
    return NextResponse.json({ success: true, data: merged, message: 'Site content saved' })
  } catch (e) {
    console.error('Site content PUT error:', e)
    return NextResponse.json({ success: false, error: 'Failed to save site content' }, { status: 500 })
  }
}
