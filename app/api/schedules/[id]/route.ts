/**
 * Schedule API Route - Single Schedule Operations
 * Last Updated: 2025-01-17
 * 
 * This module provides API endpoints for managing individual schedules:
 * GET /api/schedules/[id] - Get a single schedule
 * PUT /api/schedules/[id] - Update a schedule
 * DELETE /api/schedules/[id] - Delete a schedule
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import { scheduleRepository } from '@/lib/api/repositories';
import type { Schedule } from '@/lib/api/repositories';

// Validation schemas
const updateScheduleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

type UpdateScheduleRequest = z.infer<typeof updateScheduleSchema>;

// GET /api/schedules/[id]
export const GET = createRouteHandler({
  handler: async (req) => {
    const id = req.nextUrl.pathname.split('/').pop();
    
    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    const schedule = await scheduleRepository.findById(id);

    if (schedule === null) {
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Schedule>>({ data: schedule });
  }
});

// PUT /api/schedules/[id]
export const PUT = createRouteHandler({
  validate: {
    body: updateScheduleSchema
  },
  handler: async (req) => {
    const id = req.nextUrl.pathname.split('/').pop();
    
    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    const body = await req.json() as UpdateScheduleRequest;
    const result = updateScheduleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const updated = await scheduleRepository.update(id, result.data);

    if (updated === null) {
      return NextResponse.json<ApiResponse<Schedule>>(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Schedule>>({ data: updated });
  }
});

// DELETE /api/schedules/[id]
export const DELETE = createRouteHandler({
  handler: async (req) => {
    const id = req.nextUrl.pathname.split('/').pop();
    
    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json<ApiResponse<void>>(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      );
    }

    const result = await scheduleRepository.delete(id);

    if (result === null) {
      return NextResponse.json<ApiResponse<void>>(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<void>>({ data: undefined });
  }
}); 