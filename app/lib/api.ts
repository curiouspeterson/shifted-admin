/**
 * API Utilities
 * Last Updated: 2025-03-19
 * 
 * Provides utilities for API route handlers including validation and error handling.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAppError } from '@/app/lib/errors/types'

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: unknown
  status?: number
}

export interface ValidatedRequest<T> {
  body: T
}

export interface ApiHandlerOptions<TResponse, TRequest = unknown> {
  validate?: {
    body?: z.ZodType<TRequest>
    query?: z.ZodSchema
  }
  handler: (
    req: NextRequest, 
    validated: ValidatedRequest<TRequest>
  ) => Promise<NextResponse<ApiResponse<TResponse>>>
}

function getRequestIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const ip = req.ip ?? ''
  
  if (ip.trim() !== '') {
    return ip
  }
  
  if (forwardedFor.trim() !== '') {
    return forwardedFor
  }
  
  return 'unknown'
}

export const createRouteHandler = <TResponse, TRequest = unknown>(
  options: ApiHandlerOptions<TResponse, TRequest>
): ((req: NextRequest) => Promise<NextResponse<ApiResponse<TResponse>>>) => {
  return async (req: NextRequest) => {
    try {
      // Validate request body if schema provided
      let validatedBody: TRequest | undefined
      if (options.validate?.body && req.method !== 'GET') {
        const clonedReq = req.clone()
        const body = await clonedReq.json()
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
        
        validatedBody = result.data
      }

      // Handle the request
      const response = await options.handler(req, { 
        body: validatedBody as TRequest 
      })
      
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