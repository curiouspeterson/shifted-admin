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
import 'server-only'

import type { Database } from './database.types'

export function createClient() {
  try {
    // Initialize cookie store
    const cookieStore = cookies()

    // Create Supabase client with cookie handling
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            try {
              cookieStore.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true
              })
            } catch (error) {
              errorLogger.error('Failed to set cookie:', { error, name })
            }
          },
          remove: (name: string, options: CookieOptions) => {
            try {
              cookieStore.set(name, '', {
                ...options,
                maxAge: -1
              })
            } catch (error) {
              errorLogger.error('Failed to remove cookie:', { error, name })
            }
          }
        },
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )

    return client
  } catch (error) {
    errorLogger.error('Failed to create Supabase client:', { error })
    throw error
  }
} 