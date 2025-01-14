/**
 * Schedules API Route
 * Last Updated: 2024
 * 
 * This module provides API endpoints for managing schedules.
 * It includes:
 * - GET /api/schedules - List all schedules with optional filtering and pagination
 * - POST /api/schedules - Create a new schedule
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createRouteHandler } from '../../lib/api/handler';
import { SchedulesOperations } from '../../lib/api/database/schedules';
import type { RouteContext } from '../../lib/api/types';

// Query schema for GET requests
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.enum(['start_date', 'end_date', 'status', 'created_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  include: z.object({
    assignments: z.boolean().optional(),
    requirements: z.boolean().optional(),
  }).optional(),
});

// Schema for creating a new schedule
const createScheduleSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  is_published: z.boolean().default(false),
});

// GET /api/schedules
export const GET = createRouteHandler(
  async (req: NextRequest, { supabase }: RouteContext) => {
    const schedules = new SchedulesOperations(supabase);
    const query = Object.fromEntries(req.nextUrl.searchParams);
    const { sort, order, limit, offset, status, include } = querySchema.parse(query);

    const { data, error } = await schedules.findMany({
      orderBy: sort ? {
        column: sort,
        ascending: order !== 'desc',
      } : undefined,
      limit,
      offset,
      filter: status ? { status } : undefined,
      include,
    });

    if (error) {
      return {
        error: 'Failed to fetch schedules',
        data: null,
        metadata: { originalError: error },
      };
    }

    return {
      data: data || [],
      error: null,
      metadata: {
        count: data?.length || 0,
      },
    };
  },
  {
    requireAuth: true,
    requireSupervisor: true,
    validateQuery: querySchema,
  }
);

// POST /api/schedules
export const POST = createRouteHandler(
  async (req: NextRequest, { supabase, session }: RouteContext) => {
    if (!session) {
      return {
        error: 'Unauthorized - session required',
        data: null,
        metadata: {},
      };
    }

    const schedules = new SchedulesOperations(supabase);
    const body = await req.json();
    const validatedData = createScheduleSchema.parse(body);

    const { data, error } = await schedules.create({
      ...validatedData,
      created_by: session.user.id,
    });

    if (error) {
      return {
        error: 'Failed to create schedule',
        data: null,
        metadata: { originalError: error },
      };
    }

    if (!data) {
      return {
        error: 'Failed to create schedule - no data returned',
        data: null,
        metadata: {},
      };
    }

    return {
      data,
      error: null,
      metadata: {
        message: 'Schedule created successfully',
      },
    };
  },
  {
    requireAuth: true,
    requireSupervisor: true,
    validateBody: createScheduleSchema,
  }
); 