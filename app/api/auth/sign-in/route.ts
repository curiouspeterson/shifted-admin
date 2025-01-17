/**
 * Sign In Route Handler
 * Last Updated: 2024-03-19
 * 
 * Handles user sign in with rate limiting and validation.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { 
  loginRequestSchema, 
  type LoginResponse,
  type LoginRequest
} from '@/lib/validations/auth'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@/lib/errors'
import { type NextRequest } from 'next/server'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 30 * 60, // 30 minutes
  keyPrefix: 'sign-in'
})

export const POST = createRouteHandler<LoginResponse, LoginRequest>({
  rateLimit: rateLimiter,
  validate: {
    body: loginRequestSchema
  },
  handler: async (req: NextRequest, { body }: { body: LoginRequest }) => {
    try {
      const { email, password } = body

      const supabase = createClient(cookies())
      const { data: { session, user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error !== null || user === null) {
        throw new AuthError(
          error?.message ?? 'Authentication failed',
          { cause: error }
        )
      }

      if (!session) {
        throw new AuthError('No session created')
      }

      return NextResponse.json<ApiResponse<LoginResponse>>({
        data: {
          user: {
            id: user.id,
            email: user.email ?? '',
            firstName: user.user_metadata['firstName'] ?? '',
            lastName: user.user_metadata['lastName'] ?? ''
          },
          token: session.access_token
        }
      })
    } catch (error) {
      console.error('Sign in failed:', error)
      
      if (error instanceof AuthError) {
        return NextResponse.json<ApiResponse<LoginResponse>>(
          { error: error.message },
          { status: 401 }
        )
      }

      return NextResponse.json<ApiResponse<LoginResponse>>(
        { error: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}) 