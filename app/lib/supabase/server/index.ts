/**
 * Server-Side Supabase Configuration
 * Last Updated: 2024-03
 * 
 * This file configures and exports a Supabase client instance for server-side usage.
 * It provides a typed client with service role credentials for full database access.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../database.types'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing environment variable: SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * Creates a typed Supabase client for server usage with service role credentials
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies.set error in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies.delete error in middleware
          }
        }
      }
    }
  )
}

/**
 * Pre-configured Supabase client instance for server-side operations
 * Use this singleton instance to avoid creating multiple connections
 */
export const supabase = createClient() 