import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabaseClient'
import { buildPageMetadata, getSiteSeo } from '@/lib/siteSeo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const seo = await getSiteSeo()
  let title = 'Travel story'
  let description = 'Sri Lanka travel stories from ISLE & ECHO.'
  let image: string | undefined
  try {
    const bySlug = await supabaseAdmin
      .from('blog')
      .select('title, description, excerpt, image, slug, id')
      .eq('slug', id)
      .maybeSingle()
    const byId =
      bySlug.data
        ? bySlug
        : await supabaseAdmin
            .from('blog')
            .select('title, description, excerpt, image, slug, id')
            .eq('id', id)
            .maybeSingle()
    const data = byId.data
    if (data) {
      title = String(data.title || title)
      description = String(data.description || data.excerpt || description)
      image = data.image ? String(data.image) : undefined
    }
  } catch {
    /* use defaults */
  }
  return buildPageMetadata(seo, {
    title,
    description,
    path: `/blog/${id}`,
    image,
  })
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children
}
