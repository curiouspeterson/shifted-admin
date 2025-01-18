/**
 * Supabase Server Client
 * Last Updated: 2025-03-19
 * 
 * Creates a Supabase client for server-side operations with proper cookie handling.
 * Implements error boundaries and type safety for Next.js App Router.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import 'server-only'

// Ensure this is only used in a server context
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server.')
}

export function createClient() {
  try {
    // Validate we're in a server component context
    const cookieStore = cookies()
    
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value ?? null
            } catch (error) {
              errorLogger.error('Cookie access error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
              return null
            }
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set(name, value, {
                ...options,
                // Enhance security in production
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true
              })
            } catch (error) {
              errorLogger.error('Cookie set error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set(name, '', {
                ...options,
                maxAge: 0
              })
            } catch (error) {
              errorLogger.error('Cookie remove error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
            }
          }
        },
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true,
          flowType: 'pkce'
        }
      }
    )

    return client
  } catch (error) {
    errorLogger.error('Supabase client creation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
} 