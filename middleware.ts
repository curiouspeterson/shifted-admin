/**
 * Next.js Middleware Configuration
 * Last Updated: 2024-01-16
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
import { rateLimit, type RateLimitResult } from '@/lib/rate-limit';
import { errorLogger } from '@/lib/logging/error-logger';
import { 
  MiddlewareError,
  createAuthError, 
  createRateLimitError, 
  createError,
  type MiddlewareErrorCode
} from '@/lib/errors/middlewareErrors';
import { createMeasurement } from '@/lib/utils/performance';

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
 * Get response status code based on error code
 */
function getStatusCode(code: MiddlewareErrorCode): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'RATE_LIMIT_EXCEEDED':
      return 429;
    case 'CONFIGURATION_ERROR':
      return 500;
    default:
      return 500;
  }
}

/**
 * Create error response with proper headers
 */
function createErrorResponse(error: MiddlewareError): NextResponse {
  const status = getStatusCode(error.code);
  const response = NextResponse.json(
    { 
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    },
    { status }
  );

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");

  return response;
}

export async function middleware(request: NextRequest) {
  const measurement = createMeasurement();
  const routeType = classifyRoute(request.nextUrl.pathname);

  try {
    // Skip middleware for static routes
    if (routeType === 'static') {
      return NextResponse.next();
    }

    // Initialize response cookies
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options });
          },
        },
      }
    );

    // Check rate limit
    const rateLimitResult: RateLimitResult = await rateLimit(
      request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown',
      routeType
    );
    if (!rateLimitResult.success) {
      throw createRateLimitError(
        'Rate limit exceeded',
        { 
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          analytics: rateLimitResult.analytics
        }
      );
    }

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw createAuthError('Failed to get session', sessionError);
    }

    // Handle protected routes
    if (routeType === 'protected' && !session) {
      throw createAuthError('Authentication required');
    }

    // Handle auth routes (redirect if already authenticated)
    if (routeType === 'auth' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Log successful request
    const duration = measurement.elapsed();
    errorLogger.info('Request processed', {
      path: request.nextUrl.pathname,
      method: request.method,
      routeType,
      duration,
      userId: session?.user?.id
    });

    return response;
  } catch (err) {
    const duration = measurement.elapsed();

    // Handle known errors
    if (err instanceof MiddlewareError) {
      errorLogger.error('Middleware error', {
        error: err.toJSON(),
        path: request.nextUrl.pathname,
        method: request.method,
        routeType,
        duration
      });
      return createErrorResponse(err);
    }

    // Handle unknown errors
    const error = createError(
      'Internal server error',
      err instanceof Error ? err : new Error(String(err))
    );
    errorLogger.error('Unexpected middleware error', {
      error: error.toJSON(),
      path: request.nextUrl.pathname,
      method: request.method,
      routeType,
      duration
    });
    return createErrorResponse(error);
  }
}

// Configure middleware matching
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