/**
 * Schedule API Route - Single Schedule Operations
 * Last Updated: 2025-01-15
 * 
 * This module provides API endpoints for managing individual schedules:
 * GET /api/schedules/[id] - Get a single schedule
 * PUT /api/schedules/[id] - Update a schedule
 * DELETE /api/schedules/[id] - Delete a schedule
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/lib/api/routeHandler';
import type { RouteContext } from '@/lib/api/routeHandler';
import { scheduleRepository } from '@/lib/api/repositories';
import { CACHE_KEYS } from '@/lib/api/cache/config';
import type { Schedule, ScheduleStatus } from '@/lib/api/repositories';

// Validation schemas
const updateScheduleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

type UpdateScheduleResponse = z.infer<typeof updateScheduleSchema>;

// GET /api/schedules/[id]
export const GET = createRouteHandler(
  {
    auth: {
      required: true,
      roles: ['user', 'admin'],
    },
    cache: {
      enabled: true,
      tags: [CACHE_KEYS.SCHEDULES],
    },
    rateLimit: {
      enabled: true,
      requests: 100,
      window: 60, // 1 minute
    },
  },
  async (req: NextRequest, ctx: RouteContext) => {
    if (!ctx.params?.id) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID is required' }),
        { status: 400 }
      );
    }

    const schedule = await scheduleRepository.findById(ctx.params.id);
    
    if (!schedule) {
      return new Response(
        JSON.stringify({ error: 'Schedule not found' }),
        { status: 404 }
      );
    }

    return schedule;
  }
);

// PUT /api/schedules/[id]
export const PUT = createRouteHandler<UpdateScheduleResponse>(
  {
    auth: {
      required: true,
      roles: ['admin'],
    },
    validation: {
      body: updateScheduleSchema,
    },
    cache: {
      enabled: false,
    },
    rateLimit: {
      enabled: true,
      requests: 50,
      window: 60, // 1 minute
    },
  },
  async (req: NextRequest, ctx: RouteContext) => {
    if (!ctx.params?.id) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID is required' }),
        { status: 400 }
      ) as any;
    }

    const body = await req.json();
    const data = updateScheduleSchema.parse(body);

    // Check if schedule exists
    const existingSchedule = await scheduleRepository.findById(ctx.params.id);
    if (!existingSchedule) {
      return new Response(
        JSON.stringify({ error: 'Schedule not found' }),
        { status: 404 }
      ) as any;
    }

    // Update schedule
    await scheduleRepository.update(ctx.params.id, {
      ...data,
      updated_at: new Date().toISOString(),
    });

    return data;
  }
);

// DELETE /api/schedules/[id]
export const DELETE = createRouteHandler(
  {
    auth: {
      required: true,
      roles: ['admin'],
    },
    cache: {
      enabled: false,
    },
    rateLimit: {
      enabled: true,
      requests: 50,
      window: 60, // 1 minute
    },
  },
  async (req: NextRequest, ctx: RouteContext) => {
    if (!ctx.params?.id) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID is required' }),
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existingSchedule = await scheduleRepository.findById(ctx.params.id);
    if (!existingSchedule) {
      return new Response(
        JSON.stringify({ error: 'Schedule not found' }),
        { status: 404 }
      );
    }

    // Delete schedule
    await scheduleRepository.delete(ctx.params.id);

    return new Response(null, { status: 204 });
  }
); 