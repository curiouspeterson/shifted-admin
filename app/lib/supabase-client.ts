/**
 * Supabase Client Module
 * Last Updated: 2024
 * 
 * This module provides a configured Supabase client instance for client-side use.
 * It uses the browser client with public credentials for authenticated but
 * restricted database access.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabase/database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase client instance for browser usage
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
); 