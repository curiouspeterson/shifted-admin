/**
 * Authentication Middleware
 * Last Updated: 2025-01-16
 * * 
 * Handles authentication, route protection, and session management.
 * Uses Supabase Auth and implements best practices for Next.js App Router.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

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
    // Log error and return 500 response
    console.error('Middleware error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Configure the middleware
export const config = {
  // Match all routes except static files and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}