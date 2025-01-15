/**
 * Shifts API Route
 * Last Updated: 2024-03
 * 
 * This file implements the endpoints for managing shift definitions:
 * - GET: List all shifts with filtering and pagination
 * - POST: Create new shift definitions
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - Shift validation and conflict detection
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: Shift not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import { ShiftsOperations } from '@/lib/api/database/shifts';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { 
  HTTP_STATUS_OK, 
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
} from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  listShiftsQuerySchema,
  createShiftSchema,
  shiftSortSchema,
} from '@/lib/schemas/api';
import type { Database } from '@/lib/supabase/database.types';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors';

// Direct type reference to avoid potential circular dependencies
type ShiftRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  crosses_midnight: boolean;
  requires_supervisor: boolean;
  created_by: string;
};

type ShiftSortColumn = NonNullable<z.infer<typeof shiftSortSchema>['sort']>;
type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
type CreateShift = z.infer<typeof createShiftSchema>;

// Custom rate limits for shifts
const shiftsRateLimits = {
  // List shifts (150 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 150,
    identifier: 'shifts:list',
  },
  
  // Create shift (40 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'shifts:create',
  },
} as const;

// Cache configurations for shifts
const shiftsCacheConfig = {
  // List shifts (5 minutes cache)
  list: {
    ...cacheConfigs.medium,
    prefix: 'shifts:list',
  },
} as const;

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

// GET /api/shifts
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  querySchema: listShiftsQuerySchema,
  rateLimit: shiftsRateLimits.list,
  middleware: middlewareConfig,
  cache: shiftsCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase, 
    query, 
    cache 
  }: RouteContext<ListShiftsQuery>): Promise<ApiResponse> => {
    // Initialize database operations
    const shifts = new ShiftsOperations(supabase);

    // Build query options using sanitized query parameters
    const options = {
      limit: query?.limit,
      offset: query?.offset,
      orderBy: query?.sort
        ? { column: query.sort as ShiftSortColumn, ascending: query?.order !== 'desc' }
        : undefined,
      filter: {
        ...(query?.requires_supervisor !== undefined && { requires_supervisor: query.requires_supervisor }),
        ...(query?.crosses_midnight !== undefined && { crosses_midnight: query.crosses_midnight }),
      },
    };

    // Fetch shifts
    const result = await shifts.findMany(options);

    if (result.error) {
      throw new DatabaseError('Failed to fetch shifts', result.error);
    }

    const shifts_data = result.data || [];

    return {
      data: shifts_data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: shifts_data.length,
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

// POST /api/shifts
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: createShiftSchema,
  rateLimit: shiftsRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    body 
  }: RouteContext<unknown, CreateShift>): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!body) {
      throw new ValidationError('Request body is required');
    }

    // Initialize database operations
    const shifts = new ShiftsOperations(supabase);

    // Create shift with current user as creator
    const shiftData = {
      ...body,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create shift
    const result = await shifts.create(shiftData);

    if (result.error) {
      throw new DatabaseError('Failed to create shift', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from shift creation');
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_CREATED,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 