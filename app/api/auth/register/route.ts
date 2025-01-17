/**
 * Register Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user registration with rate limiting and validation.
 */

import { RateLimiter } from '@/lib/rate-limiter'
import { registerSchema } from '@/lib/validations/auth'
import { createRouteHandler } from '@/lib/api'
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

interface RegisterResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export const POST = createRouteHandler<RegisterResponse>({
  rateLimit: rateLimiter,
  validate: {
    body: registerSchema
  },
  handler: async (req) => {
    const { email, password, firstName, lastName } = await req.json()

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

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email!,
          firstName: user.user_metadata.firstName,
          lastName: user.user_metadata.lastName
        }
      }
    })
  }
}) 