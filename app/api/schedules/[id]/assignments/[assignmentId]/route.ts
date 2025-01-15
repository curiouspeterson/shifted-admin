/**
 * Schedule Assignment Detail API Routes
 * Last Updated: 2024-03
 * 
 * This file implements the endpoints for managing individual schedule assignments:
 * - GET: Retrieve assignment details
 * - PATCH: Update assignment information
 * - DELETE: Remove assignment
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for GET requests
 * - Schedule and assignment existence validation
 * - Employee assignment status management
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: Schedule or assignment not found
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
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_CONFLICT,
} from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  updateAssignmentSchema,
} from '@/lib/schemas/api';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';

type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

// Custom rate limits for assignment detail operations
const assignmentRateLimits = {
  // Get assignment details (150 requests per minute)
  get: {
    ...defaultRateLimits.api,
    limit: 150,
    identifier: 'assignments:get',
  },
  
  // Update assignment (40 requests per minute)
  update: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'assignments:update',
  },

  // Delete assignment (20 requests per minute)
  delete: {
    ...defaultRateLimits.api,
    limit: 20,
    identifier: 'assignments:delete',
  },
} as const;

// Cache configuration for assignment details
const assignmentCacheConfig = {
  // Get operation (1 minute cache)
  get: {
    ...cacheConfigs.short,
    ttl: 60, // 1 minute
    prefix: 'api:assignments:detail',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/schedules/[id]/assignments/[assignmentId]
 * Retrieve details for a specific assignment
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  rateLimit: assignmentRateLimits.get,
  middleware: middlewareConfig,
  cache: assignmentCacheConfig.get,
  cors: true,
  handler: async ({ 
    supabase, 
    params,
    cache 
  }: RouteContext): Promise<ApiResponse> => {
    if (!params?.id || !params?.assignmentId) {
      throw new ValidationError('Schedule ID and Assignment ID are required');
    }

    // Initialize database operations
    const schedules = new SchedulesOperations(supabase);
    const assignments = new AssignmentsOperations(supabase);

    // Check if schedule exists
    const schedule = await schedules.findById(params.id);
    if (!schedule.data) {
      throw new NotFoundError('Schedule not found');
    }

    // Fetch assignment details
    const result = await assignments.findById(params.assignmentId);

    if (result.error) {
      throw new DatabaseError('Failed to fetch assignment details', result.error);
    }

    if (!result.data) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify assignment belongs to the specified schedule
    if (result.data.schedule_id !== params.id) {
      throw new NotFoundError('Assignment not found in this schedule');
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
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
 * PATCH /api/schedules/[id]/assignments/[assignmentId]
 * Update an assignment's information
 */
export const PATCH = createRouteHandler({
  methods: ['PATCH'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: updateAssignmentSchema,
  rateLimit: assignmentRateLimits.update,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    params, 
    body 
  }: RouteContext<unknown, UpdateAssignment>): Promise<ApiResponse> => {
    if (!params?.id || !params?.assignmentId) {
      throw new ValidationError('Schedule ID and Assignment ID are required');
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

    // Check if assignment exists
    const existing = await assignments.findById(params.assignmentId);
    if (!existing.data) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify assignment belongs to the specified schedule
    if (existing.data.schedule_id !== params.id) {
      throw new NotFoundError('Assignment not found in this schedule');
    }

    // Only creator, supervisors, and admins can modify assignments
    if (schedule.data.created_by !== session.user.id && 
        !session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only schedule creator, supervisors, and admins can modify assignments');
    }

    // If updating time slot, check for conflicts
    if (body?.start_time || body?.end_time) {
      const start_time = body.start_time || existing.data.start_time;
      const end_time = body.end_time || existing.data.end_time;

      const conflicts = await assignments.findMany({
        filter: {
          schedule_id: params.id,
          employee_id: existing.data.employee_id,
        },
      });

      if (conflicts.data?.some((assignment: AssignmentRow) => {
        if (assignment.id === params.assignmentId) return false;
        const newStart = new Date(start_time);
        const newEnd = new Date(end_time);
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
    }

    // Update assignment record
    const result = await assignments.update(params.assignmentId, {
      ...body!,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to update assignment', result.error);
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

/**
 * DELETE /api/schedules/[id]/assignments/[assignmentId]
 * Remove an assignment from a schedule
 */
export const DELETE = createRouteHandler({
  methods: ['DELETE'],
  requireAuth: true,
  requireSupervisor: true,
  rateLimit: assignmentRateLimits.delete,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    params 
  }: RouteContext): Promise<ApiResponse> => {
    if (!params?.id || !params?.assignmentId) {
      throw new ValidationError('Schedule ID and Assignment ID are required');
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

    // Check if assignment exists
    const existing = await assignments.findById(params.assignmentId);
    if (!existing.data) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify assignment belongs to the specified schedule
    if (existing.data.schedule_id !== params.id) {
      throw new NotFoundError('Assignment not found in this schedule');
    }

    // Only creator, supervisors, and admins can delete assignments
    if (schedule.data.created_by !== session.user.id && 
        !session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only schedule creator, supervisors, and admins can delete assignments');
    }

    // Delete assignment
    const result = await assignments.delete(params.assignmentId);

    if (result.error) {
      throw new DatabaseError('Failed to delete assignment', result.error);
    }

    return {
      data: null,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 