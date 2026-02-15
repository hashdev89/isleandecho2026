import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabaseClient'

// Persistent file-based storage for fallback (local only; Vercel filesystem is read-only)
const FALLBACK_FILE = path.join(process.cwd(), 'data', 'blog.json')

const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

interface BlogPost {
  id: number | string
  title: string
  description: string
  excerpt: string
  author: string
  date: string
  readTime: string
  image: string
  video?: string | null
  category: string
  status: string
  tags: string[]
  content: string
}

type BlogRow = {
  id: number | string
  title: string
  description: string | null
  excerpt: string | null
  author: string | null
  date: string | null
  read_time: string | null
  image: string | null
  video: string | null
  category: string | null
  status: string | null
  tags: unknown
  content: string | null
  slug?: string | null
  created_at?: string
  updated_at?: string
}

/** Generate URL-safe slug from title (for DB slug column). */
function slugFromTitle(title: string): string {
  const s = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return s || `post-${Date.now()}`
}

function rowToPost(row: BlogRow & Record<string, unknown>): BlogPost {
  const raw = row.id ?? row.Id ?? row.ID
  let id: number | string =
    raw == null || raw === ''
      ? 0
      : typeof raw === 'number' && Number.isInteger(raw)
        ? raw
        : typeof raw === 'string'
          ? (Number(raw).toString() === raw ? Number(raw) : raw)
          : Number(raw)
  if (typeof id === 'number' && Number.isNaN(id)) id = 0
  return {
    id,
    title: row.title,
    description: row.description ?? '',
    excerpt: row.excerpt ?? '',
    author: row.author ?? '',
    date: row.date ?? '',
    readTime: row.read_time ?? '',
    image: row.image ?? '',
    video: row.video ?? null,
    category: row.category ?? '',
    status: row.status ?? 'Draft',
    tags: Array.isArray(row.tags) ? row.tags : [],
    content: row.content ?? '',
  }
}

function postToRow(post: Partial<BlogPost> & { slug?: string }, slugOverride?: string): Record<string, unknown> {
  const slug = slugOverride ?? post.slug ?? (post.title ? slugFromTitle(post.title) : `post-${Date.now()}`)
  return {
    slug,
    title: post.title,
    description: post.description ?? null,
    excerpt: post.excerpt ?? null,
    author: post.author ?? null,
    date: post.date ?? null,
    read_time: post.readTime ?? null,
    image: post.image ?? null,
    video: post.video ?? null,
    category: post.category ?? null,
    status: post.status ?? 'Draft',
    tags: post.tags ?? [],
    content: post.content ?? null,
  }
}

const loadFallbackBlogPosts = (): BlogPost[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.error('Error loading fallback blog posts:', error)
  }
  return []
}

const saveFallbackBlogPosts = (posts: BlogPost[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(posts, null, 2))
  } catch (error) {
    console.error('Error saving fallback blog posts:', error)
  }
}

const isSupabaseConfigured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'
  )

// On Vercel the filesystem is read-only; file fallback would not persist. Only use Supabase.
const isVercel = process.env.VERCEL === '1'

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('id', { ascending: false })

      if (!error && data && data.length >= 0) {
        const posts = (data as BlogRow[]).map(rowToPost)
        return NextResponse.json(posts)
      }
      console.error('Supabase blog_posts fetch error:', error)
    }

    const fallbackPosts = loadFallbackBlogPosts()
    return NextResponse.json(fallbackPosts)
  } catch (error: unknown) {
    console.error('Blog posts API error:', error)
    const fallbackPosts = loadFallbackBlogPosts()
    return NextResponse.json(fallbackPosts)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const readTime = body.readTime || `${Math.ceil((body.content || '').split(' ').length / 200)} min read`
    const date = body.date || new Date().toISOString().split('T')[0]
    const status = body.status || 'Draft'

    // On Vercel we must use Supabase; file writes do not persist
    if (isVercel && !isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Blog storage not configured on Vercel. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env, and create the blog_posts table in Supabase (see supabase/migrations).',
        },
        { status: 503 }
      )
    }

    if (isSupabaseConfigured()) {
      const insertPayload = postToRow({
        ...body,
        readTime,
        date,
        status,
      })
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .insert(insertPayload)
        .select('*')
        .single()

      if (!error && data) {
        const post = rowToPost(data as BlogRow)
        return NextResponse.json(post, { status: 201 })
      }
      console.error('Supabase blog_posts insert error:', error)
      // On Vercel do not fall back to file; return the real error so user can fix (e.g. create table)
      if (isVercel) {
        const message = (error as { message?: string })?.message ?? String(error)
        return NextResponse.json(
          {
            error: 'Failed to create blog post in database.',
            details: message.includes('does not exist') ? 'Create the blog_posts table in Supabase (SQL in supabase/migrations/20250215000000_create_blog_posts.sql).' : message,
          },
          { status: 500 }
        )
      }
    }

    const fallbackPosts = loadFallbackBlogPosts()
    const numericIds = fallbackPosts.map((p) => (typeof p.id === 'number' ? p.id : Number(p.id))).filter((n) => Number.isFinite(n)) as number[]
    const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1
    const newPost: BlogPost = {
      id: newId,
      ...body,
      date,
      status,
      readTime,
    }
    fallbackPosts.unshift(newPost)
    saveFallbackBlogPosts(fallbackPosts)
    return NextResponse.json(newPost, { status: 201 })
  } catch (error: unknown) {
    console.error('Create blog post error:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...rest } = body
    const idForDb = id != null && String(id).trim() !== '' ? (typeof id === 'string' ? id.trim() : String(id)) : null
    if (idForDb == null) {
      return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
    }

    if (isVercel && !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Blog storage not configured on Vercel. Add Supabase env vars and create blog_posts table.' },
        { status: 503 }
      )
    }

    if (isSupabaseConfigured()) {
      const row = postToRow(rest)
      const { slug: _slug, ...updatePayload } = row
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq('id', idForDb)
        .select('*')
        .single()

      if (!error && data) {
        return NextResponse.json(rowToPost(data as BlogRow))
      }
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog post not found', details: `No post with id ${idForDb}.` }, { status: 404 })
      }
      console.error('Supabase blog_posts update error:', error)
      if (isVercel) {
        const message = (error as { message?: string })?.message ?? String(error)
        return NextResponse.json(
          { error: 'Failed to update blog post.', details: message.includes('does not exist') ? 'Create the blog_posts table in Supabase.' : message },
          { status: 500 }
        )
      }
    }

    const fallbackPosts = loadFallbackBlogPosts()
    const numericId = Number(idForDb)
    const idx = fallbackPosts.findIndex((p) => String(p.id) === idForDb || (Number.isFinite(numericId) && Number(p.id) === numericId))
    if (idx === -1) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }
    const updated = { ...fallbackPosts[idx], ...rest }
    fallbackPosts[idx] = updated
    saveFallbackBlogPosts(fallbackPosts)
    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Update blog post error:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')
    if (idParam == null || idParam.trim() === '') {
      return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 })
    }
    const idForDb = idParam.trim()
    if (idForDb === '0' && isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Invalid post id.',
        details: 'This usually means the list is out of date. Refresh the blog list and try again.',
      }, { status: 400 })
    }

    if (isVercel && !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Blog storage not configured on Vercel.' },
        { status: 503 }
      )
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .delete()
        .eq('id', idForDb)
        .select('id')

      if (error) {
        console.error('Supabase blog_posts delete error:', error)
        return NextResponse.json(
          { error: 'Failed to delete blog post.', details: (error as { message?: string })?.message },
          { status: 500 }
        )
      }
      if (!data || data.length === 0) {
        return NextResponse.json({ error: 'Blog post not found', details: `No post with id ${idForDb}.` }, { status: 404 })
      }
      return NextResponse.json({ deleted: true })
    }

    const fallbackPosts = loadFallbackBlogPosts()
    const numericId = Number(idForDb)
    const idx = fallbackPosts.findIndex((p) => String(p.id) === idForDb || (Number.isFinite(numericId) && Number(p.id) === numericId))
    if (idx === -1) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }
    const deleted = fallbackPosts.splice(idx, 1)[0]
    saveFallbackBlogPosts(fallbackPosts)
    return NextResponse.json(deleted)
  } catch (error: unknown) {
    console.error('Delete blog post error:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
