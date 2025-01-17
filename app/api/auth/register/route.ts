/**
 * Register Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user registration with rate limiting and validation.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { 
  registerRequestSchema,
  type RegisterRequest,
  type RegisterResponse 
} from '@/lib/validations/auth'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Errors } from '@/lib/errors/types'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 30 * 60, // 30 minutes
  keyPrefix: 'register'
})

export const POST = createRouteHandler<RegisterResponse, RegisterRequest>({
  rateLimit: rateLimiter,
  validate: {
    body: registerRequestSchema
  },
  handler: async (req) => {
    try {
      const body = await req.json() as RegisterRequest
      const { email, password, firstName, lastName } = registerRequestSchema.parse(body)

      const supabase = createClient(cookies())
      
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName
          }
        }
      })

      if (error !== null || user === null) {
        throw Errors.validation(
          error?.message ?? 'Failed to create user',
          { email }
        )
      }

      const response: RegisterResponse = {
        user: {
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata['firstName'],
          lastName: user.user_metadata['lastName']
        }
      }

      return NextResponse.json<ApiResponse<RegisterResponse>>({
        data: response
      })
    } catch (error) {
      console.error('Registration failed:', error)
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<RegisterResponse>>(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json<ApiResponse<RegisterResponse>>(
        { error: 'Registration failed' },
        { status: 500 }
      )
    }
  }
}) 