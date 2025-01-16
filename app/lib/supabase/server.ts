/**
 * Server-side Supabase Client
 * Last Updated: 2025-01-16
 * 
 * Creates a Supabase client configured for server-side usage
 * with proper cookie handling for Next.js server components and actions.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database/database.types'
import type { CookieOptions } from '@supabase/ssr'

const cookieOptions: CookieOptions = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
}

export function createClient(cookieStore = cookies()) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions = cookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies.set error in read-only contexts
          }
        },
        remove(name: string, options: CookieOptions = cookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies.delete error in read-only contexts
          }
        },
      },
    }
  )
} 