/**
 * Sign In API Route Handler
 * Last Updated: 2024-01-16
 * 
 * This file implements the authentication endpoint for user sign-in.
 * Handles email/password authentication using Supabase Auth.
 */

import { cookies } from 'next/headers'
import { z } from 'zod'
import { createRouteHandler } from '@/lib/api/handler'
import { createClient } from '@/lib/supabase/server'
import { defaultRateLimits } from '@/lib/api/rate-limit'
import { AuthenticationError } from '@/lib/errors'
import type { RouteContext } from '@/lib/api/types'

// Validation schema for sign-in credentials
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type SignInBody = z.infer<typeof signInSchema>

// Custom rate limits for sign-in attempts
const signInRateLimits = {
  ...defaultRateLimits.auth,
  limit: 5, // 5 attempts per minute
  identifier: 'auth:sign-in'
}

export const POST = createRouteHandler({
  methods: ['POST'],
  bodySchema: signInSchema,
  rateLimit: signInRateLimits,
  cache: false, // Disable caching for auth endpoints
  handler: async ({ body }: RouteContext<SignInBody>) => {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (error) {
      throw new AuthenticationError(error.message)
    }

    return {
      data: {
        user: data.user,
        session: data.session
      },
      error: null
    }
  }
}) 