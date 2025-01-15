/**
 * Time-Off Requests API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the API endpoints for managing employee time-off requests:
 * - GET: List all time-off requests for the authenticated employee
 * - POST: Create a new time-off request
 * 
 * Features:
 * - Role-based access control (employee access)
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - Database type safety
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 404: Employee not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { HTTP_STATUS_OK, HTTP_STATUS_CREATED } from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
  NotFoundError,
} from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';

// Database types for type safety
type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row'];
type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert'];

// Request validation schemas
const timeOffRequestSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['pending', 'approved', 'rejected']),
  reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const timeOffRequestInputSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  reason: z.string().optional(),
});

// Custom rate limits for request operations
const requestRateLimits = {
  // List requests (100 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 100,
    identifier: 'requests:list',
  },
  // Create request (20 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 20,
    identifier: 'requests:create',
  },
} as const;

// Cache configuration for requests
const requestCacheConfig = {
  // List operation (30 seconds cache)
  list: {
    ...cacheConfigs.short,
    ttl: 30,
    prefix: 'api:requests:list',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/requests
 * List all time-off requests for the authenticated employee
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  rateLimit: requestRateLimits.list,
  middleware: middlewareConfig,
  cache: requestCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase,
    session,
    cache,
  }: RouteContext): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Get employee ID for the authenticated user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (employeeError || !employee) {
      throw new NotFoundError('Employee record not found');
    }

    // Fetch time-off requests for the employee
    const { data: requests, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch requests', error);
    }

    // Validate request data
    const validatedRequests = requests?.map(request => {
      try {
        return timeOffRequestSchema.parse(request);
      } catch (err) {
        throw new ValidationError('Invalid request data format', err);
      }
    }) || [];

    return {
      data: validatedRequests,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: validatedRequests.length,
        timestamp: new Date().toISOString(),
        ...(cache && {
          cached: true,
          cacheHit: cache.hit,
          cacheTtl: cache.ttl,
        }),
      },
    };
  },
});

/**
 * POST /api/requests
 * Create a new time-off request for the authenticated employee
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  rateLimit: requestRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase,
    session,
    body,
  }: RouteContext): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!body) {
      throw new ValidationError('Request body is required');
    }

    // Get employee ID for the authenticated user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (employeeError || !employee) {
      throw new NotFoundError('Employee record not found');
    }

    // Validate request body
    let validatedData;
    try {
      validatedData = timeOffRequestInputSchema.parse(body);
    } catch (err) {
      throw new ValidationError('Invalid request data', err);
    }

    // Prepare new request data
    const now = new Date().toISOString();
    const newRequest: TimeOffRequestInsert = {
      ...validatedData,
      employee_id: employee.id,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    // Create time-off request
    const { data: request, error } = await supabase
      .from('time_off_requests')
      .insert(newRequest)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create request', error);
    }

    // Validate created request
    const validatedRequest = timeOffRequestSchema.parse(request);

    return {
      data: validatedRequest,
      error: null,
      status: HTTP_STATUS_CREATED,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 