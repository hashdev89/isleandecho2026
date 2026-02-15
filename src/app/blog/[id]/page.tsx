/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '../../../components/Header'
import { Calendar, Clock, User, ArrowLeft, Share2, Bookmark, Check, Copy } from 'lucide-react'

const SAVED_POSTS_KEY = 'isleandecho_saved_blog_posts'

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

function getSavedPosts(): { id: string; title: string; url: string }[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAVED_POSTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch('/api/blog')
        const posts = await response.json()
        
        if (response.ok) {
          setAllPosts(posts)
          const foundPost = posts.find((p: any) => String(p.id) === String(resolvedParams.id))
          
          if (foundPost && foundPost.status === 'Published') {
            setPost(foundPost)
          } else {
            setError('Blog post not found or not published')
          }
        } else {
          setError('Failed to load blog post')
        }
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError('Error loading blog post')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogPost()
  }, [resolvedParams.id])

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${resolvedParams.id}` : ''
  const shareTitle = post?.title ?? ''
  const shareText = post?.description ?? post?.excerpt ?? ''

  useEffect(() => {
    if (!post) return
    const list = getSavedPosts()
    setSaved(list.some((p) => String(p.id) === String(post.id)))
  }, [post])

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${resolvedParams.id}` : postUrl
    const title = post?.title ?? ''
    const text = post?.description ?? post?.excerpt ?? ''
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        setShareOpen(false)
      } catch (err: any) {
        if (err?.name !== 'AbortError') setShareOpen(true)
      }
    } else {
      setShareOpen(true)
    }
  }, [post, resolvedParams.id, postUrl])

  const copyLink = useCallback(async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${resolvedParams.id}` : postUrl
    try {
      await navigator.clipboard.writeText(url)
      setCopyDone(true)
      setShareOpen(false)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setShareOpen(false)
    }
  }, [resolvedParams.id, postUrl])

  const handleSave = useCallback(() => {
    if (!post) return
    const list = getSavedPosts()
    const idStr = String(post.id)
    const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${resolvedParams.id}` : ''
    const entry = { id: idStr, title: post.title ?? '', url }
    const exists = list.some((p) => String(p.id) === idStr)
    const next = exists ? list.filter((p) => String(p.id) !== idStr) : [...list, entry]
    try {
      localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(next))
      setSaved(!exists)
    } catch {
      // ignore
    }
  }, [post, resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading blog post...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-8">{error || "The blog post you're looking for doesn't exist."}</p>
            <button
              onClick={() => router.push('/blog')}
              className="flex items-center mx-auto text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section - image background with 90% black overlay */}
      <section className="relative min-h-[28rem] flex flex-col justify-end text-white">
        {post.image ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${post.image})` }}
            />
            <div className="absolute inset-0 bg-black/90" aria-hidden />
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}
        <div className="relative container mx-auto px-4 py-16">
          <button
            onClick={() => router.push('/blog')}
            className="flex items-center text-white hover:text-gray-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </button>
          
          <div className="max-w-6xl">
            <div className="flex items-center text-sm text-gray-300 mb-4">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium mr-4">
                {post.category}
              </span>
              <User className="w-4 h-4 mr-1" />
              <span className="mr-4">{post.author}</span>
              <Calendar className="w-4 h-4 mr-1" />
              <span className="mr-4">{new Date(post.date).toLocaleDateString()}</span>
              <Clock className="w-4 h-4 mr-1" />
              <span>{post.readTime}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {post.description}
            </p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
            
            {/* Action Buttons - Share (social + copy) & Save in browser */}
            <div className="flex items-center gap-4 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => (shareOpen ? setShareOpen(false) : handleShare())}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                {shareOpen && (
                  <>
                    <div className="absolute left-0 top-full mt-1 py-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                      <button
                        type="button"
                        onClick={copyLink}
                        className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        {copyDone ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copyDone ? 'Copied!' : 'Copy link'}
                      </button>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(postUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        X (Twitter)
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        Facebook
                      </a>
                      <a
                        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(shareTitle)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        LinkedIn
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + postUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100"
                      >
                        WhatsApp
                      </a>
                    </div>
                    <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShareOpen(false)} />
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${saved ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {saved ? <Check className="w-4 h-4 mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - no image in body */}
              <div className="lg:col-span-2">
                {/* Article Content with clear paragraph separation */}
                <article className="prose prose-lg max-w-none prose-p:mb-5 prose-p:leading-relaxed prose-headings:mb-4 prose-headings:mt-6 first:prose-p:mt-0">
                  <div className="text-gray-700">
                    {post.content ? (
                      (() => {
                        const html = post.content.trim()
                        const hasTags = /<[a-z][\s\S]*>/i.test(html)
                        if (hasTags) {
                          return <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
                        }
                        return (
                          <div className="blog-content space-y-5">
                            {html.split(/\n\n+/).filter(Boolean).map((para: string, i: number) => (
                              <p key={i} className="leading-relaxed">
                                {para.split(/\n/).join(' ')}
                              </p>
                            ))}
                          </div>
                        )
                      })()
                    ) : (
                      <div className="space-y-5">
                        <p className="text-lg leading-relaxed">
                          {post.description || post.excerpt || 'Content coming soon...'}
                        </p>
                        <p className="text-lg leading-relaxed">
                          This blog post is currently being updated with more detailed content.
                          Please check back soon for the complete article.
                        </p>
                      </div>
                    )}
                  </div>
                </article>

                {/* Author Bio */}
                <div className="bg-gray-100 rounded-lg p-6 mt-8">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {post.author.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.author}</h3>
                      <p className="text-gray-600 text-sm">Travel writer and Sri Lanka expert</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Related Posts */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Related Posts</h3>
                    <div className="space-y-4">
                      {allPosts
                        .filter(p => p.id !== post.id && p.category === post.category && p.status === 'Published')
                        .slice(0, 3)
                        .map(relatedPost => (
                          <div key={relatedPost.id} className="flex items-start space-x-3">
                            <Image
                              src={relatedPost.image || '/placeholder-image.jpg'}
                              alt={relatedPost.title}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                {relatedPost.title}
                              </h4>
                              <p className="text-gray-500 text-xs mt-1">
                                {new Date(relatedPost.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
                    <div className="space-y-2">
                      {Array.from(new Set(allPosts.filter(p => p.status === 'Published').map(p => p.category))).map(category => (
                        <button
                          key={category}
                          onClick={() => router.push(`/blog?category=${category}`)}
                          className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
