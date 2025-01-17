/**
 * Register API Route
 * Last Updated: 2024-03-21
 * 
 * Handles user registration with rate limiting and validation.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
import { ApiResponse } from '@/lib/api/types';
import { 
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
} from '@/lib/constants/http';

// Create rate limiter for auth endpoints
const authRateLimiter = createRateLimiter(defaultRateLimits.auth);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await authRateLimiter.check(ip);

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
    console.error('Registration error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Registration failed',
        code: 'auth/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
} 