'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Phone, X, CheckCircle, Circle, Search, Filter } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabaseClient'

interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_name: string
  sender_role: 'admin' | 'staff' | 'customer'
  content: string
  message_type: 'text' | 'system' | 'whatsapp_link'
  read_at: string | null
  created_at: string
}

interface Conversation {
  id: string
  customer_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  assigned_to: string | null
  status: 'active' | 'closed' | 'archived'
  last_message_at: string
  created_at: string
  unread_count?: number
}

export default function AdminChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active')
  const [conversationCounts, setConversationCounts] = useState({ active: 0, closed: 0, all: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(0)
  const prevLastMessageIdRef = useRef<string | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('94741415812') // Default WhatsApp number

  // Load WhatsApp phone from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json()
        if (result.success && result.data?.whatsappPhone) {
          setWhatsappPhone(result.data.whatsappPhone)
        }
      } catch (error) {
        console.error('Error loading WhatsApp phone:', error)
      }
    }
    loadSettings()
  }, [])

  // Load conversations
  const loadConversations = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      // First, fetch all conversations to get counts
      const allParams = new URLSearchParams()
      allParams.append('status', 'all')
      if (user?.role === 'staff') {
        allParams.append('assigned_to', user.id)
      }
      
      const allResponse = await fetch(`/api/chat/conversations?${allParams.toString()}`)
      const allResult = await allResponse.json()
      
      if (allResult.success && allResult.data) {
        const allConversations = allResult.data || []
        const activeCount = allConversations.filter((c: Conversation) => c.status === 'active').length
        const closedCount = allConversations.filter((c: Conversation) => c.status === 'closed').length
        const allCount = allConversations.length
        setConversationCounts({ active: activeCount, closed: closedCount, all: allCount })
      }
      
      // Now fetch filtered conversations
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      // Only filter by assigned_to for staff, admins can see all
      if (user?.role === 'staff') {
        params.append('assigned_to', user.id)
      }

      const response = await fetch(`/api/chat/conversations?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        const newConversations = result.data || []
        // Only update if conversations actually changed to prevent flickering
        setConversations((prev) => {
          // Check if count changed
          if (newConversations.length !== prev.length) {
            return newConversations
          }
          // Check if any conversation IDs are different
          const prevIds = new Set(prev.map(c => c.id))
          const hasNewConversations = newConversations.some((c: Conversation) => !prevIds.has(c.id))
          if (hasNewConversations) {
            return newConversations
          }
          // Check if last_message_at changed (new messages) or unread_count changed
          const hasUpdates = newConversations.some((newConv: Conversation) => {
            const oldConv = prev.find(c => c.id === newConv.id)
            if (!oldConv) return false
            return oldConv.last_message_at !== newConv.last_message_at || 
                   (oldConv.unread_count || 0) !== (newConv.unread_count || 0)
          })
          if (hasUpdates) {
            return newConversations
          }
          // No changes - return previous state to prevent re-render
          return prev
        })
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`)
      const result = await response.json()

      if (result.success) {
        const loadedMessages = result.data || []
        // Sort by created_at to ensure correct order
        loadedMessages.sort((a: Message, b: Message) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        setMessages(loadedMessages)
        // Reset scroll tracking when loading messages for a conversation
        prevMessagesLengthRef.current = loadedMessages.length
        prevLastMessageIdRef.current = loadedMessages.length > 0 ? loadedMessages[loadedMessages.length - 1]?.id || null : null
        // Mark messages as read
        await fetch('/api/chat/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId })
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    try {
      setSending(true)
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          sender_id: user?.id || null,
          sender_name: user?.name || 'Admin',
          sender_role: user?.role || 'admin',
          content: newMessage.trim(),
          message_type: 'text'
        })
      })

      const result = await response.json()

      if (result.success) {
        setNewMessage('')
        await loadMessages(selectedConversation.id)
        
        // If customer name was updated, refresh conversation
        if (result.name_updated) {
          await loadConversations()
          // Update selected conversation if it's the same one
          const updatedConvs = await fetch(`/api/chat/conversations?status=active`)
            .then(res => res.json())
            .then(result => result.success ? result.data : [])
          const updatedConv = updatedConvs.find((c: Conversation) => c.id === selectedConversation.id)
          if (updatedConv) {
            setSelectedConversation(updatedConv)
          }
        } else {
          await loadConversations() // Refresh conversation list
        }
      } else {
        alert('Failed to send message: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Send WhatsApp link message
  const sendWhatsAppLink = async () => {
    if (!selectedConversation || sending) return

    const phone = selectedConversation.customer_phone || whatsappPhone
    const displayName = selectedConversation.customer_name.startsWith('Guest_') ? 'Guest' : selectedConversation.customer_name
    const message = encodeURIComponent(`Hello ${displayName}! Let's continue our conversation on WhatsApp.`)
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`

    try {
      setSending(true)
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          sender_id: user?.id || null,
          sender_name: user?.name || 'Admin',
          sender_role: user?.role || 'admin',
          content: whatsappUrl,
          message_type: 'whatsapp_link'
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadMessages(selectedConversation.id)
        await loadConversations()
      }
    } catch (error) {
      console.error('Error sending WhatsApp link:', error)
    } finally {
      setSending(false)
    }
  }

  // Assign conversation to current user
  const assignConversation = async (conversationId: string) => {
    try {
      if (!user?.id) {
        alert('You must be logged in to assign conversations')
        return
      }

      const response = await fetch('/api/chat/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          assigned_to: user.id
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Update the selected conversation with the new data from server
        const updatedConversation = result.data
        setSelectedConversation(updatedConversation)
        // Refresh conversations list to show updated assignment
        await loadConversations()
      } else {
        alert('Failed to assign conversation: ' + (result.error || 'Unknown error'))
        console.error('Assign error:', result)
      }
    } catch (error) {
      console.error('Error assigning conversation:', error)
      alert('Failed to assign conversation. Please try again.')
    }
  }

  // Close conversation
  const closeConversation = async (conversationId: string) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          status: 'closed'
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadConversations()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error closing conversation:', error)
    }
  }

  // Set up real-time subscription and polling
  useEffect(() => {
    if (!selectedConversation) return

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

    let channel: any = null
    let pollInterval: NodeJS.Timeout | null = null

    // Always use polling for reliable real-time updates (works with both Supabase and file storage)
    // Poll every 2 seconds to reduce flickering while still being responsive
    pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/messages?conversation_id=${selectedConversation.id}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          const currentMessages = result.data
          // Sort by created_at
          currentMessages.sort((a: Message, b: Message) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })
          
          // Only update if there are actual changes to prevent flickering
          setMessages((prev) => {
            // Check if message count changed
            if (currentMessages.length !== prev.length) {
              return currentMessages
            }
            // Check if any message IDs are different (new messages)
            const prevIds = new Set(prev.map(m => m.id))
            const hasNewMessages = currentMessages.some((m: Message) => !prevIds.has(m.id))
            if (hasNewMessages) {
              return currentMessages
            }
            // Check if message IDs are in different order
            const prevIdsStr = prev.map(m => m.id).sort().join(',')
            const currentIdsStr = currentMessages.map((m: Message) => m.id).sort().join(',')
            if (prevIdsStr !== currentIdsStr) {
              return currentMessages
            }
            // No changes detected - return previous state to prevent re-render
            return prev
          })
        }
        // Update conversations list to refresh unread counts (without loading state)
        await loadConversations(false)
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 2000)

    // Also try Supabase realtime if configured (as backup/additional sync)
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel(`conversation:${selectedConversation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${selectedConversation.id}`
            },
            (payload) => {
              const newMessage = payload.new as Message
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMessage.id)) return prev
                // Add new message and sort by created_at
                const updated = [...prev, newMessage]
                updated.sort((a, b) => {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                })
                return updated
              })
              loadConversations() // Update unread counts
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error setting up Supabase realtime:', error)
        // Continue with polling only
      }
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [selectedConversation])

  // Subscribe to new conversations
  useEffect(() => {
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    loadConversations(true) // Show loading on initial load or filter change
  }, [statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      // Reset scroll tracking when selecting a new conversation
      prevMessagesLengthRef.current = 0
      prevLastMessageIdRef.current = null
      // Load messages immediately when conversation is selected
      loadMessages(selectedConversation.id)
    } else {
      // Clear messages when no conversation is selected
      setMessages([])
      prevMessagesLengthRef.current = 0
      prevLastMessageIdRef.current = null
    }
  }, [selectedConversation?.id])

  // Auto-scroll to bottom only when new messages arrive (not on initial load or polling updates)
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      const currentLastMessageId = messages[messages.length - 1]?.id
      
      // Only auto-scroll if:
      // 1. Messages increased AND
      // 2. Previous length was > 0 (not initial load) AND
      // 3. Last message ID changed (truly new message, not just refresh)
      const hasNewMessages = messages.length > prevMessagesLengthRef.current && 
                            prevMessagesLengthRef.current > 0 &&
                            currentLastMessageId !== prevLastMessageIdRef.current
      
      if (hasNewMessages) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
      
      // Update refs
      prevMessagesLengthRef.current = messages.length
      prevLastMessageIdRef.current = currentLastMessageId || null
    } else {
      prevMessagesLengthRef.current = 0
      prevLastMessageIdRef.current = null
    }
  }, [messages.length, selectedConversation?.id])

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase()
    return (
      conv.customer_name.toLowerCase().includes(query) ||
      conv.customer_email?.toLowerCase().includes(query) ||
      conv.customer_phone?.toLowerCase().includes(query)
    )
  })

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Active: <span className="font-semibold text-gray-900">{conversationCounts.active}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                      Closed: <span className="font-semibold text-gray-900">{conversationCounts.closed}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      All: <span className="font-semibold text-gray-900">{conversationCounts.all}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === 'closed'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Closed
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conv.customer_name.startsWith('Guest_') ? 'Guest' : conv.customer_name}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                          Customer
                        </span>
                        {((conv.unread_count ?? 0) > 0) && (
                          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {(conv.unread_count ?? 0) > 99 ? '99+' : (conv.unread_count ?? 0)}
                          </span>
                        )}
                      </div>
                      {(() => {
                        // Hide temp emails (guest_xxx@temp.com) and don't show anything if there's no valid contact
                        const email = conv.customer_email || ''
                        const phone = conv.customer_phone || ''
                        const contactInfo = email.includes('@temp.com') ? phone : (email || phone)
                        return contactInfo ? (
                          <p className="text-sm text-gray-500 truncate">{contactInfo}</p>
                        ) : null
                      })()}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(conv.last_message_at)}</p>
                    </div>
                    <div className="ml-2 flex flex-col items-end gap-1">
                      {conv.status === 'active' ? (
                        <Circle className="w-3 h-3 text-green-500 fill-green-500" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-gray-400" />
                      )}
                      {((conv.unread_count ?? 0) > 0) && (
                        <span className="text-xs text-red-600 font-semibold">New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.customer_name.startsWith('Guest_') ? 'Guest' : selectedConversation.customer_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        // Hide temp emails (guest_xxx@temp.com)
                        const email = selectedConversation.customer_email || ''
                        const phone = selectedConversation.customer_phone || ''
                        if (email.includes('@temp.com')) {
                          return phone || 'No contact info'
                        }
                        return email || phone || 'No contact info'
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.assigned_to === user?.id ? (
                      <span className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg font-medium">
                        ✓ Assigned to You
                      </span>
                    ) : (
                      <button
                        onClick={() => assignConversation(selectedConversation.id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {selectedConversation.assigned_to ? 'Reassign to Me' : 'Assign to Me'}
                      </button>
                    )}
                    <button
                      onClick={sendWhatsAppLink}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Send WhatsApp Link"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    {selectedConversation.status === 'active' && (user?.role === 'super_admin' || user?.role === 'admin') && (
                      <button
                        onClick={() => closeConversation(selectedConversation.id)}
                        className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_role === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_role === 'customer'
                          ? 'bg-white border-2 border-blue-300 shadow-sm'
                          : message.message_type === 'whatsapp_link'
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {message.message_type === 'whatsapp_link' ? (
                        <a
                          href={message.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-700 hover:text-green-800"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Continue on WhatsApp</span>
                        </a>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold opacity-90">
                              {message.sender_name}
                            </p>
                            {message.sender_role === 'customer' ? (
                              <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                                Customer
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                message.sender_role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {message.sender_role === 'admin' ? 'Admin' : 'Staff'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

