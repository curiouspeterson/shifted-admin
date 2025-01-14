/**
 * Supabase Server Client Module
 * Last Updated: 2024
 * 
 * Provides server-side Supabase client initialization and configuration.
 * This module creates a server-side client with cookie handling for
 * session management in server components and API routes.
 * 
 * Features:
 * - Type-safe database operations
 * - Server-specific client configuration
 * - Cookie-based session handling
 * - Next.js server component integration
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

/**
 * Create Server Client
 * Creates a new Supabase client configured for server-side usage
 * Includes cookie handling for session management
 * 
 * @returns Typed Supabase client instance with cookie support
 */
export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}; 