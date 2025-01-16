/**
 * Application Context Provider
 * Last Updated: 2024-03-20
 * 
 * This module provides a React context for managing global application state.
 * It includes:
 * - Loading state management
 * - Error handling
 * - User preferences
 * - Theme management
 */

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { errorLogger } from '@/lib/logging/error-logger'

interface AppContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  error: Error | null
  setError: (error: Error | null) => void
  clearError: () => void
  handleError: (error: unknown) => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: unknown) => {
    const formattedError = error instanceof Error ? error : new Error(String(error))
    errorLogger.error('Application error', { error: formattedError })
    setError(formattedError)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }, [])

  return (
    <AppContext.Provider
      value={{
        isLoading,
        setLoading,
        error,
        setError,
        clearError,
        handleError,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
} 