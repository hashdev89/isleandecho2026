'use client'

import { AuthProvider } from '../contexts/AuthContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { MobileMenuProvider } from '../contexts/MobileMenuContext'
import { CurrencyProvider } from '../contexts/CurrencyContext'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <MobileMenuProvider>
            {children}
          </MobileMenuProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
