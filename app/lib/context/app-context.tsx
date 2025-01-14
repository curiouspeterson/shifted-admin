/**
 * Application Context Module
 * Last Updated: 2024
 * 
 * Provides global application state management through React Context.
 * This module manages employee data and application state, making it
 * accessible throughout the component tree.
 * 
 * Features:
 * - Global employee data management
 * - Loading state tracking
 * - Error state handling
 * - Type-safe context usage
 * - Client-side only functionality
 */

'use client'

import { createContext, useContext, ReactNode } from 'react'

/**
 * Employee Interface
 * Defines the structure of employee data stored in context
 * 
 * @property id - Unique employee identifier
 * @property first_name - Employee's first name
 * @property last_name - Employee's last name
 * @property position - Employee's job position
 */
interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
}

/**
 * App Context Type
 * Defines the structure of the application context
 * 
 * @property employee - Current employee data or null if not authenticated
 * @property isLoading - Global loading state indicator
 * @property error - Global error state
 */
interface AppContextType {
  employee: Employee | null
  isLoading: boolean
  error: Error | null
}

// Create the context with undefined default value
const AppContext = createContext<AppContextType | undefined>(undefined)

/**
 * App Context Hook
 * Custom hook for accessing the application context
 * Throws an error if used outside of AppProvider
 * 
 * @returns The current application context value
 * @throws Error if used outside AppProvider
 */
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

/**
 * App Provider Props
 * Props for the AppProvider component
 * 
 * @property children - Child components to be wrapped
 * @property employee - Optional employee data to initialize context
 */
interface AppProviderProps {
  children: ReactNode
  employee?: Employee | null
}

/**
 * App Provider Component
 * Provides the application context to its children
 * Initializes context with employee data and default states
 * 
 * @param props - Component properties
 * @returns Provider-wrapped children with context
 */
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