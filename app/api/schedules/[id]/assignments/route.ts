/**
 * Schedule Assignments API Routes
 * Last Updated: 2024-03
 * 
 * This file implements the endpoints for managing schedule assignments:
 * - GET: List assignments for a schedule with filtering and pagination
 * - POST: Create new assignments for a schedule
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - Schedule existence validation
 * - Employee availability checking
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: Schedule or employee not found
 * - 409: Conflicting assignments
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { AssignmentsOperations } from '@/lib/api/database/assignments';
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
  listAssignmentsQuerySchema,
  createAssignmentSchema,
  assignmentSortSchema,
} from '@/lib/schemas/api';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';

type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
type AssignmentSortColumn = NonNullable<z.infer<typeof assignmentSortSchema>['sort']>;
type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
type CreateAssignment = z.infer<typeof createAssignmentSchema>;

// Custom rate limits for assignment operations
const assignmentRateLimits = {
  // List assignments (150 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 150,
    identifier: 'assignments:list',
  },
  
  // Create assignment (40 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'assignments:create',
  },
} as const;

// Cache configuration for assignments
const assignmentCacheConfig = {
  // List operation (1 minute cache)
  list: {
    ...cacheConfigs.short,
    ttl: 60, // 1 minute
    prefix: 'api:assignments:list',
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
 * GET /api/schedules/[id]/assignments
 * List assignments for a specific schedule
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  querySchema: listAssignmentsQuerySchema,
  rateLimit: assignmentRateLimits.list,
  middleware: middlewareConfig,
  cache: assignmentCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase, 
    params, 
    query, 
    cache 
  }: RouteContext<ListAssignmentsQuery>): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Schedule ID is required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const assignments = new AssignmentsOperations(supabase);

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
        ? { column: query.sort as AssignmentSortColumn, ascending: query.order !== 'desc' }
        : undefined,
      filter: {
        schedule_id: params.id,
        ...(query?.employee_id && { employee_id: query.employee_id }),
        ...(query?.status && { status: query.status }),
      },
    };

    // Fetch assignments
    const result = await assignments.findMany(options);

    if (result.error) {
      throw new DatabaseError('Failed to fetch assignments', result.error);
    }

    const assignments_data = result.data || [];

    return {
      data: assignments_data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: assignments_data.length,
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
 * POST /api/schedules/[id]/assignments
 * Create a new assignment for a schedule
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: createAssignmentSchema,
  rateLimit: assignmentRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    params, 
    body 
  }: RouteContext<unknown, CreateAssignment>): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Schedule ID is required');
    }

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const assignments = new AssignmentsOperations(supabase);

    // Check if schedule exists
    const schedule = await schedules.findById(params.id);
    if (!schedule.data) {
      throw new NotFoundError('Schedule not found');
    }

    // Only creator, supervisors, and admins can add assignments
    if (schedule.data.created_by !== session.user.id && 
        !session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only schedule creator, supervisors, and admins can add assignments');
    }

    // Check for existing assignments in the same time slot
    const existing = await assignments.findMany({
      filter: {
        schedule_id: params.id,
        employee_id: body!.employee_id,
      },
    });

    if (existing.data?.some((assignment: AssignmentRow) => {
      const newStart = new Date(body!.start_time);
      const newEnd = new Date(body!.end_time);
      const assignmentStart = new Date(assignment.start_time);
      const assignmentEnd = new Date(assignment.end_time);
      return (
        (newStart >= assignmentStart && newStart < assignmentEnd) ||
        (newEnd > assignmentStart && newEnd <= assignmentEnd) ||
        (newStart <= assignmentStart && newEnd >= assignmentEnd)
      );
    })) {
      throw new ValidationError('Employee already has an assignment during this time', {
        code: 'ASSIGNMENT_CONFLICT',
        status: HTTP_STATUS_CONFLICT,
      });
    }

    // Create assignment record
    const result = await assignments.create({
      ...body!,
      schedule_id: params.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to create assignment', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from assignment creation');
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