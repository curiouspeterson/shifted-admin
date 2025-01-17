/**
 * API Utilities
 * Last Updated: 2025-01-17
 * 
 * Provides utilities for API route handlers including rate limiting and validation.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { RateLimiter, type RateLimitResult } from '../rate-limiting'

export interface ApiResponse<T> {
  data?: T
  error?: string
  rateLimit?: {
    limit: number
    remaining: number
    reset: number
  }
}

export interface ApiHandlerOptions<TResponse, TRequest = TResponse> {
  rateLimit?: RateLimiter
  validate?: {
    body?: z.ZodType<TRequest>
    query?: z.ZodSchema
  }
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>
}

export type RouteHandler<TResponse, TRequest = TResponse> = 
  (options: ApiHandlerOptions<TResponse, TRequest>) => 
  (req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>

export const createRouteHandler = <TResponse, TRequest = TResponse>(
  options: ApiHandlerOptions<TResponse, TRequest>
): ((req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>) => {
  return async (req: NextRequest) => {
    try {
      // Rate limiting
      let rateLimitResult: RateLimitResult | undefined
      
      if (options.rateLimit) {
        const forwardedFor = req.headers.get('x-forwarded-for')
        const reqIp = req.ip as string | null
        
        const ip = forwardedFor !== null && forwardedFor !== '' 
          ? forwardedFor 
          : reqIp !== null && reqIp !== '' 
            ? reqIp 
            : 'unknown'
        
        rateLimitResult = await options.rateLimit.check(ip)
        
        if (!rateLimitResult.success) {
          return NextResponse.json<ApiResponse<TResponse>>(
            { 
              error: 'Too many requests',
              rateLimit: {
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                reset: rateLimitResult.reset
              }
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.reset.toString()
              }
            }
          )
        }
      }

      // Validation
      if (options.validate?.body) {
        const body = await req.json()
        const result = await options.validate.body.safeParseAsync(body)
        
        if (!result.success) {
          return NextResponse.json<ApiResponse<TResponse>>(
            { error: 'Invalid request body' },
            { status: 400 }
          )
        }
      }

      // Handle request
      const response = await options.handler(req)
      
      // Add rate limit headers if available
      if (rateLimitResult) {
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())
      }
      
      return response
    } catch (error) {
      console.error('API Error:', error)
      return NextResponse.json<ApiResponse<TResponse>>(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
} 