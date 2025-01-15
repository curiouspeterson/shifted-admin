/**
 * Employee Availability API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the API endpoints for managing employee availability:
 * - GET: List all availability entries for the authenticated employee
 * - POST: Create or update availability for a specific day
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
type Availability = Database['public']['Tables']['employee_availability']['Row'];
type AvailabilityInsert = Database['public']['Tables']['employee_availability']['Insert'];

// Availability validation schemas
const availabilitySchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  is_available: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const availabilityInputSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  is_available: z.boolean(),
});

// Custom rate limits for availability operations
const availabilityRateLimits = {
  // List availability (100 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 100,
    identifier: 'availability:list',
  },
  // Update availability (50 requests per minute)
  update: {
    ...defaultRateLimits.api,
    limit: 50,
    identifier: 'availability:update',
  },
} as const;

// Cache configuration for availability
const availabilityCacheConfig = {
  // List operation (30 seconds cache)
  list: {
    ...cacheConfigs.short,
    ttl: 30,
    prefix: 'api:availability:list',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/availability
 * List all availability entries for the authenticated employee
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  rateLimit: availabilityRateLimits.list,
  middleware: middlewareConfig,
  cache: availabilityCacheConfig.list,
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

    // Fetch availability entries for the employee
    const { data: availability, error } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week');

    if (error) {
      throw new DatabaseError('Failed to fetch availability', error);
    }

    // Validate availability data
    const validatedAvailability = availability?.map(entry => {
      try {
        return availabilitySchema.parse(entry);
      } catch (err) {
        throw new ValidationError('Invalid availability data format', err);
      }
    }) || [];

    return {
      data: validatedAvailability,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: validatedAvailability.length,
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
 * POST /api/availability
 * Create or update availability for a specific day
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  rateLimit: availabilityRateLimits.update,
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
      validatedData = availabilityInputSchema.parse(body);
    } catch (err) {
      throw new ValidationError('Invalid availability data', err);
    }

    // Prepare availability data
    const now = new Date().toISOString();
    const newAvailability: AvailabilityInsert = {
      ...validatedData,
      employee_id: employee.id,
      created_at: now,
      updated_at: now,
    };

    // Create or update availability
    const { data: availability, error } = await supabase
      .from('employee_availability')
      .upsert(newAvailability)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update availability', error);
    }

    // Validate created/updated availability
    const validatedAvailability = availabilitySchema.parse(availability);

    return {
      data: validatedAvailability,
      error: null,
      status: HTTP_STATUS_CREATED,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 