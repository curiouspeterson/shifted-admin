/**
 * Next.js Middleware Configuration
 * Last Updated: 2024-03
 * 
 * This middleware handles authentication and routing logic for the application.
 * Features:
 * - Supabase client initialization with cookie handling
 * - Authentication state management
 * - Protected route access control
 * - Efficient route matching
 * - Structured error handling
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/app/lib/supabase/database.types';
import { createMiddlewareCookieHandler } from '@/app/lib/supabase/cookies';
import { AppError, AuthError } from '@/app/lib/errors';

// Route patterns for classification
const ROUTE_PATTERNS = {
  auth: ['/sign-in', '/sign-up'],
  public: ['/', '/api/docs', '/api/docs/ui'],
  static: ['/_next', '/public', '/favicon.ico'],
  api: ['/api'],
} as const;

/**
 * Checks if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => path.startsWith(pattern));
}

/**
 * Classifies a route based on its path
 */
function classifyRoute(path: string) {
  if (matchesPattern(path, ROUTE_PATTERNS.auth)) return 'auth';
  if (matchesPattern(path, ROUTE_PATTERNS.public)) return 'public';
  if (matchesPattern(path, ROUTE_PATTERNS.static)) return 'static';
  if (matchesPattern(path, ROUTE_PATTERNS.api)) return 'api';
  return 'protected';
}

/**
 * Main middleware function that runs on all matched routes
 * Handles authentication state and redirects
 */
export async function middleware(request: NextRequest) {
  // Set up request headers for the middleware chain
  const requestHeaders = new Headers(request.headers);
  const res = NextResponse.next();
  res.headers.set('x-middleware-cache', 'no-cache');

  try {
    // Initialize Supabase client with cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createMiddlewareCookieHandler(request, res)
      }
    );

    // Verify authentication status
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new AuthError('Failed to verify authentication');
    }

    // Classify the current route
    const routeType = classifyRoute(request.nextUrl.pathname);

    // Handle route-specific logic
    switch (routeType) {
      case 'auth':
        // Redirect authenticated users away from auth pages
        if (session) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        break;

      case 'protected':
        // Redirect unauthenticated users to sign-in
        if (!session) {
          const redirectUrl = new URL('/sign-in', request.url);
          redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
        break;

      case 'api':
        // API routes handle their own authentication
        break;

      case 'public':
      case 'static':
        // No authentication needed
        break;
    }

    return res;
  } catch (error) {
    // Log the error but continue the request
    // API routes will handle authentication errors properly
    console.error('Middleware error:', {
      error,
      path: request.nextUrl.pathname,
      method: request.method,
    });
    return res;
  }
}

/**
 * Middleware Configuration
 * Defines specific patterns for route matching
 */
export const config = {
  matcher: [
    // Auth routes
    '/sign-in/:path*',
    '/sign-up/:path*',
    
    // Protected routes
    '/dashboard/:path*',
    '/settings/:path*',
    '/profile/:path*',
    
    // API routes (excluding docs)
    '/api/:path*',
    
    // Dynamic routes (excluding static files and API docs)
    '/((?!_next/static|_next/image|favicon.ico|public|api/docs).*)'
  ],
}; 