/**
 * Supabase Provider
 * Last Updated: 2024-01-15
 * 
 * Provides Supabase client and authentication state to the application.
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/lib/database/database.types'

// Type for the Supabase context
type SupabaseContext = {
  supabase: SupabaseClient<Database>
  user: User | null
  isLoading: boolean
}

// Create the context
const Context = createContext<SupabaseContext | undefined>(undefined)

// Props for the provider component
type ProviderProps = {
  children: React.ReactNode
}

/**
 * Supabase provider component
 */
export function SupabaseProvider({ children }: ProviderProps) {
  const [supabase] = useState(() => createClientComponentClient<Database>())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    getUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider value={{ supabase, user, isLoading }}>
      {children}
    </Context.Provider>
  )
}

/**
 * Hook to use the Supabase context
 */
export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 