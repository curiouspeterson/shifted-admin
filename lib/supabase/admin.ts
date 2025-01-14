/**
 * Admin Supabase Client Configuration
 * Last updated: 2024
 * 
 * This file configures and exports a Supabase client with admin privileges using 
 * the service role key. This client has unrestricted access to the database and
 * should ONLY be used in trusted server-side contexts, never exposed to the client.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: The URL of your Supabase project
 * - SUPABASE_SERVICE_ROLE_KEY: The service role key with admin access
 *   WARNING: Keep this key secret and never expose it to the client
 * 
 * Authentication Configuration:
 * - Auto refresh token is disabled since this is for server-side use
 * - Session persistence is disabled as we don't need to maintain state
 * 
 * Usage:
 * Import this client for admin operations like:
 * - Database operations requiring privileged access
 * - User management tasks
 * - System-level configurations
 * 
 * Example:
 * ```
 * import { supabaseAdmin } from 'lib/supabase/admin'
 * 
 * // Perform privileged database operations
 * const { data, error } = await supabaseAdmin
 *   .from('restricted_table')
 *   .select('*')
 * ```
 */

import { createClient } from '@supabase/supabase-js'

// Validate required environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

// Create and export the admin client instance
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false, // Disable token refresh for server-side usage
      persistSession: false    // Disable session persistence as not needed
    }
  }
)