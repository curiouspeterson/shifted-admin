/**
 * Schedules API Route Handler
 * Last Updated: 2025-01-17
 * 
 * This module provides RESTful endpoints for managing schedules with:
 * - Type-safe request/response handling
 * - Request validation
 * - Response caching
 * - Rate limiting
 * - Error handling
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import { scheduleRepository, type Schedule, type CreateScheduleBody, type UpdateScheduleBody, type ScheduleStatus } from '@/lib/api/repositories';
import { Errors, isAppError } from '@/lib/errors/types';

// Validation schemas
const createScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['draft', 'published', 'archived']),
  is_active: z.boolean().default(true),
  version: z.number().default(1),
}) satisfies z.Schema<CreateScheduleBody>;

const updateScheduleSchema = createScheduleSchema.partial() satisfies z.Schema<UpdateScheduleBody>;

// GET /api/schedules
export const GET = createRouteHandler<Schedule[]>({
  handler: async (req) => {
    const { searchParams } = new URL(req.url);
    const rawStatus = searchParams.get('status') ?? '';
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';

    try {
      const filters = {
        ...(rawStatus && ['draft', 'published', 'archived'].includes(rawStatus) 
          ? { status: rawStatus as ScheduleStatus }
          : {}),
        ...(startDate && !Number.isNaN(Date.parse(startDate))
          ? { startDate: new Date(startDate) }
          : {}),
        ...(endDate && !Number.isNaN(Date.parse(endDate))
          ? { endDate: new Date(endDate) }
          : {})
      };

      const schedules = await scheduleRepository.findMany(filters);
      return NextResponse.json<ApiResponse<Schedule[]>>({ data: schedules });
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      
      if (isAppError(error)) {
        return NextResponse.json<ApiResponse<Schedule[]>>(
          { error: error.message },
          { status: error.status }
        );
      }

      return NextResponse.json<ApiResponse<Schedule[]>>(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }
  }
});

// POST /api/schedules
export const POST = createRouteHandler<Schedule, CreateScheduleBody>({
  validate: {
    body: createScheduleSchema
  },
  handler: async (req) => {
    try {
      const body = await req.json() as CreateScheduleBody;
      const result = createScheduleSchema.safeParse(body);

      if (!result.success) {
        throw Errors.validation('Invalid request body', result.error.errors);
      }

      const schedule = await scheduleRepository.create(result.data);
      return NextResponse.json<ApiResponse<Schedule>>({ data: schedule });
    } catch (error) {
      console.error('Failed to create schedule:', error);
      
      if (isAppError(error)) {
        return NextResponse.json<ApiResponse<Schedule>>(
          { error: error.message },
          { status: error.status }
        );
      }
      
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Failed to create schedule' },
        { status: 500 }
      );
    }
  }
});

// PUT /api/schedules/[id]
export const PUT = createRouteHandler<Schedule, UpdateScheduleBody>({
  validate: {
    body: updateScheduleSchema
  },
  handler: async (req) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (typeof id !== 'string' || id.trim() === '') {
        throw Errors.validation('Invalid schedule ID');
      }

      const body = await req.json() as UpdateScheduleBody;
      const result = updateScheduleSchema.safeParse(body);

      if (!result.success) {
        throw Errors.validation('Invalid request body', result.error.errors);
      }

      const schedule = await scheduleRepository.update(id, result.data);
      return NextResponse.json<ApiResponse<Schedule>>({ data: schedule });
    } catch (error) {
      console.error('Failed to update schedule:', error);
      
      if (isAppError(error)) {
        return NextResponse.json<ApiResponse<Schedule>>(
          { error: error.message },
          { status: error.status }
        );
      }
      
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }
  }
});

// DELETE /api/schedules/[id]
export const DELETE = createRouteHandler<void>({
  handler: async (req) => {
    try {
      const id = req.nextUrl.pathname.split('/').pop();
      if (typeof id !== 'string' || id.trim() === '') {
        throw Errors.validation('Invalid schedule ID');
      }

      await scheduleRepository.delete(id);
      return NextResponse.json<ApiResponse<void>>({ data: undefined });
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      
      if (isAppError(error)) {
        return NextResponse.json<ApiResponse<void>>(
          { error: error.message },
          { status: error.status }
        );
      }
      
      return NextResponse.json<ApiResponse<void>>(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }
  }
}); 