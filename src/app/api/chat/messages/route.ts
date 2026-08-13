import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseClient'
import { extractCustomerName } from '../../../../lib/chatBookingAssistant'
import fs from 'fs'
import path from 'path'

const CHAT_DATA_DIR = path.join(process.cwd(), 'data', 'chat')
const MESSAGES_FILE = path.join(CHAT_DATA_DIR, 'messages.json')
const CONVERSATIONS_FILE = path.join(CHAT_DATA_DIR, 'conversations.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(CHAT_DATA_DIR)) {
    fs.mkdirSync(CHAT_DATA_DIR, { recursive: true })
  }
}

// Load messages from file (fallback)
function loadMessagesFromFile() {
  try {
    ensureDataDir()
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading messages from file:', error)
  }
  return []
}

// Save messages to file (fallback)
function saveMessagesToFile(messages: unknown[]) {
  try {
    ensureDataDir()
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2))
    return true
  } catch (error) {
    console.error('Error saving messages to file:', error)
    return false
  }
}

// Load conversations from file (fallback)
function loadConversationsFromFile() {
  try {
    ensureDataDir()
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const data = fs.readFileSync(CONVERSATIONS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading conversations from file:', error)
  }
  return []
}

// Save conversations to file (fallback)
function saveConversationsToFile(conversations: unknown[]) {
  try {
    ensureDataDir()
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2))
    return true
  } catch (error) {
    console.error('Error saving conversations to file:', error)
    return false
  }
}

// GET messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'

    let messages: any[] = []

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages from Supabase:', error)
        // Fall through to file storage
      } else if (data) {
        messages = data
      }
    }

    // Fallback to file storage
    if (messages.length === 0) {
      const fileMessages = loadMessagesFromFile()
      messages = fileMessages.filter((msg: any) => msg.conversation_id === conversationId)
      messages.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateA - dateB
      })
    }

    return NextResponse.json({
      success: true,
      data: messages
    })
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      conversation_id, 
      sender_id, 
      sender_name, 
      sender_role, 
      content, 
      message_type 
    } = body

    if (!conversation_id || !sender_name || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify conversation exists (check both Supabase and file storage)
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                process.env.SUPABASE_SERVICE_ROLE_KEY &&
                                process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-key'

    let conversation: any = null

    if (isSupabaseConfigured) {
      const { data, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('id, status, customer_name')
        .eq('id', conversation_id)
        .single()

      if (!convError && data) {
        conversation = data
      }
    }

    // Fallback: check file storage
    if (!conversation) {
      try {
        const conversations = loadConversationsFromFile()
        conversation = conversations.find((conv: any) => conv.id === conversation_id)
      } catch (error) {
        console.error('Error checking file storage for conversation:', error)
      }
    }

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // If conversation is closed, reopen it
    if (conversation.status === 'closed') {
      if (isSupabaseConfigured) {
        await supabaseAdmin
          .from('conversations')
          .update({ status: 'active' })
          .eq('id', conversation_id)
      } else {
        // Update in file storage
        try {
          const conversations = loadConversationsFromFile()
          const convIndex = conversations.findIndex((conv: any) => conv.id === conversation_id)
          if (convIndex !== -1) {
            conversations[convIndex].status = 'active'
            conversations[convIndex].updated_at = new Date().toISOString()
            saveConversationsToFile(conversations)
          }
        } catch (error) {
          console.error('Error updating conversation in file storage:', error)
        }
      }
    }

    // Check if this is the first customer message and send welcome message
    const isCustomerMessage = sender_role === 'customer'
    let shouldSendWelcome = false
    let customerNameToUpdate: string | null = null

    if (isCustomerMessage && conversation) {
      // Get existing messages to check if this is the first customer message
      let existingCustomerMessages: any[] = []
      let existingAllMessages: any[] = []
      
      if (isSupabaseConfigured) {
        const { data: messages } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation_id)
        
        if (messages) {
          existingAllMessages = messages
          existingCustomerMessages = messages.filter((msg: any) => msg.sender_role === 'customer')
        }
      } else {
        const fileMessages = loadMessagesFromFile()
        existingAllMessages = fileMessages.filter((msg: any) => msg.conversation_id === conversation_id)
        existingCustomerMessages = existingAllMessages.filter((msg: any) => msg.sender_role === 'customer')
      }

      // Only auto-welcome when the conversation has no prior messages at all
      // (guided chat may already have posted a greeting / mode choice)
      if (existingCustomerMessages.length === 0 && existingAllMessages.length === 0) {
        shouldSendWelcome = true
        console.log('First customer message detected - will send welcome message')
      }

      // If customer name is generic (Guest_xxx, Guest, or just a generic name) and this looks like a name, extract it
      const currentCustomerName = conversation.customer_name || ''
      const isGenericName = currentCustomerName.startsWith('Guest_') || 
                           currentCustomerName === 'Guest' ||
                           currentCustomerName.toLowerCase().includes('guest') ||
                           !currentCustomerName || 
                           currentCustomerName.trim() === ''
      
      // Check if previous message was asking for name (needed for context-aware extraction)
      let previousMessages: any[] = []
      if (isSupabaseConfigured) {
        const { data: prevMsgs } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (prevMsgs) previousMessages = prevMsgs
      } else {
        const fileMessages = loadMessagesFromFile()
        const convMessages = fileMessages
          .filter((msg: any) => msg.conversation_id === conversation_id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        if (convMessages.length > 0) previousMessages = [convMessages[0]]
      }

      const lastMessage = previousMessages[0]
      const wasAskingForName = lastMessage && 
                               lastMessage.sender_role !== 'customer' && 
                               (lastMessage.content.toLowerCase().includes('name') || 
                                lastMessage.content.toLowerCase().includes('good name'))

      if (isGenericName || wasAskingForName) {
        const extractedName = extractCustomerName(String(content || ''))
        if (extractedName) {
          customerNameToUpdate = extractedName
          console.log('Extracted customer name from message:', customerNameToUpdate, 'from:', content)
        }
      }
    }

    // Generate unique ID
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newMessage = {
      id,
      conversation_id,
      sender_id: sender_id || null,
      sender_name,
      sender_role: sender_role || 'customer',
      content,
      message_type: message_type || 'text',
      created_at: new Date().toISOString()
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert([newMessage])
        .select()
        .single()

      if (error) {
        console.error('Error creating message in Supabase:', error)
        // Fall through to file storage
      } else if (data) {
        // Send welcome message if needed (send immediately after customer message)
        if (shouldSendWelcome) {
          const welcomeMsgId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`
          const welcomeMessage = {
            id: welcomeMsgId,
            conversation_id,
            sender_id: null,
            sender_name: 'ISLE & ECHO',
            sender_role: 'admin',
            content: 'Thanks for contacting ISLE & ECHO! Would you like our chatbot assistant or a live agent? Please reply or reopen chat options.',
            message_type: 'text',
            created_at: new Date().toISOString()
          }
          
          // Insert welcome message immediately
          const { error: welcomeError } = await supabaseAdmin
            .from('messages')
            .insert([welcomeMessage])
          
          if (welcomeError) {
            console.error('Error sending welcome message:', welcomeError)
          } else {
            console.log('Welcome message sent successfully')
          }
        }

        // Update customer name if extracted
        if (customerNameToUpdate) {
          const { error: updateError } = await supabaseAdmin
            .from('conversations')
            .update({ customer_name: customerNameToUpdate })
            .eq('id', conversation_id)
          
          if (updateError) {
            console.error('Error updating customer name:', updateError)
          } else {
            console.log('Customer name updated successfully:', customerNameToUpdate)
          }
        }

        return NextResponse.json({
          success: true,
          data,
          welcome_sent: shouldSendWelcome,
          name_updated: !!customerNameToUpdate
        }, { status: 201 })
      }
    }

    // Fallback to file storage
    const messages = loadMessagesFromFile()
    messages.push(newMessage)
    if (saveMessagesToFile(messages)) {
      // Send welcome message if needed (add it right after customer message)
      if (shouldSendWelcome) {
        const welcomeMsgId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`
        const welcomeMessage = {
          id: welcomeMsgId,
          conversation_id,
          sender_id: null,
          sender_name: 'ISLE & ECHO',
          sender_role: 'admin',
          content: 'Thanks for contacting ISLE & ECHO! Would you like our chatbot assistant or a live agent? Please reply or reopen chat options.',
          message_type: 'text',
          created_at: new Date().toISOString()
        }
        messages.push(welcomeMessage)
        if (!saveMessagesToFile(messages)) {
          console.error('Failed to save welcome message to file')
        }
      }

      // Update conversation's last_message_at and customer_name
      try {
        const conversations = loadConversationsFromFile()
        const convIndex = conversations.findIndex((conv: any) => conv.id === conversation_id)
        if (convIndex !== -1) {
          conversations[convIndex].last_message_at = new Date().toISOString()
          conversations[convIndex].updated_at = new Date().toISOString()
          
          // Update customer name if extracted
          if (customerNameToUpdate) {
            conversations[convIndex].customer_name = customerNameToUpdate
          }
          
          saveConversationsToFile(conversations)
        }
      } catch (error) {
        console.error('Error updating conversation:', error)
      }
      
      return NextResponse.json({
        success: true,
        data: newMessage,
        welcome_sent: shouldSendWelcome,
        name_updated: !!customerNameToUpdate
      }, { status: 201 })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error in POST /api/chat/messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, message_ids } = body

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversation_id)
      .is('read_at', null)

    // If specific message IDs provided, only mark those as read
    if (message_ids && Array.isArray(message_ids) && message_ids.length > 0) {
      query = query.in('id', message_ids)
    }

    const { error } = await query

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error in PUT /api/chat/messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

