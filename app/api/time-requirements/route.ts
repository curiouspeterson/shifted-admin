/**
 * Time-Based Requirements API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the API endpoints for managing staffing requirements
 * based on time periods. Currently supports:
 * - GET: Retrieve all active time-based staffing requirements
 * - POST: Create a new time-based requirement
 * - PATCH: Update an existing time-based requirement
 * 
 * Time-based requirements define the minimum staffing levels and supervisor
 * requirements for specific time periods, independent of shift definitions.
 * These are used to validate schedule coverage and ensure proper staffing
 * levels throughout the day.
 * 
 * Error Handling:
 * - 400: Invalid request data or time range
 * - 401: Authentication required
 * - 403: Insufficient permissions (supervisor role required for mutations)
 * - 404: Time requirement not found
 * - 429: Rate limit exceeded
 * - 500: Database or server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import type { RouteContext, ApiResponse } from '@/lib/api/types';
import { TimeRequirementsOperations } from '@/lib/api/database/timeRequirements';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
} from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import type { ListTimeRequirementsQuery } from '@/lib/schemas/api';
import {
  listTimeRequirementsQuerySchema,
  createTimeRequirementSchema,
  updateTimeRequirementSchema,
  timeRequirementSortSchema,
} from '@/lib/schemas/api';
import type { Database } from '@/lib/supabase/database.types';
import {
  DatabaseError,
  TimeRangeError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from '@/lib/errors';

type TimeRequirementRow = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementSortColumn = NonNullable<z.infer<typeof timeRequirementSortSchema>['sort']>;

// Custom rate limits for time requirements
const timeRequirementsRateLimits = {
  // List time requirements (100 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 100,
    identifier: 'time-requirements:list',
  },
  
  // Create time requirement (30 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 30,
    identifier: 'time-requirements:create',
  },

  // Update time requirement (40 requests per minute)
  update: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'time-requirements:update',
  },
} as const;

// Cache configuration for time requirements
const timeRequirementsCacheConfig = {
  // List operation (5 minutes cache)
  list: {
    ...cacheConfigs.medium,
    prefix: 'api:time-requirements:list',
    includeQuery: true,
    excludeParams: ['offset'] as string[],
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

// GET /api/time-requirements
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  querySchema: listTimeRequirementsQuerySchema,
  rateLimit: timeRequirementsRateLimits.list,
  middleware: middlewareConfig,
  cache: timeRequirementsCacheConfig.list,
  cors: true,
  handler: async ({ supabase, query, sanitizedQuery, cache }: RouteContext<ListTimeRequirementsQuery>): Promise<ApiResponse> => {
    // Initialize database operations
    const timeRequirements = new TimeRequirementsOperations(supabase);

    // Build query options using sanitized query parameters
    const options = {
      limit: query?.limit,
      offset: query?.offset,
      orderBy: query?.sort
        ? { column: query.sort as TimeRequirementSortColumn, ascending: query.order !== 'desc' }
        : undefined,
      filter: {
        ...(query?.schedule_id && { schedule_id: query.schedule_id }),
        ...(query?.day_of_week !== undefined && { day_of_week: query.day_of_week }),
        ...(query?.requires_supervisor !== undefined && { requires_supervisor: query.requires_supervisor }),
      },
    };

    // Fetch time requirements
    const result = await timeRequirements.findMany(options);

    if (result.error) {
      throw new DatabaseError('Failed to fetch time requirements', result.error);
    }

    const requirements_data = result.data || [];

    return {
      data: requirements_data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: requirements_data.length,
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

// POST /api/time-requirements
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: createTimeRequirementSchema,
  rateLimit: timeRequirementsRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, session, body }): Promise<ApiResponse> => {
    // Validate time range
    const startTime = new Date(`1970-01-01T${body!.start_time}`);
    const endTime = new Date(`1970-01-01T${body!.end_time}`);
    
    if (endTime <= startTime) {
      throw new TimeRangeError('End time must be after start time');
    }

    // Initialize database operations
    const timeRequirements = new TimeRequirementsOperations(supabase);

    // Create time requirement with current timestamp
    const result = await timeRequirements.create({
      ...body!,
      requires_supervisor: body!.requires_supervisor ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to create time requirement', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from database');
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

// PATCH /api/time-requirements/[id]
export const PATCH = createRouteHandler({
  methods: ['PATCH'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: updateTimeRequirementSchema,
  rateLimit: timeRequirementsRateLimits.update,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, session, params, body }): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Time requirement ID is required');
    }

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!body) {
      throw new ValidationError('Request body is required');
    }

    // Initialize database operations
    const timeRequirements = new TimeRequirementsOperations(supabase);

    // Check if time requirement exists
    const existing = await timeRequirements.findById(params.id);
    if (!existing.data) {
      throw new NotFoundError('Time requirement not found');
    }

    // Validate time range if both times are provided
    if (body.start_time && body.end_time) {
      const startTime = new Date(`1970-01-01T${body.start_time}`);
      const endTime = new Date(`1970-01-01T${body.end_time}`);
      
      if (endTime <= startTime) {
        throw new TimeRangeError('End time must be after start time');
      }
    }

    // Update time requirement with transformed data
    const updateData = {
      ...body,
      requires_supervisor: body.requires_supervisor ?? existing.data.requires_supervisor,
      updated_at: new Date().toISOString(),
    };

    const result = await timeRequirements.update(params.id, updateData);

    if (result.error) {
      throw new DatabaseError('Failed to update time requirement', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from database');
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 