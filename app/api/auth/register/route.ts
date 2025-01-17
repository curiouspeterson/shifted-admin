/**
 * Register Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user registration with rate limiting and validation.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { 
  registerRequestSchema, 
  type RegisterResponse 
} from '@/lib/validations/auth'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 30 * 60, // 30 minutes
  keyPrefix: 'register'
})

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: registerRequestSchema
  },
  handler: async (req) => {
    const body = await req.json()
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
      return NextResponse.json<ApiResponse<RegisterResponse>>(
        { error: error !== null ? error.message : 'Failed to create user' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<RegisterResponse>>({
      data: {
        user: {
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata['firstName'],
          lastName: user.user_metadata['lastName']
        }
      }
    })
  }
}) 