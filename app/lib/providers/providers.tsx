'use client';

import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'

const supabase = createClient()

export const AppContext = createContext<{
  isLoading: boolean
  isAuthenticated: boolean
}>({
  isLoading: true,
  isAuthenticated: false,
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log('Providers mounted, checking auth...')
    
    const checkAuth = async () => {
      try {
        console.log('Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session check result:', { session, error })
        setIsAuthenticated(!!session)
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, session })
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  console.log('Providers rendering with:', { isLoading, isAuthenticated })

  return (
    <AppContext.Provider value={{ isLoading, isAuthenticated }}>
      {children}
    </AppContext.Provider>
  )
} 