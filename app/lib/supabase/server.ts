/**
 * Supabase Server Client Utility
 * Last Updated: 2024-03-20
 * 
 * This module provides a server-side Supabase client for use in Server Components
 * and API routes. It uses environment variables for configuration and includes
 * proper typing for the database schema.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Create a Supabase client for server-side operations
 */
export function createClient(cookieStore = cookies()) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

/**
 * Create a Supabase admin client for server-side operations
 * This client has elevated privileges and should only be used in trusted contexts
 */
export function createAdminClient(cookieStore = cookies()) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
      auth: {
        persistSession: false,
      },
    }
  )
} 