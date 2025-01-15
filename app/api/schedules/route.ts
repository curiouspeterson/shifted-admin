/**
 * Schedules API Route Handler
 * Last Updated: 2025-01-15
 * 
 * This module provides RESTful endpoints for managing schedules with:
 * - Type-safe request/response handling
 * - Request validation
 * - Response caching
 * - Rate limiting
 * - Error handling
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api';
import { ApiError } from '@/lib/api/errors';
import { scheduleRepository, type Schedule, type CreateScheduleBody, type UpdateScheduleBody, type ScheduleStatus } from '@/lib/api/repositories';

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
  auth: {
    required: true,
  },
  cache: {
    enabled: true,
    tags: ['schedules'],
  },
  rateLimit: {
    enabled: true,
    requests: 100,
    window: 60, // 1 minute
  },
}, async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as ScheduleStatus;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Query schedules with filters
  const schedules = await scheduleRepository.findMany({
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  return schedules;
});

// POST /api/schedules
export const POST = createRouteHandler<Schedule, CreateScheduleBody>({
  auth: {
    required: true,
    roles: ['admin'],
  },
  validation: {
    body: createScheduleSchema,
  },
  rateLimit: {
    enabled: true,
    requests: 50,
    window: 60, // 1 minute
  },
}, async (req, ctx) => {
  // ctx.validatedBody is guaranteed to be defined due to validation
  const schedule = await scheduleRepository.create({
    ...ctx.validatedBody!,
    created_by: ctx.auth!.id,
  });
  return schedule;
});

// PUT /api/schedules/[id]
export const PUT = createRouteHandler<Schedule, UpdateScheduleBody>({
  auth: {
    required: true,
    roles: ['admin'],
  },
  validation: {
    body: updateScheduleSchema,
  },
  rateLimit: {
    enabled: true,
    requests: 50,
    window: 60, // 1 minute
  },
}, async (req, ctx) => {
  const id = ctx.params?.id;
  if (!id) {
    throw new ApiError('BAD_REQUEST', 'Schedule ID is required', 400);
  }

  // ctx.validatedBody is guaranteed to be defined due to validation
  const schedule = await scheduleRepository.update(id, {
    ...ctx.validatedBody!,
    updated_by: ctx.auth!.id,
  });
  
  if (!schedule) {
    throw new ApiError('NOT_FOUND', 'Schedule not found', 404);
  }

  return schedule;
});

// DELETE /api/schedules/[id]
export const DELETE = createRouteHandler({
  auth: {
    required: true,
    roles: ['admin'],
  },
  rateLimit: {
    enabled: true,
    requests: 20,
    window: 60, // 1 minute
  },
}, async (req, ctx) => {
  const id = ctx.params?.id;
  if (!id) {
    throw new ApiError('BAD_REQUEST', 'Schedule ID is required', 400);
  }

  await scheduleRepository.delete(id);
  return null;
}); 