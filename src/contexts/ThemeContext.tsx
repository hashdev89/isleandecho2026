'use client'

import { createContext, useContext, useEffect } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyLightMode() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
  document.documentElement.style.colorScheme = 'only light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyLightMode()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: applyLightMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
