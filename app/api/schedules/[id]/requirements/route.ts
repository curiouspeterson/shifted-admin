/**
 * Schedule Requirements API Routes
 * Last Updated: 2024-03
 * 
 * This file implements the endpoints for managing schedule time requirements:
 * - GET: List time requirements with filtering and pagination
 * - POST: Create new time requirements
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - Schedule existence validation
 * - Time requirement validation
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: Schedule not found
 * - 409: Conflicting requirements
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { TimeRequirementsOperations } from '@/lib/api/database/time-requirements';
import { SchedulesOperations } from '@/lib/api/database/schedules';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_CONFLICT,
} from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  listTimeRequirementsQuerySchema,
  createTimeRequirementSchema,
  timeRequirementSortSchema,
  updateTimeRequirementSchema,
} from '@/lib/schemas/api';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';
import { timeBasedRequirementSchema } from '@/lib/schemas/schedule';

type TimeRequirementRow = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementSortColumn = NonNullable<z.infer<typeof timeRequirementSortSchema>['sort']>;
type ListTimeRequirementsQuery = z.infer<typeof listTimeRequirementsQuerySchema>;
type CreateTimeRequirement = z.infer<typeof createTimeRequirementSchema>;
type UpdateTimeRequirement = z.infer<typeof updateTimeRequirementSchema>;

// Custom rate limits for requirement operations
const requirementRateLimits = {
  // List requirements (150 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 150,
    identifier: 'requirements:list',
  },
  
  // Create requirement (40 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'requirements:create',
  },
} as const;

// Cache configuration for requirements
const requirementCacheConfig = {
  // List operation (1 minute cache)
  list: {
    ...cacheConfigs.short,
    ttl: 60, // 1 minute
    prefix: 'api:requirements:list',
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

/**
 * GET /api/schedules/[id]/requirements
 * List time requirements for a specific schedule
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  querySchema: listTimeRequirementsQuerySchema,
  rateLimit: requirementRateLimits.list,
  middleware: middlewareConfig,
  cache: requirementCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase, 
    params, 
    query, 
    cache 
  }: RouteContext<ListTimeRequirementsQuery>): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Schedule ID is required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const requirements = new TimeRequirementsOperations(supabase);

    // Check if schedule exists
    const schedule = await schedules.findById(params.id);
    if (!schedule.data) {
      throw new NotFoundError('Schedule not found');
    }

    // Build query options using sanitized query parameters
    const options = {
      limit: query?.limit,
      offset: query?.offset,
      orderBy: query?.sort
        ? { column: query.sort as TimeRequirementSortColumn, ascending: query.order !== 'desc' }
        : undefined,
      filter: {
        schedule_id: params.id,
        ...(query?.day_of_week && { day_of_week: query.day_of_week }),
        ...(query?.requires_supervisor !== undefined && { requires_supervisor: query.requires_supervisor }),
      },
    };

    // Fetch requirements
    const result = await requirements.findMany(options);

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

/**
 * POST /api/schedules/[id]/requirements
 * Create a new time requirement for a schedule
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: createTimeRequirementSchema,
  rateLimit: requirementRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    params, 
    body 
  }: RouteContext<unknown, CreateTimeRequirement>): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Schedule ID is required');
    }

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const requirements = new TimeRequirementsOperations(supabase);

    // Check if schedule exists
    const schedule = await schedules.findById(params.id);
    if (!schedule.data) {
      throw new NotFoundError('Schedule not found');
    }

    // Only creator, supervisors, and admins can add requirements
    if (schedule.data.created_by !== session.user.id && 
        !session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only schedule creator, supervisors, and admins can add requirements');
    }

    // Since body is validated by bodySchema, we know it exists and has all required fields
    const validatedBody = body as Required<CreateTimeRequirement>;

    // Check for existing requirements in the same time slot
    const existing = await requirements.findMany({
      filter: {
        schedule_id: params.id,
        day_of_week: validatedBody.day_of_week,
      },
    });

    if (existing.data?.some((requirement: TimeRequirementRow) => {
      const newStart = new Date(`1970-01-01T${validatedBody.start_time}`);
      const newEnd = new Date(`1970-01-01T${validatedBody.end_time}`);
      const requirementStart = new Date(`1970-01-01T${requirement.start_time}`);
      const requirementEnd = new Date(`1970-01-01T${requirement.end_time}`);
      return (
        (newStart >= requirementStart && newStart < requirementEnd) ||
        (newEnd > requirementStart && newEnd <= requirementEnd) ||
        (newStart <= requirementStart && newEnd >= requirementEnd)
      );
    })) {
      throw new ValidationError('Time requirement already exists for this time slot', {
        code: 'REQUIREMENT_CONFLICT',
        status: HTTP_STATUS_CONFLICT,
      });
    }

    // Create requirement record with all required fields
    const result = await requirements.create({
      schedule_id: params.id,
      start_time: validatedBody.start_time,
      end_time: validatedBody.end_time,
      day_of_week: validatedBody.day_of_week,
      min_staff: validatedBody.min_staff,
      requires_supervisor: validatedBody.requires_supervisor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to create time requirement', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from requirement creation');
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

/**
 * PATCH /api/schedules/[id]/requirements/[requirementId]
 * Update an existing time requirement
 */
export const PATCH = createRouteHandler({
  methods: ['PATCH'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: updateTimeRequirementSchema,
  rateLimit: requirementRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    params, 
    body 
  }: RouteContext<unknown, UpdateTimeRequirement>): Promise<ApiResponse> => {
    if (!params?.id || !params?.requirementId) {
      throw new ValidationError('Schedule ID and requirement ID are required');
    }

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!body) {
      throw new ValidationError('Request body is required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const requirements = new TimeRequirementsOperations(supabase);

    // Check if schedule exists
    const schedule = await schedules.findById(params.id);
    if (!schedule.data) {
      throw new NotFoundError('Schedule not found');
    }

    // Only creator, supervisors, and admins can update requirements
    if (schedule.data.created_by !== session.user.id && 
        !session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only schedule creator, supervisors, and admins can update requirements');
    }

    // Check if requirement exists
    const existing = await requirements.findById(params.requirementId);
    if (!existing.data) {
      throw new NotFoundError('Time requirement not found');
    }

    // If updating time-related fields, check for conflicts
    if (body.start_time || body.end_time || body.day_of_week !== undefined) {
      const start_time = body.start_time || existing.data.start_time;
      const end_time = body.end_time || existing.data.end_time;
      const day_of_week = body.day_of_week ?? existing.data.day_of_week;

      const conflicts = await requirements.findMany({
        filter: {
          schedule_id: params.id,
          day_of_week,
        },
      });

      if (conflicts.data?.some((requirement: TimeRequirementRow) => {
        if (requirement.id === params.requirementId) return false;
        const newStart = new Date(`1970-01-01T${start_time}`);
        const newEnd = new Date(`1970-01-01T${end_time}`);
        const requirementStart = new Date(`1970-01-01T${requirement.start_time}`);
        const requirementEnd = new Date(`1970-01-01T${requirement.end_time}`);
        return (
          (newStart >= requirementStart && newStart < requirementEnd) ||
          (newEnd > requirementStart && newEnd <= requirementEnd) ||
          (newStart <= requirementStart && newEnd >= requirementEnd)
        );
      })) {
        throw new ValidationError('Time requirement already exists for this time slot', {
          code: 'REQUIREMENT_CONFLICT',
          status: HTTP_STATUS_CONFLICT,
        });
      }
    }

    // Update requirement with transformed data
    const updateData = {
      ...body,
      requires_supervisor: body.requires_supervisor ?? existing.data.requires_supervisor,
      updated_at: new Date().toISOString(),
    };

    const result = await requirements.update(params.requirementId, updateData);

    if (result.error) {
      throw new DatabaseError('Failed to update time requirement', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from requirement update');
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