/**
 * Supabase Admin Client Module
 * Last Updated: 2024
 * 
 * This module provides a Supabase client with admin privileges for server-side operations.
 * It uses service_role key for full database access.
 * 
 * IMPORTANT: This client should only be used in server-side code and API routes.
 * Never expose the service_role key to the client.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Creates a Supabase client with admin privileges
 * Uses service_role key for unrestricted database access
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
); 