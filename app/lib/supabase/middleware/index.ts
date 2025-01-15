/**
 * Middleware Supabase Configuration
 * Last Updated: 2024-03
 * 
 * This file configures and exports a Supabase client instance for middleware usage.
 * It provides a typed client with cookie handling for authentication in middleware.
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, type NextResponse } from 'next/server'
import type { Database } from '../database.types'

/**
 * Creates a typed Supabase client for middleware usage
 */
export function createClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { expires?: Date }) {
          response.cookies.set({
            name,
            value,
            expires: options?.expires,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
        },
        remove(name: string, options: { expires?: Date }) {
          response.cookies.set({
            name,
            value: '',
            expires: new Date(0),
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
        },
      },
    }
  )
} 