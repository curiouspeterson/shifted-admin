/**
 * Middleware Composition
 * Last Updated: 2025-03-19
 * 
 * Composes multiple middleware functions into a single middleware chain.
 * Implements middleware composition pattern for Next.js App Router.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { debugMiddleware } from './debug'
import { middleware as authMiddleware } from '../../middleware'

export async function middleware(request: NextRequest) {
  try {
    // First run debug middleware
    const debugResponse = await debugMiddleware(request)
    if (debugResponse.status !== 200) {
      return debugResponse
    }

    // Then run auth middleware
    const authResponse = await authMiddleware(request)
    return authResponse
  } catch (error) {
    console.error('Middleware chain error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 