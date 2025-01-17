/**
 * Auth Provider Component
 * Last Updated: 2025-03-19
 * 
 * Manages authentication state and token handling for the application.
 * Uses modern React patterns and Next.js best practices.
 */

'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ApiResponse } from '@/lib/api'
import type { LoginResponse } from '@/lib/validations/auth'
import { loginResponseSchema } from '@/lib/validations/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for existing auth token on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (typeof token === 'string' && token.length > 0) {
          // Validate token here
          setIsAuthenticated(true)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json() as ApiResponse<LoginResponse>

      if (!response.ok) {
        const errorMessage = data.error !== null && typeof data.error === 'string' && data.error.length > 0 
          ? data.error 
          : 'Authentication failed'
        throw new Error(errorMessage)
      }

      // Validate response data against schema
      const validatedData = loginResponseSchema.parse(data.data)
      const token = validatedData.token

      // Store token and update state
      localStorage.setItem('auth_token', token)
      setIsAuthenticated(true)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign in failed'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      localStorage.removeItem('auth_token')
      setIsAuthenticated(false)
      router.push('/sign-in')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Sign out failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 