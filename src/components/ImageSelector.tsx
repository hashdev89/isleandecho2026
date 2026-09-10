'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Search, Loader2, Upload, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react'

interface ImageItem {
  id: string
  name: string
  url: string
  category?: string
}

interface ImageSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string) => void
  currentImageUrl?: string
  /** Prefill upload category when the modal opens */
  defaultCategory?: string
  /** Start on upload tab when useful (e.g. vehicle editor) */
  defaultTab?: 'select' | 'upload'
}

interface UploadedFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function ImageSelector({
  isOpen,
  onClose,
  onSelect,
  currentImageUrl,
  defaultCategory = 'Tours',
  defaultTab = 'select',
}: ImageSelectorProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select')
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [category, setCategory] = useState(defaultCategory)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'General',
    'Destinations',
    'Tours',
    'Wildlife',
    'Landscapes',
    'Culture',
    'Food',
    'Accommodation',
    'Activities',
    'Transport'
  ]

  useEffect(() => {
    if (isOpen) {
      fetchImages()
      setActiveTab(defaultTab)
      setCategory(defaultCategory)
      setUploadFiles([])
      setSearchTerm('')
    }
  }, [isOpen, defaultCategory, defaultTab])

  const fetchImages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/images?limit=80')
      
      // Check content type first
      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      
      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Failed to fetch images: ${response.status} ${response.statusText}`
        if (isJson) {
          try {
            const errorResult = await response.json()
            errorMessage = errorResult.error || errorMessage
          } catch {
            // If JSON parse fails, use default message
          }
        } else {
          // If not JSON, it's likely an HTML error page
          errorMessage = `Server error (${response.status}). Please check the server logs.`
        }
        throw new Error(errorMessage)
      }
      
      // If not JSON, throw error
      if (!isJson) {
        throw new Error('Server returned non-JSON response. This might be an error page.')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setImages(result.data || [])
      } else {
        setError(result.error || 'Failed to load images')
      }
    } catch (err) {
      console.error('Error fetching images:', err)
      setError((err as Error).message || 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl)
    onClose()
  }

  // Upload functionality
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadedFile[] = []
    
    Array.from(selectedFiles).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        newFiles.push({
          file,
          preview: '',
          progress: 0,
          status: 'error',
          error: 'Invalid file type. Only images are allowed.'
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        newFiles.push({
          file,
          preview: '',
          progress: 0,
          status: 'error',
          error: 'File too large. Maximum size is 10MB.'
        })
        return
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      
      newFiles.push({
        file,
        preview,
        progress: 0,
        status: 'pending'
      })
    })

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const removeUploadFile = (index: number) => {
    const file = uploadFiles[index]
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setUploading(true)

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileIndex = uploadFiles.findIndex(f => f.file === pendingFiles[i].file)
      
      try {
        // Update status to uploading
        setUploadFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: 'uploading', progress: 0 } : f
        ))

        const formData = new FormData()
        formData.append('image', pendingFiles[i].file)
        formData.append('category', category)

        const response = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        })

        // Check if response is ok
        if (!response.ok) {
          const text = await response.text()
          let errorMessage = `Upload failed: ${response.status} ${response.statusText}`
          
          // Try to parse as JSON if possible
          try {
            const errorResult = JSON.parse(text)
            errorMessage = errorResult.error || errorMessage
          } catch {
            // If not JSON, use the text or default message
            if (text && text.length < 200) {
              errorMessage = text
            }
          }
          
          throw new Error(errorMessage)
        }

        // Check content type
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          throw new Error('Server returned non-JSON response. This might be an error page.')
        }

        const result = await response.json()

        if (result.success) {
          // Update status to success
          setUploadFiles(prev => prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'success', progress: 100 } : f
          ))
          
          // Refresh images list
          await fetchImages()
          
          // If this is the first successful upload, automatically select it
          if (i === 0) {
            handleSelect(result.data.url)
          }
        } else {
          // Update status to error
          setUploadFiles(prev => prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'error', error: result.error || 'Upload failed' } : f
          ))
        }
      } catch (error: any) {
        console.error('Upload error:', error)
        // Update status to error
        setUploadFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: 'error', error: error.message || 'Upload failed' } : f
        ))
      }
    }

    setUploading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Select or Upload Image</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('select')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'select'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Select Existing
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload New
          </button>
        </div>

        {/* Select Tab Content */}
        {activeTab === 'select' && (
          <>
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm ? 'No images found matching your search' : 'No images available'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelect(image.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                        currentImageUrl === image.url
                          ? 'border-blue-600 ring-2 ring-blue-300'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    loading="lazy"
                    unoptimized={image.url.includes('supabase.co')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-image.svg'
                    }}
                  />
                      {currentImageUrl === image.url && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Selected
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Upload Tab Content */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPEG, PNG, GIF, WebP (max 10MB each)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2 inline" />
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* File List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Selected Files ({uploadFiles.length})
                </h3>
                {uploadFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <Image
                          src={file.preview}
                          alt={file.file.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover rounded"
                          unoptimized
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {file.status === 'pending' && (
                        <span className="text-sm text-gray-500">Ready</span>
                      )}
                      {file.status === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-blue-600">Uploading...</span>
                        </div>
                      )}
                      {file.status === 'success' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Success</span>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Error</span>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    {file.error && (
                      <div className="flex-1">
                        <p className="text-sm text-red-600">{file.error}</p>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeUploadFile(index)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          {activeTab === 'upload' && (
            <button
              onClick={handleUpload}
              disabled={uploading || uploadFiles.filter(f => f.status === 'pending').length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {uploadFiles.filter(f => f.status === 'pending').length} File{uploadFiles.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {activeTab === 'select' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

