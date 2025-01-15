/**
 * Client-Side Supabase Configuration
 * Last Updated: 2024-03
 * 
 * This file configures and exports a Supabase client instance for client-side usage.
 * It provides a typed client with public credentials for authenticated but restricted 
 * database access.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: The URL of your Supabase project
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: The public anon/client key
 *   Note: This key is safe to expose to the browser as it has restricted access
 * 
 * Type Safety:
 * - Uses Database type definition for full type safety across queries
 * - Enables TypeScript autocompletion for database schema
 * 
 * Usage:
 * Import the pre-configured client instance:
 * ```
 * import { supabase } from '@/lib/supabase/supabaseClient'
 * 
 * const { data, error } = await supabase
 *   .from('table')
 *   .select()
 * ```
 * 
 * Security Notes:
 * - Only use this client for browser-side operations
 * - All operations will be restricted by Row Level Security policies
 * - For admin/privileged access, use the admin client instead
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Creates a typed Supabase client for browser usage
 * @returns A Supabase client instance with Database type definitions
 */
export const createClient = () => {
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