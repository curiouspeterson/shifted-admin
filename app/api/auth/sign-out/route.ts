/**
 * Sign Out Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user sign out with rate limiting.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Rate limiter: 5 attempts per 15 minutes
const rateLimiter = new RateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minutes
  blockDuration: 30 * 60, // 30 minutes
  keyPrefix: 'sign-out'
})

interface SignOutResponse {
  success: boolean
}

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async () => {
    const supabase = createClient(cookies())
    const { error } = await supabase.auth.signOut()

    if (error !== null) {
      return NextResponse.json<ApiResponse<SignOutResponse>>(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<SignOutResponse>>({
      data: {
        success: true
      }
    })
  }
}) 