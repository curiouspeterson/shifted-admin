/**
 * Debug Middleware
 * Last Updated: 2025-03-19
 * 
 * Provides debugging capabilities for Next.js application.
 * Implements error tracking and request logging.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { errorLogger } from '@/app/lib/logging/error-logger'

export async function debugMiddleware(request: NextRequest) {
  try {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Debug] ${request.method} ${request.url}`)
      console.log('[Debug] Headers:', Object.fromEntries(request.headers))
      
      // Log cookie operations
      const cookieStore = cookies()
      console.log('[Debug] Cookies:', cookieStore.getAll())
    }

    // Continue to the next middleware or route handler
    return NextResponse.next()
  } catch (error) {
    // Log any errors that occur
    errorLogger.error('Debug middleware error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method
    })

    // In development, show detailed error
    if (process.env.NODE_ENV === 'development') {
      console.error('[Debug] Middleware error:', error)
    }

    // Continue despite error to not block the request
    return NextResponse.next()
  }
} 