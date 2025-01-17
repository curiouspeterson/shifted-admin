/**
 * API Utilities
 * Last Updated: 2025-01-17
 * 
 * Provides utilities for API route handlers including rate limiting and validation.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { RateLimiter } from './rate-limiting'
import { isAppError } from '@/lib/errors/types'

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
  status?: number
}

export interface ApiHandlerOptions<TResponse, TRequest = unknown> {
  rateLimit?: RateLimiter
  validate?: {
    body?: z.ZodType<TRequest>
    query?: z.ZodSchema
  }
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>
}

export const createRouteHandler = <TResponse, TRequest = unknown>(
  options: ApiHandlerOptions<TResponse, TRequest>
): ((req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>) => {
  return async (req: NextRequest) => {
    try {
      // Check rate limit if enabled
      if (options.rateLimit) {
        const forwardedFor = req.headers.get('x-forwarded-for')
        const identifier = req.ip ?? (
          forwardedFor !== null && forwardedFor.trim() !== '' 
            ? forwardedFor 
            : 'unknown'
        )
        const isLimited = await options.rateLimit.isRateLimited(identifier)
        
        if (isLimited) {
          return NextResponse.json<ApiResponse<TResponse>>(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
      }

      // Validate request body if schema provided
      if (options.validate?.body && req.method !== 'GET') {
        const body = await req.json()
        const result = await options.validate.body.safeParseAsync(body)
        
        if (!result.success) {
          return NextResponse.json<ApiResponse<TResponse>>(
            { 
              error: 'Invalid request body',
              details: result.error.errors
            },
            { status: 400 }
          )
        }
      }

      // Handle the request
      const response = await options.handler(req)
      
      // Handle errors in response
      const data = await response.json() as ApiResponse<TResponse>
      if (data.error) {
        return NextResponse.json<ApiResponse<TResponse>>(data, { status: data.status ?? 500 })
      }

      return response
    } catch (error) {
      console.error('Route handler error:', error)
      
      if (isAppError(error)) {
        return NextResponse.json<ApiResponse<TResponse>>(
          { 
            error: error.message,
            details: error.details,
            status: error.status
          },
          { status: error.status }
        )
      }
      
      return NextResponse.json<ApiResponse<TResponse>>(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
} 