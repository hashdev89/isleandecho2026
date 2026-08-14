/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '../../components/Header'
import { Calendar, Clock, User, ArrowRight, Play } from 'lucide-react'
import { CmsPageHero } from '../../components/CmsPageSections'
import { useCmsPage } from '@/hooks/useSiteContent'

const categories = ["All", "Cultural Heritage", "Nature", "Wildlife", "Beaches", "Adventure", "Food"]

export default function BlogPage() {
  const { page } = useCmsPage('/blog')
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/blog', { cache: 'force-cache' })
        const posts = await response.json()
        
        if (response.ok) {
          const publishedPosts = posts.filter((post: any) => post.status === 'Published')
          setBlogPosts(publishedPosts)
        } else {
          setError('Failed to load blog posts')
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setError('Error loading blog posts')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogPosts()
  }, [])

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-[var(--foam)] lp-section-ink">
      <Header />
      
      <CmsPageHero
        page={page}
        fallback={{
          kicker: 'Inspiration',
          title: 'Travel blog',
          subtitle: "Stories, tips, and insights from Sri Lanka's most beautiful destinations",
        }}
      />

      <section className="py-6 sm:py-8 bg-white/70 border-b border-black/5">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-black/10 rounded-full focus:ring-2 focus:ring-[var(--lagoon)] focus:border-transparent text-base min-h-[44px] touch-manipulation bg-[var(--foam)] text-[var(--ink)]"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-start">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors min-h-[36px] touch-manipulation ${
                    selectedCategory === category
                      ? 'bg-[var(--lagoon-deep)] text-white'
                      : 'bg-white text-[var(--ink-soft)] border border-black/10 hover:border-[var(--lagoon)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="w-full max-w-[1920px] mx-auto lp-gutter">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--lagoon)]"></div>
              <span className="ml-2 text-[var(--ink-soft)]">Loading blog posts...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[var(--lagoon-deep)] text-white px-6 py-3 rounded-full hover:bg-[var(--lagoon)] min-h-[44px] touch-manipulation"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 min-[820px]:grid-cols-2 min-[1180px]:grid-cols-3 gap-5">
              {filteredPosts.map(post => (
              <article key={post.id} className="group">
                <button
                  type="button"
                  onClick={() => router.push(`/blog/${post.id}`)}
                  className="lp-photo-card w-full text-left h-[400px] cursor-pointer"
                >
                  {post.video ? (
                    <div className="absolute inset-0">
                      <iframe
                        src={post.video}
                        title={post.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={post.image || '/placeholder-image.svg'}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-[var(--sun)] text-[var(--lagoon-deep)] px-3 py-1 rounded-full text-xs font-bold">
                      {post.category}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75 mb-3">
                      {post.author && (
                        <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author}</span>
                      )}
                      {post.date && (
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(post.date).toLocaleDateString()}</span>
                      )}
                      {post.readTime && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-white/80 text-sm line-clamp-2 mb-3">{post.excerpt || post.description}</p>
                    <span className="inline-flex items-center gap-1 text-[var(--sun)] font-bold text-sm">
                      Read more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-[var(--ink)] mb-2">No posts found</h3>
              <p className="text-[var(--ink-soft)]">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
