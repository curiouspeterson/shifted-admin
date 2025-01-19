/**
 * Supabase Server Client
 * Last Updated: 2025-03-19
 * 
 * Creates a Supabase client for server-side operations.
 * This module should only be imported from server components.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { errorLogger } from '@/app/lib/logging/error-logger'
import { headers } from 'next/headers'
import 'server-only'

import type { Database } from './database.types'

// Validate we're in a server context
function assertServerContext() {
  try {
    headers()
  } catch (error) {
    throw new Error('Supabase client can only be created in a server context')
  }
}

export function createClient() {
  try {
    // Ensure we're in a server context
    assertServerContext()

    // Initialize cookie store
    const cookieStore = cookies()

    // Create Supabase client with cookie handling
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            try {
              return cookieStore.get(name)?.value ?? null
            } catch (error) {
              errorLogger.error('Failed to get cookie:', {
                error,
                name,
                context: 'cookie.get'
              })
              return null
            }
          },
          set: (name: string, value: string, options: CookieOptions) => {
            try {
              cookieStore.set(name, value, {
                ...options,
                // Security settings
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                httpOnly: true,
                // Set path to root to ensure cookies are available across the app
                path: '/',
                // Prevent XSS
                priority: 'high'
              })
            } catch (error) {
              errorLogger.error('Failed to set cookie:', {
                error,
                name,
                context: 'cookie.set'
              })
            }
          },
          remove: (name: string, options: CookieOptions) => {
            try {
              cookieStore.set(name, '', {
                ...options,
                maxAge: 0,
                expires: new Date(0),
                // Security settings
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                httpOnly: true,
                path: '/'
              })
            } catch (error) {
              errorLogger.error('Failed to remove cookie:', {
                error,
                name,
                context: 'cookie.remove'
              })
            }
          }
        },
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
          debug: process.env.NODE_ENV === 'development',
          autoRefreshToken: true,
          persistSession: true,
          storageKey: 'sb-session'
        }
      }
    )

    return client
  } catch (error) {
    errorLogger.error('Failed to create Supabase client:', {
      error,
      context: 'createClient',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
} 