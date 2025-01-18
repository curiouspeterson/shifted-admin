/**
 * Sign In Route Handler
 * Last Updated: 2025-03-19
 * 
 * Handles user authentication with rate limiting, validation, and proper error handling.
 * Uses the latest @supabase/ssr package for better server-side auth handling.
 */

import { RateLimiter } from '@/app/lib/rate-limiting'
import { 
  loginRequestSchema, 
  type LoginResponse,
  type LoginRequest
} from '@/app/lib/validations/auth'
import { createRouteHandler, type ApiResponse } from '@/app/lib/api'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@/app/lib/errors/auth'
import { ValidationError } from '@/app/lib/errors/validation'
import { type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60,
  blockDuration: 30 * 60,
  keyPrefix: 'sign-in'
})

export const POST = createRouteHandler<LoginResponse, LoginRequest>({
  rateLimit: rateLimiter,
  validate: {
    body: loginRequestSchema
  },
  handler: async (req: NextRequest, { body }: { body: LoginRequest }) => {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    try {
      const { email, password } = body

      // Attempt authentication
      const authResponse = await supabase.auth.signInWithPassword({
        email,
        password
      })

      // Check for authentication errors
      if (authResponse.error) {
        throw new AuthError('Authentication failed', {
          cause: authResponse.error,
          details: {
            message: authResponse.error.message,
            status: 401
          }
        })
      }

      // Extract and validate auth data
      const { data } = authResponse
      if (data === null || data === undefined) {
        throw new AuthError('No authentication data received', {
          details: { status: 401 }
        })
      }

      // Extract and validate user data
      const { user, session } = data
      if (user === null || user === undefined) {
        throw new AuthError('No user data received', {
          details: { status: 401 }
        })
      }
      if (session === null || session === undefined) {
        throw new AuthError('No session created', {
          details: { status: 401 }
        })
      }

      // Create response with user data
      const responseData: ApiResponse<LoginResponse> = {
        data: {
          user: {
            id: user.id,
            email: user.email ?? '',
            firstName: user.user_metadata['firstName'] ?? '',
            lastName: user.user_metadata['lastName'] ?? ''
          },
          token: session.access_token
        }
      }

      // Log successful authentication
      console.info(`User authenticated successfully: ${user.id}`)

      // Return success response - client will handle redirect
      return NextResponse.json(responseData, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    } catch (error: unknown) {
      // Enhanced error logging
      console.error('Authentication error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        path: req.url,
        details: error instanceof AuthError ? error.details : undefined
      })
      
      // Determine status code from error
      let status = 500
      if (error instanceof AuthError && typeof error.details?.status === 'number') {
        status = error.details.status
      } else if (error instanceof ValidationError) {
        status = 400
      }

      // Return error response
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'An unexpected error occurred during authentication'
      }, {
        status,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
    }
  }
}) 