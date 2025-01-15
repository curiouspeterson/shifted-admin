/**
 * Supabase Server Client
 * Last Updated: 2024-03
 * 
 * Server-side Supabase client for use in server components and server actions.
 * Uses standardized cookie handling from cookies.ts.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';
import { createServerCookieHandler } from './cookies';

export function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createServerCookieHandler()
    }
  );
} 