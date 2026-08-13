'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useUnreadMessageCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'staff')) {
      setCount(0)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/chat/unread-count?user_id=${user.id}&role=${user.role}`)
        const result = await response.json()
        if (result.success) {
          setCount(result.count || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchUnreadCount, 5000)

    return () => clearInterval(interval)
  }, [user])

  return count
}

