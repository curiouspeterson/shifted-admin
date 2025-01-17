/**
 * Sign Out API Route
 * Last Updated: 2024-03-21
 * 
 * Handles user sign out with rate limiting.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
import { HTTP_STATUS_BAD_REQUEST } from '@/lib/constants/http';

// Create rate limiter for auth endpoints
const authRateLimiter = createRateLimiter(defaultRateLimits.auth);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await authRateLimiter.check(ip);

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Sign out user
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
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
    console.error('Sign out error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Sign out failed',
        code: 'auth/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
} 