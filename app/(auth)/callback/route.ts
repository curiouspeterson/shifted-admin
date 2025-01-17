/**
 * Authentication Callback Route Handler
 * Last Updated: 2025-01-16
 * 
 * This file implements the OAuth callback endpoint for Supabase authentication.
 * It handles the exchange of authorization codes for session tokens after successful
 * authentication with an OAuth provider or email confirmation.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database/database.types'
import { errorLogger } from '@/lib/logging/error-logger'

/**
 * GET /auth/callback
 * Handles the OAuth callback and code exchange process
 * 
 * Query Parameters:
 * - code: The authorization code from the OAuth provider
 * - next: Optional URL to redirect to after successful authentication
 * 
 * Process:
 * 1. Extracts code and next URL from query parameters
 * 2. Validates presence of authorization code
 * 3. Creates Supabase client with cookie handling
 * 4. Exchanges code for session tokens
 * 5. Redirects to success URL or error page
 * 
 * Returns: Redirect response to either:
 * - Success: The next URL or dashboard
 * - Error: Sign-in page with error message
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/dashboard'

    if (!code) {
      errorLogger.warn('OAuth callback received without code', {
        context: {
          url: request.url,
          next,
          headers: Object.fromEntries(request.headers)
        }
      })

      return NextResponse.redirect(
        new URL('/sign-in?error=No code provided', request.url)
      )
    }

    const response = NextResponse.next()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      errorLogger.error('Failed to exchange auth code for session', {
        error,
        context: {
          url: request.url,
          next,
          headers: Object.fromEntries(request.headers)
        }
      })
      throw error
    }

    return NextResponse.redirect(new URL(next, request.url))
  } catch (error) {
    errorLogger.error('Unexpected error in auth callback', {
      error,
      context: {
        url: request.url,
        headers: Object.fromEntries(request.headers)
      }
    })

    return NextResponse.redirect(
      new URL('/sign-in?error=Failed to authenticate', request.url)
    )
  }
} 