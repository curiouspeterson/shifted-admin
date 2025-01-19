/**
 * Middleware Composition
 * Last Updated: 2025-03-19
 * 
 * Composes multiple middleware functions into a single chain.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './rate-limit'
import { requestLogger } from './request-logger'
import { errorLogger } from '@/app/lib/logging/error-logger'

export async function middleware(req: NextRequest) {
  try {
    // Start request logging
    const loggerResult = await requestLogger(req)
    const headers = new Headers(loggerResult?.headers)

    // Apply rate limiting
    const rateLimitResult = rateLimit(req)
    
    // If rate limit exceeded, return 429 response
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }
    
    // Merge headers from all middleware
    if (rateLimitResult?.headers) {
      for (const [key, value] of rateLimitResult.headers.entries()) {
        headers.set(key, value)
      }
    }

    // Continue with the request
    const response = NextResponse.next({
      request: {
        headers: req.headers
      }
    })

    // Apply all collected headers to the response
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value)
    }

    return response
  } catch (error) {
    errorLogger.error('Middleware error:', { error })
    
    // Return 500 error for middleware failures
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Configure middleware matching
export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
} 