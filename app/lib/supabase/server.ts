/**
 * Supabase Server Client
 * Last Updated: 2025-03-19
 * 
 * Creates a Supabase client for server-side operations with proper cookie handling.
 * Implements 2025 best practices for Next.js App Router and React Server Components.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'
import { errorLogger } from '@/app/lib/logging/error-logger'
import { experimental_taintObjectReference } from 'react'

export const createClient = () => {
  try {
    // Create cookie handlers with proper error handling
    const cookieHandlers = {
      get(name: string) {
        try {
          const cookieStore = cookies()
          const cookie = cookieStore.get(name)
          return cookie?.value ?? null
        } catch (error) {
          errorLogger.error('Failed to get cookie:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'UnknownError',
            cookie: name
          })
          return null
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          const cookieStore = cookies()
          cookieStore.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true,
            path: '/'
          })
        } catch (error) {
          errorLogger.error('Failed to set cookie:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'UnknownError',
            cookie: name
          })
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          const cookieStore = cookies()
          cookieStore.set({
            name,
            value: '',
            ...options,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: true,
            path: '/'
          })
        } catch (error) {
          errorLogger.error('Failed to remove cookie:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'UnknownError',
            cookie: name
          })
        }
      }
    }

    // Create Supabase client with cookie handlers
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: cookieHandlers,
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )

    // Prevent client from being passed to Client Components
    experimental_taintObjectReference(
      'Do not pass the Supabase client to client components',
      client
    )

    return client
  } catch (error) {
    errorLogger.error('Failed to create Supabase client:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
} 