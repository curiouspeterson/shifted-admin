/**
 * App Context
 * Last Updated: 2025-03-19
 * 
 * Provides global application state and functionality.
 */

'use client'

import * as React from 'react'

interface AppContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: Error | null
  setError: (error: Error | null) => void
}

const AppContext = React.createContext<AppContextType | null>(null)

export function useAppContext() {
  const context = React.useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const value = React.useMemo(
    () => ({
      isLoading,
      setIsLoading,
      error,
      setError,
    }),
    [isLoading, error]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext 