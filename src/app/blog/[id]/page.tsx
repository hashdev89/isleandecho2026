/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '../../../components/Header'
import { Calendar, Clock, User, ArrowLeft, Play, Share2, Bookmark } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Bookmark className="w-4 h-4 mr-2" />
                Save
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
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Featured Image/Video */}
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden mb-8">
                  {post.video ? (
                    <div className="relative w-full h-full">
                      <iframe
                        src={post.video}
                        title={post.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={post.image || '/placeholder-image.svg'}
                      alt={post.title}
                      width={800}
                      height={400}
                      className="w-full h-full object-cover"
                      priority
                    />
                  )}
                </div>

                {/* Article Content */}
                <article className="prose prose-lg max-w-none">
                  <div className="text-gray-700 leading-relaxed">
                    {post.content ? (
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    ) : (
                      <div>
                        <p className="mb-6 text-lg leading-relaxed">
                          {post.description || post.excerpt || 'Content coming soon...'}
                        </p>
                        <p className="mb-6 text-lg leading-relaxed">
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
