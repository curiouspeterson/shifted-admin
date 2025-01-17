/**
 * Register API Route
 * Last Updated: 2025-01-16
 * 
 * Handles user registration with rate limiting and validation.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
import { 
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_TOO_MANY_REQUESTS,
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

    // Parse request body
    const body = await request.json();

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return Response.json({
        error: {
          message: 'User already exists',
          code: 'auth/user-exists'
        }
      }, { status: HTTP_STATUS_CONFLICT });
    }

    // Create user
    const { data: newUser, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          position: body.position,
          role: body.role
        }
      }
    });

    if (signUpError) {
      errorLogger.error('Failed to create user account', {
        error: signUpError,
        context: {
          email: body.email,
          position: body.position,
          role: body.role
        }
      });

      return Response.json({
        error: {
          message: signUpError.message,
          code: 'auth/signup-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    return Response.json({
      data: newUser,
      error: null
    });
  } catch (error) {
    errorLogger.error('Unexpected error during registration', {
      error,
      context: {
        url: request.url,
        method: request.method
      }
    });

    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Registration failed',
        code: 'auth/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
} 