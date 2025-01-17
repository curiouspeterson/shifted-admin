/**
 * Sign Out API Route
 * Last Updated: 2025-01-16
 * 
 * Handles user sign out with rate limiting.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
import { 
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_TOO_MANY_REQUESTS 
} from '@/lib/constants/http';
import { errorLogger } from '@/lib/logging/error-logger';

// Create rate limiter for auth endpoints
const checkAuthRateLimit = createRateLimiter(defaultRateLimits.auth);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkAuthRateLimit(ip);
    
    if (!isAllowed) {
      return Response.json({
        error: {
          message: 'Too many requests',
          code: 'auth/rate-limit-exceeded'
        }
      }, { status: HTTP_STATUS_TOO_MANY_REQUESTS });
    }

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Sign out user
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      errorLogger.error('Failed to sign out user', {
        error: signOutError,
        context: {
          url: request.url,
          method: request.method
        }
      });

      return Response.json({
        error: {
          message: signOutError.message,
          code: 'auth/signout-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    return Response.json({
      data: { success: true },
      error: null
    });
  } catch (error) {
    errorLogger.error('Unexpected error during sign out', {
      error,
      context: {
        url: request.url,
        method: request.method
      }
    });

    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Sign out failed',
        code: 'auth/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
} 