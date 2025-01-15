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
 * - Performance monitoring
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './app/lib/rate-limit';
import { errorLogger } from './app/lib/logging/error-logger';

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
function classifyRoute(path: string): keyof typeof ROUTE_PATTERNS | 'protected' {
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
  const startTime = Date.now();
  
  try {
    // Classify route for rate limiting and auth
    const routeType = classifyRoute(request.nextUrl.pathname);
    
    // Skip rate limiting for static assets
    if (routeType !== 'static') {
      // Check rate limit with route-specific configuration
      const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
      const { success, limit, remaining, reset, analytics } = await rateLimit(ip, routeType);
      
      // Log rate limit analytics
      if (analytics) {
        errorLogger.info('Rate limit check', { 
          ...analytics,
          path: request.nextUrl.pathname,
          method: request.method,
        });
      }
      
      // Set up response with rate limit headers
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
        errorLogger.warn('Rate limit exceeded', {
          path: request.nextUrl.pathname,
          method: request.method,
          ip,
          routeType,
        });
        
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
        errorLogger.error('Auth error:', { 
          error: authError,
          path: request.nextUrl.pathname,
          method: request.method,
        });
        return res;
      }

      // Handle route access based on auth status
      if (routeType === 'protected' && !session) {
        // Redirect to sign in for protected routes
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }

      if (routeType === 'auth' && session) {
        // Redirect to dashboard if already authenticated
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Log request completion
      const duration = Date.now() - startTime;
      errorLogger.info('Request completed', {
        path: request.nextUrl.pathname,
        method: request.method,
        routeType,
        duration,
        statusCode: res.status,
      });

      return res;
    }
    
    // Return default response for static assets
    return NextResponse.next();
  } catch (error) {
    // Log any unhandled errors
    errorLogger.error('Middleware error:', {
      error,
      path: request.nextUrl.pathname,
      method: request.method,
      duration: Date.now() - startTime,
    });
    
    // Return error response
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};