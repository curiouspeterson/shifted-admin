/**
 * Supabase Provider
 * Last Updated: 2025-01-16
 * 
 * Context provider for Supabase client and session state.
 * This component should wrap any client components that need
 * access to Supabase functionality.
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '.'

interface SupabaseContext {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  loading: boolean
}

const Context = createContext<SupabaseContext>({
  supabase,
  session: null,
  user: null,
  loading: true,
})

export default function SupabaseProvider({
  children,
  session: initialSession,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  const [session, setSession] = useState<Session | null>(initialSession)
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSession(session)
        setUser(session.user)
      } else {
        setSession(null)
        setUser(null)
      }

      setLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const value = {
    supabase,
    session,
    user,
    loading,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 