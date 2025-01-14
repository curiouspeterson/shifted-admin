'use client'

import { createContext, useContext, ReactNode } from 'react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
}

interface AppContextType {
  employee: Employee | null
  isLoading: boolean
  error: Error | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: ReactNode
  employee?: Employee | null
}

export function AppProvider({ children, employee = null }: AppProviderProps) {
  const value = {
    employee,
    isLoading: false,
    error: null
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext } 