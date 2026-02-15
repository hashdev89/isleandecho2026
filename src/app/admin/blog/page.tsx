'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Edit, Trash2, Eye, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'

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

const categories = ["All", "Cultural Heritage", "Nature", "Wildlife", "Beaches", "Adventure", "Food"]
const statuses = ["All", "Published", "Draft", "Archived"]

export default function AdminBlogPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  
  // Check if user has access (admin or staff only)
  const hasAccess = user?.role === 'admin' || user?.role === 'staff'

  useEffect(() => {
    fetchBlogPosts()
  }, [])

  const fetchBlogPosts = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/blog')
      const result = await response.json()
      
      if (response.ok && Array.isArray(result)) {
        setPosts(result.map((p: BlogPost) => ({
          ...p,
          id: p.id ?? 0,
        })))
      } else {
        console.error('Failed to fetch blog posts', result?.error)
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    const matchesStatus = selectedStatus === "All" || post.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDelete = async (id: number | string) => {
    const idStr = id != null ? String(id).trim() : ''
    if (!idStr || idStr === '0') {
      alert('Cannot delete: invalid post id. Refresh the blog list and try again.')
      return
    }
    if (confirm('Are you sure you want to delete this blog post?')) {
      try {
        const response = await fetch(`/api/blog?id=${encodeURIComponent(idStr)}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setPosts(posts.filter(post => String(post.id) !== idStr))
        } else {
          const result = await response.json()
          alert(`Failed to delete post: ${result?.error || 'Unknown error'}${result?.details ? ` (${result.details})` : ''}`)
        }
      } catch (error) {
        console.error('Error deleting blog post:', error)
        alert('Failed to delete blog post. Please try again.')
      }
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600">Manage your blog content and articles</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchBlogPosts}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/blog/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
          <div className="text-gray-600">Total Posts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {posts.filter(post => post.status === 'Published').length}
          </div>
          <div className="text-gray-600">Published</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {posts.filter(post => post.status === 'Draft').length}
          </div>
          <div className="text-gray-600">Drafts</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {posts.filter(post => post.status === 'Archived').length}
          </div>
          <div className="text-gray-600">Archived</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading blog posts...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post, index) => (
                <tr key={post.id != null && post.id !== '' ? `post-${String(post.id)}` : `post-row-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          className="h-12 w-12 rounded-lg object-cover"
                          src={post.image || '/placeholder-image.svg'}
                          alt={post.title}
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {post.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      post.status === 'Published' ? 'bg-green-100 text-green-800' :
                      post.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/blog/${post.id}`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={post.id === 0 || post.id === '0' || String(post.id).trim() === ''}
                        title={post.id === 0 || post.id === '0' ? 'Refresh the list to fix this post\'s id' : 'Delete post'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
