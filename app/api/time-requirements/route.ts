/**
 * Time-Based Requirements API Route Handler
 * Last Updated: 2025-03-19
 *
 * This file implements the API endpoints for managing staffing requirements
 * based on time periods. Currently supports:
 * - GET: Retrieve all active time-based staffing requirements
 * - POST: Create a new time-based requirement
 * - PATCH: Update an existing time-based requirement
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandler, type ApiResponse } from '@/lib/api';
import type { QueryOptions } from '@/lib/api/types';
import { TimeRequirementsOperations } from '@/lib/api/database/time-requirements';
import { HTTP_STATUS_CREATED } from '@/lib/constants/http';
import {
  listTimeRequirementsQuerySchema,
  createTimeRequirementSchema,
  updateTimeRequirementSchema,
} from '@/lib/schemas/api';
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';
import type { Database } from '@/lib/supabase/database.types';
import { RateLimiter } from '@/lib/rate-limiting';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

type TimeRequirement = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementInsert = Database['public']['Tables']['time_requirements']['Insert'];
type TimeRequirementUpdate = Database['public']['Tables']['time_requirements']['Update'];
type TimeRequirementResponse = {
  data: TimeRequirement[];
  error: null;
};

// Rate limiters for time requirements
const listRateLimiter = new RateLimiter({
  points: 100,
  duration: 60,
  blockDuration: 0,
  keyPrefix: 'time-requirements:list'
});

const createRateLimiter = new RateLimiter({
  points: 30,
  duration: 60,
  blockDuration: 0,
  keyPrefix: 'time-requirements:create'
});

const updateRateLimiter = new RateLimiter({
  points: 40,
  duration: 60,
  blockDuration: 0,
  keyPrefix: 'time-requirements:update'
});

// Map day of week strings to numbers
const dayOfWeekMap = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
} as const;

// GET /api/time-requirements
export const GET = createRouteHandler<TimeRequirementResponse>({
  handler: async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);
    
    const parsedQuery = listTimeRequirementsQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      throw new ValidationError(
        'Invalid query parameters',
        parsedQuery.error.errors.map(err => ({
          code: 'INVALID_QUERY',
          message: err.message,
          path: err.path.map(String)
        }))
      );
    }

    const supabase = createClient(cookies());
    const timeRequirements = new TimeRequirementsOperations(supabase);
    
    const options: QueryOptions = {
      limit: parsedQuery.data.limit,
      offset: parsedQuery.data.offset,
      orderBy: parsedQuery.data.sort ? {
        column: parsedQuery.data.sort,
        ascending: parsedQuery.data.order !== 'desc'
      } : undefined,
      filter: {
        schedule_id: parsedQuery.data.schedule_id,
        day_of_week: parsedQuery.data.day_of_week ? dayOfWeekMap[parsedQuery.data.day_of_week] : undefined,
        requires_supervisor: parsedQuery.data.requires_supervisor
      }
    };

    const result = await timeRequirements.findMany(options);
    
    if (result.error instanceof Error) {
      throw new DatabaseError('Failed to fetch time requirements', {
        code: 'QUERY_ERROR',
        table: 'time_requirements',
        cause: result.error
      });
    }

    return NextResponse.json<ApiResponse<TimeRequirementResponse>>({
      data: {
        data: result.data || [],
        error: null
      }
    });
  },
  rateLimit: listRateLimiter,
  validate: {
    query: listTimeRequirementsQuerySchema
  }
});

// POST /api/time-requirements
export const POST = createRouteHandler<TimeRequirementResponse>({
  handler: async (req: NextRequest) => {
    const body = await req.json();
    const parsedBody = createTimeRequirementSchema.safeParse(body);
    
    if (!parsedBody.success) {
      throw new ValidationError(
        'Invalid request body',
        parsedBody.error.errors.map(err => ({
          code: 'INVALID_BODY',
          message: err.message,
          path: err.path.map(String)
        }))
      );
    }

    const { startTime, endTime } = parsedBody.data;
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end <= start) {
      throw new ValidationError(
        'End time must be after start time',
        [{
          code: 'INVALID_TIME_RANGE',
          message: 'End time must be after start time',
          path: ['startTime', 'endTime']
        }]
      );
    }

    const supabase = createClient(cookies());
    const timeRequirements = new TimeRequirementsOperations(supabase);

    const result = await timeRequirements.create({
      schedule_id: parsedBody.data.scheduleId,
      day_of_week: dayOfWeekMap[parsedBody.data.dayOfWeek],
      start_time: parsedBody.data.startTime,
      end_time: parsedBody.data.endTime,
      min_staff: parsedBody.data.minStaff,
      requires_supervisor: parsedBody.data.requiresSupervisor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (result.error instanceof Error) {
      throw new DatabaseError('Failed to create time requirement', {
        code: 'INSERT_ERROR',
        table: 'time_requirements',
        cause: result.error
      });
    }

    return NextResponse.json<ApiResponse<TimeRequirementResponse>>(
      {
        data: {
          data: [result.data],
          error: null
        }
      },
      { status: HTTP_STATUS_CREATED }
    );
  },
  rateLimit: createRateLimiter,
  validate: {
    body: createTimeRequirementSchema
  }
});

// PATCH /api/time-requirements/[id]
export const PATCH = createRouteHandler<TimeRequirementResponse>({
  handler: async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id?.trim()) {
      throw new ValidationError(
        'Time requirement ID is required',
        [{
          code: 'MISSING_PARAMETER',
          message: 'Time requirement ID is required',
          path: ['id']
        }]
      );
    }

    const body = await req.json();
    const parsedBody = updateTimeRequirementSchema.safeParse(body);
    
    if (!parsedBody.success) {
      throw new ValidationError(
        'Invalid request body',
        parsedBody.error.errors.map(err => ({
          code: 'INVALID_BODY',
          message: err.message,
          path: err.path.map(String)
        }))
      );
    }

    const supabase = createClient(cookies());
    const timeRequirements = new TimeRequirementsOperations(supabase);
    
    const existing = await timeRequirements.findById(id);
    if (!existing.data) {
      throw new NotFoundError('Time requirement', id);
    }

    if (parsedBody.data.startTime && parsedBody.data.endTime) {
      const start = new Date(`1970-01-01T${parsedBody.data.startTime}`);
      const end = new Date(`1970-01-01T${parsedBody.data.endTime}`);
      
      if (end <= start) {
        throw new ValidationError(
          'End time must be after start time',
          [{
            code: 'INVALID_TIME_RANGE',
            message: 'End time must be after start time',
            path: ['startTime', 'endTime']
          }]
        );
      }
    }

    const updateData: TimeRequirementUpdate = {
      schedule_id: parsedBody.data.scheduleId,
      day_of_week: parsedBody.data.dayOfWeek ? dayOfWeekMap[parsedBody.data.dayOfWeek] : undefined,
      start_time: parsedBody.data.startTime,
      end_time: parsedBody.data.endTime,
      min_staff: parsedBody.data.minStaff,
      requires_supervisor: parsedBody.data.requiresSupervisor,
      updated_at: new Date().toISOString()
    };

    const result = await timeRequirements.update(id, updateData);

    if (result.error instanceof Error) {
      throw new DatabaseError('Failed to update time requirement', {
        code: 'UPDATE_ERROR',
        table: 'time_requirements',
        cause: result.error
      });
    }

    return NextResponse.json<ApiResponse<TimeRequirementResponse>>({
      data: {
        data: [result.data],
        error: null
      }
    });
  },
  rateLimit: updateRateLimiter,
  validate: {
    body: updateTimeRequirementSchema
  }
});