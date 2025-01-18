/**
 * Authentication Middleware
 * Last Updated: 2025-03-19
 * 
 * Handles authentication, route protection, and session management.
 * Uses Supabase Auth and implements best practices for Next.js App Router.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { errorLogger } from '@/app/lib/logging/error-logger'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/employees',
  '/schedules',
  '/settings'
]

// Define auth routes
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password'
]

/**
 * Check if a route should be protected
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  try {
    // Create a response to modify
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create a Supabase client with proper error handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              return request.cookies.get(name)?.value ?? null
            } catch (error) {
              errorLogger.error('Cookie access error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
              return null
            }
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              response.cookies.set({
                name,
                value,
                ...options,
                // Enhance security in production
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true
              })
            } catch (error) {
              errorLogger.error('Cookie set error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              response.cookies.set({
                name,
                value: '',
                ...options,
                maxAge: 0
              })
            } catch (error) {
              errorLogger.error('Cookie remove error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: error instanceof Error ? error.name : 'UnknownError',
                cookie: name
              })
            }
          },
        },
      }
    )

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()

      // Get the requested pathname
      const pathname = request.nextUrl.pathname

      // Handle protected routes
      if (isProtectedRoute(pathname)) {
        if (!session) {
          // Redirect to login if not authenticated
          const redirectUrl = new URL('/login', request.url)
          redirectUrl.searchParams.set('redirect', pathname)
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Handle auth routes
      if (isAuthRoute(pathname)) {
        if (session) {
          // Redirect to dashboard if already authenticated
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      return response
    } catch (error) {
      errorLogger.error('Session handling error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined
      })
      return response
    }
  } catch (error) {
    // Log error and return 500 response
    errorLogger.error('Middleware error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    })
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Configure the middleware
export const config = {
  // Match all routes except static files and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}