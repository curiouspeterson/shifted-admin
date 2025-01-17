/**
 * Employee API Route
 * Last Updated: 2024-03-21
 * 
 * Handles employee CRUD operations with rate limiting.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';
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

    // Get employee
    const { data: employee, error } = await supabase
      .from('employees')
      .select()
      .eq('id', params.id)
      .single();

    if (error) {
      return Response.json({
        error: {
          message: error.message,
          code: 'employees/fetch-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    if (!employee) {
      return Response.json({
        error: {
          message: 'Employee not found',
          code: 'employees/not-found'
        }
      }, { status: HTTP_STATUS_NOT_FOUND });
    }

    return Response.json({
      data: employee,
      error: null
    });
  } catch (error) {
    console.error('Employee fetch error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch employee',
        code: 'employees/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Check rate limit
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await apiRateLimiter.check(ip);

    // Parse request body
    const updates = await request.json();

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Update employee
    const { data: employee, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return Response.json({
        error: {
          message: error.message,
          code: 'employees/update-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    return Response.json({
      data: employee,
      error: null
    });
  } catch (error) {
    console.error('Employee update error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to update employee',
        code: 'employees/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
}

export async function DELETE(
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

    // Delete employee
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', params.id);

    if (error) {
      return Response.json({
        error: {
          message: error.message,
          code: 'employees/delete-failed'
        }
      }, { status: HTTP_STATUS_BAD_REQUEST });
    }

    return Response.json({
      data: { success: true },
      error: null
    });
  } catch (error) {
    console.error('Employee delete error:', error);
    return Response.json({
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete employee',
        code: 'employees/unknown-error'
      }
    }, { status: HTTP_STATUS_BAD_REQUEST });
  }
} 