/**
 * Auth Provider Component
 * Last Updated: 2025-03-19
 * 
 * Manages authentication state and provides auth-related functions.
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  // Check auth status on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setIsAuthenticated(!!session)
      } catch (err) {
        console.error('Error checking auth status:', err)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data?.session === null || data?.session === undefined) {
        throw new Error('No session returned')
      }

      setIsAuthenticated(true)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in'))
      throw err // Re-throw for form component to handle
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setIsAuthenticated(false)
      router.push('/sign-in')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const value = React.useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      error,
      signIn,
      signOut,
    }),
    [isAuthenticated, isLoading, error]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 