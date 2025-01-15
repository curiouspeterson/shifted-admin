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
 * - Security headers
 * - Rate limiting
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './app/lib/rate-limit';

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
 * Applies security headers to the response
 */
function applySecurityHeaders(res: NextResponse): void {
  // Security headers based on OWASP recommendations
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
  ].join('; '));
}

/**
 * Main middleware function that runs on all matched routes
 * Handles authentication state and redirects
 */
export async function middleware(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success, limit, remaining, reset } = await rateLimit(ip);
    
    // Set up response with no-cache header
    const res = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    
    // Apply rate limit headers
    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: res.headers,
      });
    }

    // Apply security headers
    applySecurityHeaders(res);
    res.headers.set('x-middleware-cache', 'no-cache');

    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify authentication status
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth error:', authError);
      return res;
    }

    // Classify and handle route
    const routeType = classifyRoute(request.nextUrl.pathname);
    switch (routeType) {
      case 'auth':
        if (session) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        break;

      case 'protected':
        if (!session) {
          const redirectUrl = new URL('/sign-in', request.url);
          redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
        break;

      case 'api':
      case 'public':
      case 'static':
        // No authentication needed
        break;
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', {
      error,
      path: request.nextUrl.pathname,
      method: request.method,
    });
    return NextResponse.next();
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
    
    // Exclude static files and API docs from middleware processing
    '/((?!_next/static|_next/image|favicon.ico|public|api/docs).*)',
  ],
};