'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Phone, Calendar, Users, MapPin, Bot, Headphones } from 'lucide-react'
import SiteDatePicker from './SiteDatePicker'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useClickOutside } from '../hooks/useClickOutside'
import {
  ChatBookingIntake,
  ChatBookingPath,
  ChatBookingStep,
  RecommendableTour,
  TRAVEL_TYPE_OPTIONS,
  MODE_GREETING,
  LIVE_AGENT_MESSAGE,
  buildCustomTripPayload,
  buildTourBookingUrl,
  createInitialIntake,
  intakeStorageKey,
  isGenericCustomerName,
  extractCustomerName,
  parseGuestCount,
  parseLikelyDate,
  recommendTours,
} from '../lib/chatBookingAssistant'

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
}

const BOT_NAME = 'ISLE & ECHO'

export default function WhatsAppChat() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const chatRootRef = useRef<HTMLDivElement>(null)
  const suppressOutsideCloseUntil = useRef(0)
  const greetingSentRef = useRef(false)
  const closeChatIfDesktop = useCallback(() => {
    if (Date.now() < suppressOutsideCloseUntil.current) return
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches) {
      setIsOpen(false)
    }
  }, [])
  useClickOutside(chatRootRef, isOpen, closeChatIfDesktop)

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('openChat', handleOpenChat)
    return () => window.removeEventListener('openChat', handleOpenChat)
  }, [])

  // Auto-greet visitors by opening chat once per session (skip admin)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname?.startsWith('/admin')) return
    try {
      if (sessionStorage.getItem('isle-chat-auto-opened') === '1') return
    } catch {
      // ignore
    }
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem('isle-chat-auto-opened', '1')
      } catch {
        // ignore
      }
      suppressOutsideCloseUntil.current = Date.now() + 10000
      setIsOpen(true)
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chatStateChange', { detail: { isOpen } }))
  }, [isOpen])

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('94741415812')
  const [intake, setIntake] = useState<ChatBookingIntake>(createInitialIntake())
  const [recommendedTours, setRecommendedTours] = useState<RecommendableTour[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const intakeRef = useRef(intake)
  const advancingRef = useRef(false)

  useEffect(() => {
    intakeRef.current = intake
  }, [intake])

  const scrollChatToBottom = useCallback((instant = false) => {
    const run = () => {
      const behavior: ScrollBehavior = instant ? 'auto' : 'smooth'
      for (const el of [desktopScrollRef.current, mobileScrollRef.current]) {
        if (!el) continue
        el.scrollTo({ top: el.scrollHeight, behavior })
      }
      messagesEndRef.current?.scrollIntoView({ block: 'end', inline: 'nearest', behavior })
    }
    requestAnimationFrame(() => {
      run()
      window.setTimeout(run, 80)
      window.setTimeout(run, 280)
    })
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json()
        if (result.success && result.data?.whatsappPhone) {
          setWhatsappPhone(result.data.whatsappPhone)
        }
      } catch (err) {
        console.error('Error loading WhatsApp phone:', err)
      }
    }
    loadSettings()
  }, [])

  const GUEST_CONV_KEY = 'isle-chat-conversation'

  const saveGuestConversation = (conv: Conversation) => {
    try {
      sessionStorage.setItem(GUEST_CONV_KEY, JSON.stringify(conv))
    } catch {
      // ignore
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversation_id=${conversationId}`)
      const result = await response.json()
      if (result.success) {
        const loadedMessages = result.data || []
        loadedMessages.sort((a: Message, b: Message) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        setMessages(loadedMessages)
        scrollChatToBottom()
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const postBotMessage = useCallback(async (conversationId: string, content: string) => {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_id: null,
        sender_name: BOT_NAME,
        sender_role: 'admin',
        content,
        message_type: 'text',
      }),
    })
    const result = await response.json()
    if (result.success) {
      await loadMessages(conversationId)
    }
    return result
  }, [])

  const persistIntake = useCallback((next: ChatBookingIntake, conversationId?: string) => {
    intakeRef.current = next
    setIntake(next)
    const id = conversationId || conversation?.id
    if (!id || typeof window === 'undefined') return
    try {
      sessionStorage.setItem(intakeStorageKey(id), JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }, [conversation?.id])

  const loadPersistedIntake = useCallback((conversationId: string, customerName: string) => {
    try {
      const raw = sessionStorage.getItem(intakeStorageKey(conversationId))
      if (raw) {
        const parsed = JSON.parse(raw) as ChatBookingIntake
        // Backfill older sessions missing mode field
        const normalized: ChatBookingIntake = {
          ...createInitialIntake(customerName),
          ...parsed,
          mode: parsed.mode || (parsed.step === 'live_agent' ? 'live' : parsed.step === 'choose_mode' ? 'undecided' : 'bot'),
        }
        intakeRef.current = normalized
        setIntake(normalized)
        return normalized
      }
    } catch {
      // ignore
    }
    const initial = createInitialIntake(customerName || user?.name || '')
    intakeRef.current = initial
    setIntake(initial)
    return initial
  }, [user?.name])

  const loadOrCreateConversation = async () => {
    try {
      setLoading(true)
      setError(null)

      if (user?.id) {
        const response = await fetch(`/api/chat/conversations?status=active`)
        const result = await response.json()

        if (result.success && result.data && result.data.length > 0) {
          const userConversation = result.data.find(
            (conv: Conversation) => conv.customer_id === user.id
          )
          if (userConversation) {
            setConversation(userConversation)
            saveGuestConversation(userConversation)
            loadPersistedIntake(userConversation.id, userConversation.customer_name)
            await loadMessages(userConversation.id)
            setLoading(false)
            scrollChatToBottom(true)
            return
          }
        }
      } else {
        try {
          const saved = sessionStorage.getItem(GUEST_CONV_KEY)
          if (saved) {
            const parsed = JSON.parse(saved) as Conversation
            if (parsed?.id) {
              const msgRes = await fetch(`/api/chat/messages?conversation_id=${parsed.id}`)
              const msgJson = await msgRes.json()
              if (msgRes.ok && msgJson.success) {
                setConversation(parsed)
                loadPersistedIntake(parsed.id, parsed.customer_name)
                const loadedMessages = Array.isArray(msgJson.data) ? msgJson.data : []
                loadedMessages.sort((a: Message, b: Message) => {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                })
                setMessages(loadedMessages)
                setLoading(false)
                scrollChatToBottom(true)
                return
              }
            }
          }
        } catch {
          // start a new guest conversation
        }
      }

      const customerName = user?.name || `Guest_${Date.now()}`
      const customerEmail = user?.email || `guest_${Date.now()}@temp.com`
      const customerPhone = user?.phone || null

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user?.id || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        setConversation(result.data)
        saveGuestConversation(result.data)
        loadPersistedIntake(result.data.id, result.data.customer_name)
        await loadMessages(result.data.id)
        scrollChatToBottom(true)
      } else {
        setError(result.error || 'Failed to create conversation')
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError('Failed to load chat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const askForStep = useCallback(async (conversationId: string, step: ChatBookingStep, name?: string) => {
    const displayName = name || intakeRef.current.customerName || 'there'
    const prompts: Partial<Record<ChatBookingStep, string>> = {
      choose_mode: MODE_GREETING,
      await_name: `Thanks! Can I know your good name first?`,
      choose_path: `Nice to meet you, ${displayName}! What are you looking for today?\n\n1) Tour Packages – ready-made trips\n2) Plan Your Trip – a custom itinerary\n\nTap a button below or reply with “tours” or “plan”.`,
      travel_type: `Great choice, ${displayName}. What kind of travel are you looking for?\n\nYou can tap an option below or type your own (e.g. adventure, beach, wildlife).`,
      travel_dates: `When would you like to travel? Pick a start date from the calendar below.`,
      guests: `How many guests will be traveling?`,
      special_requests: `Any special requests? (dietary needs, accessibility, celebrations, hotel preferences, etc.)\n\nYou can type them here, or reply “none”.`,
      live_agent: LIVE_AGENT_MESSAGE,
    }
    const content = prompts[step]
    if (content) {
      await postBotMessage(conversationId, content)
    }
  }, [postBotMessage])

  useEffect(() => {
    greetingSentRef.current = false
  }, [conversation?.id])

  useEffect(() => {
    if (!isOpen || !conversation?.id || loading) return
    if (intake.step !== 'choose_mode') return
    const alreadyGreeted = messages.some(
      (m) =>
        m.sender_role !== 'customer' &&
        (m.content.includes('How would you like to get help') || m.content.includes(MODE_GREETING.slice(0, 40)))
    )
    if (alreadyGreeted || greetingSentRef.current) return
    greetingSentRef.current = true
    void postBotMessage(conversation.id, MODE_GREETING)
  }, [isOpen, conversation?.id, loading, intake.step, messages, postBotMessage])

  const loadRecommendations = useCallback(async (nextIntake: ChatBookingIntake) => {
    setLoadingRecommendations(true)
    try {
      const res = await fetch('/api/tours')
      const json = await res.json()
      const tours: RecommendableTour[] = json.success ? json.data || [] : []
      const picks = recommendTours(tours, nextIntake.travelType || 'Mixed / Flexible', 4, nextIntake.guests)
      setRecommendedTours(picks)

      if (conversation?.id) {
        if (picks.length === 0) {
          await postBotMessage(
            conversation.id,
            nextIntake.guests > 0
              ? `I could not find tour packages that fit ${nextIntake.guests} guest${nextIntake.guests === 1 ? '' : 's'} with your preferences. Try adjusting the guest count, or continue with Plan Your Trip for a custom itinerary.`
              : 'I could not find matching tour packages right now. You can browse all tours on the website, or continue with Plan Your Trip.'
          )
        } else {
          const intro =
            nextIntake.path === 'plan-trip'
              ? `Based on your preferences, here are strong tour matches you can start from — or continue with a fully custom Plan Your Trip.`
              : `Here are the best matching tour packages for you. Tap one to open the package and continue booking.`
          await postBotMessage(conversation.id, intro)
        }
      }
    } catch (err) {
      console.error('Error loading tour recommendations:', err)
      setRecommendedTours([])
      if (conversation?.id) {
        await postBotMessage(
          conversation.id,
          'I could not load tours right now. You can still browse packages on the Tours page, or continue with Plan Your Trip.'
        )
      }
    } finally {
      setLoadingRecommendations(false)
    }
  }, [conversation?.id, postBotMessage])

  const advanceAfterName = useCallback(async (conversationId: string, name: string) => {
    if (advancingRef.current) return
    const current = intakeRef.current
    if (current.mode !== 'bot') return
    if (current.step !== 'await_name') return

    advancingRef.current = true
    try {
      const next = { ...current, step: 'choose_path' as const, customerName: name, mode: 'bot' as const }
      persistIntake(next, conversationId)
      await askForStep(conversationId, 'choose_path', name)
    } finally {
      advancingRef.current = false
    }
  }, [askForStep, persistIntake])

  const startBotFlow = async () => {
    if (!conversation || sending) return
    await sendCustomerText('Chatbot assistant', async () => {
      const knownName =
        intakeRef.current.customerName ||
        (!isGenericCustomerName(conversation.customer_name) ? conversation.customer_name : '') ||
        (!isGenericCustomerName(user?.name) ? user?.name || '' : '')

      if (knownName) {
        const next: ChatBookingIntake = {
          ...intakeRef.current,
          mode: 'bot',
          customerName: knownName,
          step: 'choose_path',
        }
        persistIntake(next)
        await askForStep(conversation.id, 'choose_path', knownName)
      } else {
        const next: ChatBookingIntake = {
          ...intakeRef.current,
          mode: 'bot',
          step: 'await_name',
        }
        persistIntake(next)
        await askForStep(conversation.id, 'await_name')
      }
    })
  }

  const startLiveAgent = async () => {
    if (!conversation || sending) return
    await sendCustomerText('Live agent', async () => {
      const next: ChatBookingIntake = {
        ...intakeRef.current,
        mode: 'live',
        step: 'live_agent',
      }
      persistIntake(next)
      await askForStep(conversation.id, 'live_agent')
    })
  }

  const switchToBotFromLive = async () => {
    if (!conversation || sending) return
    await startBotFlow()
  }

  const switchToLiveFromBot = async () => {
    if (!conversation || sending) return
    await startLiveAgent()
  }

  const handleQuickPath = async (path: ChatBookingPath) => {
    if (!conversation || sending) return
    const label = path === 'tours' ? 'Tour Packages' : 'Plan Your Trip'
    await sendCustomerText(label, async () => {
      const next: ChatBookingIntake = { ...intakeRef.current, path, step: 'travel_type', mode: 'bot' }
      persistIntake(next)
      await askForStep(conversation.id, 'travel_type')
    })
  }

  const handleQuickTravelType = async (travelType: string) => {
    if (!conversation || sending) return
    await sendCustomerText(travelType, async () => {
      const next: ChatBookingIntake = { ...intakeRef.current, travelType, step: 'travel_dates' }
      persistIntake(next)
      await askForStep(conversation.id, 'travel_dates')
    })
  }

  const sendCustomerText = async (content: string, afterSend?: () => Promise<void>) => {
    if (!conversation || sending || !content.trim()) return

    try {
      setSending(true)
      const optimistic: Message = {
        id: `local-${Date.now()}`,
        conversation_id: conversation.id,
        sender_id: user?.id || null,
        sender_name: user?.name || intake.customerName || 'Guest',
        sender_role: 'customer',
        content: content.trim(),
        message_type: 'text',
        read_at: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])
      scrollChatToBottom(true)

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user?.id || null,
          sender_name: user?.name || intake.customerName || 'Guest',
          sender_role: 'customer',
          content: content.trim(),
          message_type: 'text',
        }),
      })

      const result = await response.json()
      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        alert('Failed to send message: ' + result.error)
        return
      }

      setNewMessage('')
      await loadMessages(conversation.id)

      if (result.name_updated && result.data) {
        setConversation((prev) =>
          prev ? { ...prev, customer_name: extractCustomerName(content) || prev.customer_name } : prev
        )
      }

      if (afterSend) {
        await afterSend()
      } else {
        await processIntakeFromCustomerReply(content.trim())
      }
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message')
    } finally {
      setSending(false)
      scrollChatToBottom()
    }
  }

  const processIntakeFromCustomerReply = async (content: string) => {
    if (!conversation) return
    const current = intakeRef.current
    const lower = content.toLowerCase()

    if (current.step === 'choose_mode') {
      if (lower.includes('live') || lower.includes('agent') || lower.includes('human')) {
        const next: ChatBookingIntake = { ...current, mode: 'live', step: 'live_agent' }
        persistIntake(next)
        await askForStep(conversation.id, 'live_agent')
        return
      }
      if (lower.includes('bot') || lower.includes('assistant') || lower.includes('chatbot') || lower.includes('guide')) {
        const knownName =
          current.customerName ||
          (!isGenericCustomerName(conversation.customer_name) ? conversation.customer_name : '') ||
          (!isGenericCustomerName(user?.name) ? user?.name || '' : '')
        if (knownName) {
          const next: ChatBookingIntake = {
            ...current,
            mode: 'bot',
            customerName: knownName,
            step: 'choose_path',
          }
          persistIntake(next)
          await askForStep(conversation.id, 'choose_path', knownName)
        } else {
          const next: ChatBookingIntake = { ...current, mode: 'bot', step: 'await_name' }
          persistIntake(next)
          await askForStep(conversation.id, 'await_name')
        }
        return
      }
      await postBotMessage(
        conversation.id,
        'Please choose Chatbot assistant or Live agent using the buttons below.'
      )
      return
    }

    if (current.step === 'live_agent') {
      if (lower.includes('bot') || lower.includes('assistant') || lower.includes('chatbot')) {
        await startBotFlow()
      }
      // Otherwise free-form live chat — staff replies via admin
      return
    }

    if (current.mode !== 'bot') return

    if (current.step === 'await_name') {
      const name = extractCustomerName(content)
      if (!name) {
        await postBotMessage(
          conversation.id,
          'Please share your name so I can continue (for example: Sam).'
        )
        return
      }
      await advanceAfterName(conversation.id, name)
      return
    }

    if (current.step === 'choose_path') {
      let path: ChatBookingPath | null = null
      if (lower.includes('plan')) path = 'plan-trip'
      else if (lower.includes('tour') || lower.includes('package') || lower === '1') path = 'tours'
      if (!path) {
        await postBotMessage(
          conversation.id,
          'Please choose Tour Packages or Plan Your Trip (tap a button below).'
        )
        return
      }
      const next = { ...current, path, step: 'travel_type' as const }
      persistIntake(next)
      await askForStep(conversation.id, 'travel_type')
      return
    }

    if (current.step === 'travel_type') {
      const next = { ...current, travelType: content, step: 'travel_dates' as const }
      persistIntake(next)
      await askForStep(conversation.id, 'travel_dates')
      return
    }

    if (current.step === 'travel_dates') {
      const date = parseLikelyDate(content)
      if (!date) {
        await postBotMessage(
          conversation.id,
          'I could not read that date. Please use YYYY-MM-DD or DD/MM/YYYY (for example 2026-08-20).'
        )
        return
      }
      const next = { ...current, startDate: date, step: 'guests' as const }
      persistIntake(next)
      await askForStep(conversation.id, 'guests')
      return
    }

    if (current.step === 'guests') {
      const guests = parseGuestCount(content)
      if (!guests) {
        await postBotMessage(conversation.id, 'Please reply with the number of guests (for example 2).')
        return
      }
      const next = { ...current, guests, step: 'special_requests' as const }
      persistIntake(next)
      await askForStep(conversation.id, 'special_requests')
      return
    }

    if (current.step === 'special_requests') {
      const special =
        content.trim().toLowerCase() === 'none' || content.trim().toLowerCase() === 'no'
          ? ''
          : content.trim()
      const next: ChatBookingIntake = {
        ...current,
        specialRequests: special,
        step: 'recommendations',
      }
      persistIntake(next)
      await loadRecommendations(next)
      return
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return
    await sendCustomerText(newMessage)
  }

  const openWhatsApp = () => {
    const summaryParts = [
      `Hello! I'm ${intake.customerName || 'a guest'}.`,
      intake.path ? `Looking for: ${intake.path === 'tours' ? 'Tour Packages' : 'Plan Your Trip'}.` : '',
      intake.travelType ? `Travel style: ${intake.travelType}.` : '',
      intake.startDate ? `Preferred start: ${intake.startDate}.` : '',
      intake.guests ? `Guests: ${intake.guests}.` : '',
      intake.specialRequests ? `Special requests: ${intake.specialRequests}.` : '',
    ].filter(Boolean)
    const message = encodeURIComponent(summaryParts.join(' ') || 'Hello! I would like to know more about your tours.')
    window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const goToCustomTrip = async () => {
    const payload = buildCustomTripPayload(intakeRef.current)
    localStorage.setItem('customTripData', JSON.stringify(payload))
    if (conversation) {
      await postBotMessage(
        conversation.id,
        'Opening Plan Your Trip so you can continue your custom booking. Our team can also help refine destinations.'
      )
      persistIntake({ ...intakeRef.current, step: 'completed' })
    }
    window.location.href = '/custom-booking'
  }

  const selectTour = async (tour: RecommendableTour) => {
    if (conversation) {
      await postBotMessage(
        conversation.id,
        `Great — opening “${tour.name}” so you can continue booking there.`
      )
      persistIntake({ ...intakeRef.current, step: 'completed' })
    }
    window.location.href = buildTourBookingUrl(tour.id, intakeRef.current)
  }

  useEffect(() => {
    if (!conversation) return

    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

    let channel: ReturnType<typeof supabase.channel> | null = null
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/messages?conversation_id=${conversation.id}`)
        const result = await response.json()
        if (result.success && result.data) {
          const currentMessages = result.data
          currentMessages.sort((a: Message, b: Message) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })
          setMessages((prev) => {
            if (currentMessages.length !== prev.length) return currentMessages
            const prevIds = new Set(prev.map((m) => m.id))
            if (currentMessages.some((m: Message) => !prevIds.has(m.id))) return currentMessages
            return prev
          })
        }
      } catch (err) {
        console.error('Error polling messages:', err)
      }
    }, 2000)

    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel(`conversation:${conversation.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
              const newMsg = payload.new as Message
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [...prev, newMsg].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
              })
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Error setting up Supabase realtime:', err)
      }
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [conversation])

  useEffect(() => {
    if (!isOpen) return
    if (!conversation && !loading) {
      loadOrCreateConversation()
    } else if (conversation) {
      loadMessages(conversation.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    scrollChatToBottom()
  }, [isOpen, messages, recommendedTours, intake.step, loadingRecommendations, sending, scrollChatToBottom])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderQuickActions = () => {
    if (!conversation || loading || error) return null

    if (intake.step === 'choose_mode') {
      return (
        <div className="mt-2 space-y-2">
          <button
            type="button"
            disabled={sending}
            onClick={() => startBotFlow()}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold bg-[var(--lagoon-deep)] text-white hover:bg-[var(--lagoon)] disabled:opacity-50"
          >
            <Bot className="w-4 h-4 flex-shrink-0" />
            <span>Chatbot assistant — guided tours & trip planning</span>
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => startLiveAgent()}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold bg-white border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:bg-[var(--foam)] disabled:opacity-50"
          >
            <Headphones className="w-4 h-4 flex-shrink-0" />
            <span>Connect with a live agent</span>
          </button>
        </div>
      )
    }

    if (intake.step === 'live_agent') {
      return (
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#25D366] text-white hover:bg-[#20BA5A]"
          >
            <Phone className="w-4 h-4" />
            Continue on WhatsApp
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => switchToBotFromLive()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:border-[var(--lagoon)] disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            Use chatbot instead
          </button>
        </div>
      )
    }

    if (intake.step === 'choose_path') {
      return (
        <div className="space-y-2 mt-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => handleQuickPath('tours')}
              className="px-3 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[var(--lagoon-deep)] text-white hover:bg-[var(--lagoon)] disabled:opacity-50"
            >
              Tour Packages
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => handleQuickPath('plan-trip')}
              className="px-3 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:bg-[var(--foam)] disabled:opacity-50"
            >
              Plan Your Trip
            </button>
          </div>
          <button
            type="button"
            disabled={sending}
            onClick={() => switchToLiveFromBot()}
            className="text-xs text-gray-500 hover:text-[var(--lagoon-deep)] underline"
          >
            Prefer a live agent?
          </button>
        </div>
      )
    }

    if (intake.step === 'travel_dates') {
      return (
        <div className="mt-2">
          <SiteDatePicker
            inline
            value={intake.startDate}
            onChange={(date) => {
              if (sending) return
              void sendCustomerText(date)
            }}
            placeholder="Select travel date"
          />
        </div>
      )
    }

    if (intake.step === 'travel_type') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {TRAVEL_TYPE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              disabled={sending}
              onClick={() => handleQuickTravelType(option)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800 hover:border-[var(--lagoon)] hover:text-[var(--lagoon-deep)] disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      )
    }

    if (intake.step === 'recommendations' || intake.step === 'completed') {
      return (
        <div className="mt-3 space-y-3">
          {loadingRecommendations && (
            <p className="text-xs text-gray-500">Finding the best matching tours…</p>
          )}
          {recommendedTours.map((tour) => (
            <button
              key={tour.id}
              type="button"
              onClick={() => selectTour(tour)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-[var(--lagoon)] transition-colors shadow-sm"
            >
              <div className="flex gap-3 p-2.5">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image
                    src={tour.image || tour.images?.[0] || '/placeholder-image.svg'}
                    alt={tour.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{tour.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {tour.duration || 'Flexible'}
                  </p>
                  {tour.style && (
                    <p className="text-xs text-[var(--lagoon)] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {tour.style}
                    </p>
                  )}
                  <p className="text-xs font-bold text-[var(--lagoon-deep)] mt-1">View & continue booking →</p>
                </div>
              </div>
            </button>
          ))}

          {intake.path === 'plan-trip' && (
            <button
              type="button"
              onClick={goToCustomTrip}
              className="w-full px-3 py-3 rounded-xl text-sm font-semibold bg-[var(--sun)] text-[var(--lagoon-deep)] hover:brightness-105"
            >
              Continue with Plan Your Trip
            </button>
          )}

          {intake.path === 'tours' && recommendedTours.length === 0 && !loadingRecommendations && (
            <Link
              href="/tours"
              className="block w-full text-center px-3 py-3 rounded-xl text-sm font-semibold bg-[var(--lagoon-deep)] text-white"
            >
              Browse all tour packages
            </Link>
          )}
        </div>
      )
    }

    return null
  }

  const renderMessagesBody = () => (
    <>
      {conversation && messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-700 mb-2 text-sm font-medium">
            Welcome! We&apos;re glad you&apos;re here.
          </p>
          <p className="text-gray-500 text-xs">
            Choose a chatbot assistant or a live agent to get started.
          </p>
        </div>
      ) : null}
      {messages.length > 0 &&
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-lg ${
                message.sender_role === 'customer'
                  ? 'bg-[#25D366] text-white'
                  : message.message_type === 'whatsapp_link'
                    ? 'bg-green-100 border border-green-300'
                    : 'bg-white border border-gray-200'
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
                  <p className="text-xs font-semibold mb-1 opacity-90">
                    {message.sender_role === 'customer' ? 'You' : message.sender_name}
                    {message.sender_role !== 'customer' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({message.sender_role === 'admin' ? 'Assistant' : 'Staff'})
                      </span>
                    )}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">{formatTime(message.created_at)}</p>
                </>
              )}
            </div>
          </div>
        ))}
      {renderQuickActions()}
      {(intake.startDate || intake.guests > 1 || intake.travelType) &&
        intake.mode === 'bot' &&
        intake.step !== 'await_name' &&
        intake.step !== 'choose_mode' && (
        <div className="rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Your trip details</p>
          {intake.path && (
            <p>Path: {intake.path === 'tours' ? 'Tour Packages' : 'Plan Your Trip'}</p>
          )}
          {intake.travelType && <p>Style: {intake.travelType}</p>}
          {intake.startDate && (
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {intake.startDate}
            </p>
          )}
          {intake.guests > 0 && (
            <p className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {intake.guests} guest{intake.guests === 1 ? '' : 's'}
            </p>
          )}
          {intake.specialRequests && <p>Notes: {intake.specialRequests}</p>}
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  )

  const inputPlaceholder =
    intake.step === 'choose_mode'
      ? 'Or type chatbot / live agent…'
      : intake.step === 'live_agent'
        ? 'Message our live team…'
        : intake.step === 'travel_dates'
          ? 'Or type a date…'
          : intake.step === 'guests'
            ? 'e.g. 2'
            : intake.step === 'special_requests'
              ? 'Special requests or “none”'
              : conversation
                ? 'Type a message...'
                : 'Setting up chat...'

  const inputType =
    intake.step === 'guests' ? 'number' : 'text'

  const renderComposer = (compact = false) => (
    <div className={`border-t border-gray-200 bg-white ${compact ? 'p-3 safe-area-inset-bottom' : 'p-4'}`}>
      <div className="flex gap-2">
        <input
          type={inputType}
          min={intake.step === 'guests' ? 1 : undefined}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && conversation) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={inputPlaceholder}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${compact ? 'text-base' : 'text-sm'}`}
          style={compact ? { fontSize: '16px' } : undefined}
          disabled={!conversation || sending}
        />
        <button
          onClick={sendMessage}
          disabled={!conversation || !newMessage.trim() || sending}
          className="px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Send className={compact ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          onClick={openWhatsApp}
          className="text-xs text-gray-500 hover:text-[#25D366] flex items-center gap-1"
          title="Continue conversation on WhatsApp"
        >
          <Phone className="w-3 h-3" />
          <span>Continue on WhatsApp</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div
        ref={chatRootRef}
        className={`fixed right-4 z-50 md:right-6 ${
          isOpen
            ? 'hidden sm:block sm:bottom-6'
            : 'bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center relative"
          aria-label="Open chat"
          aria-expanded={isOpen}
          style={{ width: '56px', height: '56px', boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)' }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && (
            <span
              className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-75"
              style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
            />
          )}
        </button>

        {isOpen && (
          <div
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-0"
            style={{ height: '600px', maxHeight: '80vh' }}
          >
            <div className="bg-[#25D366] p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
                  <Image
                    src="/logoisle&echo.png"
                    alt="ISLE & ECHO Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">ISLE & ECHO</h3>
                  <p className="text-sm opacity-90">
                    {intake.mode === 'live'
                      ? 'Live agent chat'
                      : intake.mode === 'bot'
                        ? 'Chatbot assistant'
                        : conversation
                          ? 'How can we help?'
                          : "We're here to help!"}
                  </p>
                </div>
              </div>
            </div>

            <div ref={desktopScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Setting up your chat...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={loadOrCreateConversation}
                    className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] text-sm"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                renderMessagesBody()
              )}
            </div>
            {renderComposer(false)}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] bg-white flex flex-col min-h-0">
          <div className="bg-[#25D366] p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2">
                <Image
                  src="/logoisle&echo.png"
                  alt="ISLE & ECHO Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-base">ISLE & ECHO</h3>
                <p className="text-xs opacity-90">
                  {intake.mode === 'live'
                    ? 'Live agent chat'
                    : intake.mode === 'bot'
                      ? 'Chatbot assistant'
                      : conversation
                        ? 'How can we help?'
                        : "We're here to help!"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div ref={mobileScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <p>Setting up your chat...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                  onClick={loadOrCreateConversation}
                  className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              renderMessagesBody()
            )}
          </div>
          {renderComposer(true)}
        </div>
      )}
    </>
  )
}
