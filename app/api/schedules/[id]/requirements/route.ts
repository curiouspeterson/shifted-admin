/**
 * Schedule Requirements API Route
 * Last Updated: 2024-03-21
 * 
 * Handles schedule requirements operations with rate limiting.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
import { TimeRequirementsOperations } from '@/lib/api/database/time-requirements';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_NOT_FOUND } from '@/lib/constants/http';

// Create rate limiter for API endpoints
const apiRateLimiter = createRateLimiter(defaultRateLimits.api);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await apiRateLimiter.check(ip);

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Initialize database operations
    const timeRequirements = new TimeRequirementsOperations(supabase);

    // Get requirements
    const { data: requirements, error } = await timeRequirements.findMany({
      filter: {
        schedule_id: params.id
      }
    });

    if (error) {
      return Response.json({
        error: {
          message: error.message,
          code: 'requirements/fetch-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    if (!requirements?.length) {
      return Response.json({
        error: {
          message: 'Requirements not found',
          code: 'requirements/not-found'
        }
      }, { status: HTTP_STATUS_NOT_FOUND });
    }

    return Response.json({
      data: requirements,
      error: null
    });
  } catch (error) {
    console.error('Requirements fetch error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch requirements',
        code: 'requirements/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await apiRateLimiter.check(ip);

    // Parse request body
    const requirement = await request.json();

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Initialize database operations
    const timeRequirements = new TimeRequirementsOperations(supabase);

    // Create requirement
    const { data: newRequirement, error } = await timeRequirements.create({
      ...requirement,
      schedule_id: params.id
    });

    if (error) {
      return Response.json({
        error: {
          message: error.message,
          code: 'requirements/create-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    return Response.json({
      data: newRequirement,
      error: null
    });
  } catch (error) {
    console.error('Requirement creation error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to create requirement',
        code: 'requirements/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
}