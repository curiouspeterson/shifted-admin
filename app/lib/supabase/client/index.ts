/**
 * Client-Side Supabase Configuration
 * Last Updated: 2024-03
 * 
 * This file configures and exports a Supabase client instance for client-side usage.
 * It provides a typed client with public credentials for authenticated but restricted 
 * database access.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Creates a typed Supabase client for browser usage
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}

/**
 * Pre-configured Supabase client instance
 * Use this singleton instance to avoid creating multiple connections
 */
export const supabase = createClient() 