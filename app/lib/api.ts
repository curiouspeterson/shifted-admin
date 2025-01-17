/**
 * API Utilities
 * Last Updated: 2025-01-17
 * 
 * Provides utilities for API route handlers including rate limiting and validation.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { RateLimiter } from './rate-limiter'

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface ApiHandlerOptions<T> {
  rateLimit?: RateLimiter
  validate?: {
    body?: z.ZodType<T>
    query?: z.ZodSchema
  }
  handler: (req: NextRequest) => Promise<NextResponse>
}

export type RouteHandler<T> = (options: ApiHandlerOptions<T>) => (req: NextRequest) => Promise<NextResponse>

export const createRouteHandler = <T>(options: ApiHandlerOptions<T>): ((req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
        const rateLimited = await options.rateLimit.isRateLimited(ip)
        
        if (rateLimited === true) {
          return NextResponse.json<ApiResponse<T>>(
            { error: 'Too many requests' },
            { status: 429 }
          )
        }
      }

      // Validation
      if (options.validate?.body) {
        const body = await req.json()
        const result = await options.validate.body.safeParseAsync(body)
        
        if (!result.success) {
          return NextResponse.json<ApiResponse<T>>(
            { error: 'Invalid request body' },
            { status: 400 }
          )
        }
      }

      // Handle request
      return options.handler(req)
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json<ApiResponse<T>>(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
} 