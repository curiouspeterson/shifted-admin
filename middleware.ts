/**
 * Next.js Middleware Configuration
 * Last Updated: 2024
 * 
 * This middleware handles authentication and routing logic for the application.
 * It:
 * 1. Sets up Supabase client with proper cookie handling
 * 2. Manages authentication state
 * 3. Handles protected route access
 * 4. Manages authentication redirects
 * 
 * The middleware runs on all non-static routes as defined in the config matcher.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/app/lib/supabase/database.types';
import { createMiddlewareCookieHandler } from '@/app/lib/supabase/cookies';
import { handleError } from '@/app/lib/errors';

/**
 * Main middleware function that runs on all matched routes
 * Handles authentication state and redirects
 */
export async function middleware(request: NextRequest) {
  // Set up request headers for the middleware chain
  const requestHeaders = new Headers(request.headers);
  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  try {
    /**
     * Initialize Supabase client with cookie handling
     * This allows us to maintain authentication state across requests
     */
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createMiddlewareCookieHandler(request, res)
      }
    );

    // Verify authentication status
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    /**
     * Route Classification
     * Determines which routes require authentication and which are public
     * - Auth routes: sign-in and sign-up pages
     * - Protected routes: all non-public routes that require authentication
     */
    const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') || 
                       request.nextUrl.pathname.startsWith('/sign-up');
    const isProtectedRoute = !isAuthRoute && 
                           !request.nextUrl.pathname.startsWith('/api') &&
                           !request.nextUrl.pathname.startsWith('/_next') &&
                           !request.nextUrl.pathname.startsWith('/public') &&
                           request.nextUrl.pathname !== '/';

    /**
     * Authentication Redirects
     * 1. Redirect authenticated users away from auth pages
     * 2. Redirect unauthenticated users to sign-in from protected pages
     */
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue the request chain even on error
    // Route handlers will handle authentication properly
    return res;
  }
}

/**
 * Middleware Configuration
 * Defines which routes this middleware should run on
 * Excludes static files and public assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 