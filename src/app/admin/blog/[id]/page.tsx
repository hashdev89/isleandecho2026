'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Save, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

const categories = ["Cultural Heritage", "Nature", "Wildlife", "Beaches", "Adventure", "Food"]
const statuses = ["Draft", "Published", "Archived"]

export default function BlogPostEditor({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [post, setPost] = useState<{
    id: number | string
    title: string
    description: string
    excerpt: string
    author: string
    date: string
    readTime: string
    image: string
    video: string
    category: string
    status: string
    tags: string[]
    content: string
  }>({
    id: 0,
    title: "",
    description: "",
    excerpt: "",
    author: "Isle & Echo Team",
    date: new Date().toISOString().split('T')[0],
    readTime: "",
    image: "",
    video: "",
    category: "Cultural Heritage",
    status: "Draft",
    tags: [] as string[],
    content: ""
  })
  const [newTag, setNewTag] = useState("")
  const [isNewPost, setIsNewPost] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        setError('')
        const resolvedParams = await params
        
        if (resolvedParams.id === 'new') {
          setIsNewPost(true)
          setPost({
            id: 0,
            title: "",
            description: "",
            excerpt: "",
            author: "Isle & Echo Team",
            date: new Date().toISOString().split('T')[0],
            readTime: "",
            image: "",
            video: "",
            category: "Cultural Heritage",
            status: "Draft",
            tags: [],
            content: ""
          })
        } else {
          // Load existing post data from API
          const response = await fetch('/api/blog')
          const data = await response.json()
          const posts = Array.isArray(data) ? data : []
          if (!response.ok) {
            setError((data && typeof data.error === 'string') ? data.error : 'Failed to load blog posts')
            setLoading(false)
            return
          }
          const foundPost = posts.find((p: unknown) => {
            const post = p as Record<string, unknown>
            return String(post.id) === String(resolvedParams.id)
          })
          
          if (foundPost) {
            const rec = foundPost as Record<string, unknown>
            const rawId = rec.id
            const id = rawId != null && rawId !== '' ? (typeof rawId === 'number' ? rawId : String(rawId)) : 0
            setPost({
              id,
              title: (rec.title as string) || "",
              description: (rec.description as string) || "",
              excerpt: (rec.excerpt as string) || "",
              author: (rec.author as string) || "Isle & Echo Team",
              date: (rec.date as string) || new Date().toISOString().split('T')[0],
              readTime: (rec.readTime as string) || "",
              image: (rec.image as string) || "",
              video: (rec.video as string) || "",
              category: (rec.category as string) || "Cultural Heritage",
              status: (rec.status as string) || "Draft",
              tags: (Array.isArray(rec.tags) ? rec.tags : []) as string[],
              content: (rec.content as string) || ""
            })
          } else {
            setError('Blog post not found')
          }
        }
      } catch (err) {
        console.error('Error loading blog post:', err)
        setError('Failed to load blog post')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [params])

  const handleSave = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!post.title || !post.description || !post.content) {
        setError('Please fill in all required fields (Title, Description, Content)')
        setIsLoading(false)
        return
      }

      const postData = {
        ...post,
        readTime: post.readTime || `${Math.ceil(post.content.split(' ').length / 200)} min read`
      }

      if (isNewPost) {
        // Create new post
        const response = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        })

        if (!response.ok) {
          const result = await response.json()
          const msg = result.error || 'Failed to create blog post'
          throw new Error(result.details ? `${msg} ${result.details}` : msg)
        }
      } else {
        // Update existing post
        const response = await fetch('/api/blog', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        })

        if (!response.ok) {
          const result = await response.json()
          const msg = result.error || 'Failed to update blog post'
          throw new Error(result.details ? `${msg} ${result.details}` : msg)
        }
      }

      // Redirect to blog list
      router.push('/admin/blog')
    } catch (err: unknown) {
      console.error('Error saving blog post:', err)
      setError((err as Error).message || 'Failed to save blog post')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !post.tags.includes(newTag.trim())) {
      setPost({ ...post, tags: [...post.tags, newTag.trim()] })
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setPost({ ...post, tags: post.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading blog post...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Link
            href="/admin/blog"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Blog Posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/blog"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewPost ? 'Create New Post' : 'Edit Post'}
            </h1>
            <p className="text-gray-600">Manage your blog post content</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Post'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Title *
            </label>
            <input
              type="text"
              value={post.title || ''}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              placeholder="Enter post title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={post.description || ''}
              onChange={(e) => setPost({ ...post, description: e.target.value })}
              placeholder="Enter post description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt *
            </label>
            <textarea
              value={post.excerpt || ''}
              onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
              placeholder="Enter post excerpt..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Content *
            </label>
            <textarea
              value={post.content || ''}
              onChange={(e) => setPost({ ...post, content: e.target.value })}
              placeholder="Enter the full blog post content..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author & Date */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={post.author || ''}
                  onChange={(e) => setPost({ ...post, author: e.target.value })}
                  placeholder="Enter author name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Date *
                </label>
                <input
                  type="date"
                  value={post.date || ''}
                  onChange={(e) => setPost({ ...post, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Read Time
                </label>
                <input
                  type="text"
                  value={post.readTime || ''}
                  onChange={(e) => setPost({ ...post, readTime: e.target.value })}
                  placeholder="e.g., 8 min read"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={post.category || ''}
                  onChange={(e) => setPost({ ...post, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={post.status || 'Draft'}
                  onChange={(e) => setPost({ ...post, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="space-y-4">
              <div className="flex">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  value={post.image || ''}
                  onChange={(e) => setPost({ ...post, image: e.target.value })}
                  placeholder="Enter image URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL (YouTube Embed)
                </label>
                <input
                  type="url"
                  value={post.video || ''}
                  onChange={(e) => setPost({ ...post, video: e.target.value })}
                  placeholder="Enter YouTube embed URL..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {post.image && (
                <div className="mt-4">
                  <Image
                    src={post.image || '/placeholder-image.svg'}
                    alt="Preview"
                    width={600}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
