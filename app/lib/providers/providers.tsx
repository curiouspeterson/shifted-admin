'use client';

import { createClient } from '@/lib/supabase/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NextUIProvider } from '@nextui-org/react'

const supabase = createClient()

export const AppContext = createContext<{
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}>({
  isLoading: true,
  isAuthenticated: false,
  error: null
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('Providers mounted, checking auth...')
    let isActive = true
    
    const checkAuth = async () => {
      try {
        console.log('Checking session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check result:', { session: !!session, error: sessionError })
        
        if (sessionError) {
          throw sessionError
        }

        if (isActive) {
          setIsAuthenticated(!!session)
          if (!session) {
            console.log('No session found, redirecting to sign-in...')
            router.push('/sign-in')
          }
        }
      } catch (error) {
        console.error('Auth error:', error)
        if (isActive) {
          setError(error instanceof Error ? error : new Error('Authentication failed'))
          setIsAuthenticated(false)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session: !!session })
      
      if (isActive) {
        setIsAuthenticated(!!session)
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to sign-in...')
          router.push('/sign-in')
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in, refreshing...')
          router.refresh()
        }
      }
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [router])

  if (error) {
    return (
      <NextUIProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-red-600 text-xl font-bold mb-4">Authentication Error</h1>
            <p className="text-gray-600">{error.message}</p>
            <button
              onClick={() => {
                setError(null)
                router.push('/sign-in')
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </NextUIProvider>
    )
  }

  return (
    <NextUIProvider>
      <AppContext.Provider value={{ isLoading, isAuthenticated, error }}>
        {children}
      </AppContext.Provider>
    </NextUIProvider>
  )
} 