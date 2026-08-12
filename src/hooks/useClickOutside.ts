'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Closes an open dropdown/popover when clicking/tapping outside the container,
 * or when pressing Escape.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!enabled) return

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target || !ref.current) return
      if (ref.current.contains(target)) return
      onClose()
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    // Use capture so we close even if something stops bubbling
    document.addEventListener('mousedown', handlePointer, true)
    document.addEventListener('touchstart', handlePointer, true)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer, true)
      document.removeEventListener('touchstart', handlePointer, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, enabled, onClose])
}
