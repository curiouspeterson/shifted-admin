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

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('auth_token')
  } catch (err) {
    console.error('Failed to access localStorage:', err)
    return null
  }
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('auth_token', token)
  } catch (err) {
    console.error('Failed to store token:', err)
  }
}

function removeStoredToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('auth_token')
  } catch (err) {
    console.error('Failed to remove token:', err)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Start with false to avoid flash
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  // Check auth status on mount
  useEffect(() => {
    const token = getStoredToken()
    if (token !== null && token.length > 0) {
      setIsAuthenticated(true)
    }
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
      setStoredToken(token)
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
      removeStoredToken()
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