/**
 * Supabase Server Client
 * Last Updated: 2024
 * 
 * Server-side Supabase client for use in server components and server actions.
 * Handles session management and cookie handling.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export function createClient(cookieStore: ReturnType<typeof cookies>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path: string; maxAge: number }) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // This can happen in middleware when the cookie is already set
          }
        },
        remove(name: string, options: { path: string }) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: -1 });
          } catch (error) {
            // This can happen in middleware when the cookie is already set
          }
        },
      },
    }
  );
} 