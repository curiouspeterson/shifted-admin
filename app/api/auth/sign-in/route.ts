/**
 * Sign In Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user sign in with rate limiting and validation.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { 
  loginRequestSchema, 
  type LoginResponse 
} from '@/lib/validations/auth'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AuthError } from '@/lib/errors'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 30 * 60, // 30 minutes
  keyPrefix: 'sign-in'
})

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: loginRequestSchema
  },
  handler: async (req) => {
    try {
      const body = await req.json()
      const { email, password } = loginRequestSchema.parse(body)

      const supabase = createClient(cookies())
      const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error !== null || user === null) {
        throw new AuthError(
          error?.message || 'Authentication failed',
          { cause: error }
        )
      }

      return NextResponse.json<ApiResponse<LoginResponse>>({
        data: {
          user: {
            id: user.id,
            email: user.email!,
            firstName: user.user_metadata['firstName'],
            lastName: user.user_metadata['lastName']
          }
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