/**
 * Time-Based Requirements API Route Handler
 * Last Updated: 2025-01-17
 * 
 * This file implements the API endpoints for managing staffing requirements
 * based on time periods. Currently supports:
 * - GET: Retrieve all active time-based staffing requirements
 * - POST: Create a new time-based requirement
 * - PATCH: Update an existing time-based requirement
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ExtendedNextRequest } from '@/lib/api/types';
import { TimeRequirementsOperations } from '@/lib/api/database/time-requirements';
import { HTTP_STATUS_CREATED } from '@/lib/constants/http';
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
} from '@/lib/errors';
import { CacheControl } from '@/lib/api/cache';

type TimeRequirementRow = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementSortColumn = NonNullable<z.infer<typeof timeRequirementSortSchema>['sort']>;

// Rate limits for time requirements
const rateLimits = {
  list: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    identifier: 'time-requirements:list',
  },
  create: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    identifier: 'time-requirements:create', 
  },
  update: {
    windowMs: 60 * 1000,
    maxRequests: 40,
    identifier: 'time-requirements:update',
  },
} as const;

// Cache configuration for time requirements
const cacheConfig = {
  list: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30,
    prefix: 'api:time-requirements:list',
    includeQuery: true,
    excludeParams: ['offset'] as const,
    control: CacheControl.Public
  },
};

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
export const GET = createRouteHandler(async (req: ExtendedNextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams);
  
  const parsedQuery = listTimeRequirementsQuerySchema.safeParse(query);
  if (!parsedQuery.success) {
    throw new ValidationError('Invalid query parameters', {
      validation: parsedQuery.error.errors
    });
  }

  const timeRequirements = new TimeRequirementsOperations(req.supabase);
  
  const options = {
    limit: parsedQuery.data.limit,
    offset: parsedQuery.data.offset,
    orderBy: parsedQuery.data.sort ? {
      column: parsedQuery.data.sort,
      ascending: parsedQuery.data.order !== 'desc'
    } : undefined,
    filter: {
      schedule_id: parsedQuery.data.schedule_id || undefined,
      day_of_week: parsedQuery.data.day_of_week ? dayOfWeekMap[parsedQuery.data.day_of_week] : undefined,
      requires_supervisor: parsedQuery.data.requires_supervisor || undefined
    }
  };

  const result = await timeRequirements.findMany(options);
  
  if (result.error) {
    throw new DatabaseError('Failed to fetch time requirements', { 
      cause: result.error 
    });
  }

  return NextResponse.json({
    data: result.data || [],
    error: null
  });
}, {
  rateLimit: rateLimits.list,
  cache: cacheConfig.list,
  validate: {
    query: listTimeRequirementsQuerySchema
  }
});

// POST /api/time-requirements
export const POST = createRouteHandler(async (req: ExtendedNextRequest) => {
  const body = await req.json();
  const parsedBody = createTimeRequirementSchema.safeParse(body);
  
  if (!parsedBody.success) {
    throw new ValidationError('Invalid request body', {
      validation: parsedBody.error.errors
    });
  }

  const { startTime, endTime } = parsedBody.data;
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  
  if (end <= start) {
    throw new TimeRangeError('End time must be after start time', {
      validation: [{
        code: 'invalid_time_range',
        message: 'End time must be after start time',
        path: ['startTime', 'endTime']
      }]
    });
  }

  const timeRequirements = new TimeRequirementsOperations(req.supabase);

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

  if (result.error) {
    throw new DatabaseError('Failed to create time requirement', {
      cause: result.error
    });
  }

  return NextResponse.json({
    data: result.data,
    error: null
  }, { status: HTTP_STATUS_CREATED });
}, {
  rateLimit: rateLimits.create,
  validate: {
    body: createTimeRequirementSchema
  }
});

// PATCH /api/time-requirements/[id]
export const PATCH = createRouteHandler(async (req: ExtendedNextRequest, context?: { params?: Record<string, string> }) => {
  if (!context?.params?.id) {
    throw new ValidationError('Time requirement ID is required', {
      validation: [{
        code: 'missing_parameter',
        message: 'Time requirement ID is required',
        path: ['id']
      }]
    });
  }

  const body = await req.json();
  const parsedBody = updateTimeRequirementSchema.safeParse(body);
  
  if (!parsedBody.success) {
    throw new ValidationError('Invalid request body', {
      validation: parsedBody.error.errors
    });
  }

  const timeRequirements = new TimeRequirementsOperations(req.supabase);
  
  const existing = await timeRequirements.findById(context.params.id);
  if (!existing.data) {
    throw new NotFoundError('Time requirement not found');
  }

  if (parsedBody.data.startTime && parsedBody.data.endTime) {
    const start = new Date(`1970-01-01T${parsedBody.data.startTime}`);
    const end = new Date(`1970-01-01T${parsedBody.data.endTime}`);
    
    if (end <= start) {
      throw new TimeRangeError('End time must be after start time', {
        validation: [{
          code: 'invalid_time_range',
          message: 'End time must be after start time',
          path: ['startTime', 'endTime']
        }]
      });
    }
  }

  const result = await timeRequirements.update(context.params.id, {
    schedule_id: parsedBody.data.scheduleId,
    day_of_week: parsedBody.data.dayOfWeek ? dayOfWeekMap[parsedBody.data.dayOfWeek] : undefined,
    start_time: parsedBody.data.startTime,
    end_time: parsedBody.data.endTime,
    min_staff: parsedBody.data.minStaff,
    requires_supervisor: parsedBody.data.requiresSupervisor,
    updated_at: new Date().toISOString()
  });

  if (result.error) {
    throw new DatabaseError('Failed to update time requirement', {
      cause: result.error
    });
  }

  return NextResponse.json({
    data: result.data,
    error: null
  });
}, {
  rateLimit: rateLimits.update,
  validate: {
    body: updateTimeRequirementSchema
  }
});