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
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import type { ApiResponse } from '@/lib/api/types';
import { TimeRequirementsOperations } from '@/lib/api/database/time-requirements';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_METHOD_NOT_ALLOWED,
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
import { env } from '@/lib/env';
import { createClient } from '@supabase/supabase-js';

type TimeRequirementRow = Database['public']['Tables']['time_requirements']['Row'];
type TimeRequirementSortColumn = NonNullable<z.infer<typeof timeRequirementSortSchema>['sort']>;

// Custom rate limits for time requirements
const timeRequirementsRateLimits = {
  list: {
    ...defaultRateLimits.api,
    limit: 100,
    identifier: 'time-requirements:list',
  },
  create: {
    ...defaultRateLimits.api,
    limit: 30,
    identifier: 'time-requirements:create', 
  },
  update: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'time-requirements:update',
  },
} as const;

// Cache configuration for time requirements
const timeRequirementsCacheConfig = {
  list: {
    ...cacheConfigs.api,
    prefix: 'api:time-requirements:list',
    includeQuery: true,
    excludeParams: ['offset'] as const,
  },
};

// Base metadata for responses
const getBaseMetadata = (cache?: { hit: boolean; ttl: number } | null) => ({
  requestId: crypto.randomUUID(),
  processingTime: 0,
  version: '1.0',
  timestamp: new Date().toISOString(),
  cache: cache ?? null,
  rateLimit: {
    limit: 100,
    remaining: 99,
    reset: Math.floor(Date.now() / 1000) + 60
  }
});

// Initialize Supabase client
const supabase = createClient<Database>(
  env.DATABASE_URL,
  env.DATABASE_AUTH_TOKEN
);

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
export const GET = createRouteHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams);
  
  const parsedQuery = listTimeRequirementsQuerySchema.safeParse(query);
  if (!parsedQuery.success) {
    throw new ValidationError('Invalid query parameters', {
      validation: parsedQuery.error.errors
    });
  }

  const timeRequirements = new TimeRequirementsOperations(supabase);
  
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
    error: null,
    metadata: getBaseMetadata(null)
  });
}, {
  rateLimit: timeRequirementsRateLimits.list,
  cache: timeRequirementsCacheConfig.list
});

// POST /api/time-requirements
export const POST = createRouteHandler(async (req: NextRequest) => {
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

  if (result.error) {
    throw new DatabaseError('Failed to create time requirement', {
      cause: result.error
    });
  }

  return NextResponse.json({
    data: result.data,
    error: null,
    metadata: getBaseMetadata(null)
  }, { status: HTTP_STATUS_CREATED });
}, {
  rateLimit: timeRequirementsRateLimits.create
});

// PATCH /api/time-requirements/[id]
export const PATCH = createRouteHandler(async (req: NextRequest, context?: { params?: Record<string, string> }) => {
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

  const timeRequirements = new TimeRequirementsOperations(supabase);
  
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
    error: null,
    metadata: getBaseMetadata(null)
  });
}, {
  rateLimit: timeRequirementsRateLimits.update
});