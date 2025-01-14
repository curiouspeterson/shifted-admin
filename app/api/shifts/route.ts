/**
 * Shifts API Route
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing shift definitions.
 * It provides functionality to:
 * - Get all shift templates
 * - Create new shift templates
 * - Update existing shift templates
 * 
 * All operations require supervisor permissions.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createRouteHandler } from '../../lib/api/handler';
import { ShiftsOperations } from '../../lib/api/database/shifts';
import type { RouteContext } from '../../lib/api/types';

// Validation Schemas
const shiftSchema = z.object({
  name: z.string().min(1).max(100),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration_hours: z.number().min(0).max(24),
  min_staff_count: z.number().min(1),
  requires_supervisor: z.boolean().optional(),
  crosses_midnight: z.boolean().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.enum(['name', 'start_time', 'end_time']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// GET /api/shifts
export const GET = createRouteHandler(
  async (req: NextRequest, { supabase }: RouteContext) => {
    const shifts = new ShiftsOperations(supabase);
    const query = Object.fromEntries(req.nextUrl.searchParams);
    const { sort, order, limit, offset } = querySchema.parse(query);

    const { data, error } = await shifts.findMany({
      orderBy: sort ? {
        column: sort,
        ascending: order !== 'desc',
      } : undefined,
      limit,
      offset,
    });

    if (error) {
      return {
        error: 'Failed to fetch shifts',
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

// POST /api/shifts
export const POST = createRouteHandler(
  async (req: NextRequest, { supabase }: RouteContext) => {
    const shifts = new ShiftsOperations(supabase);
    const body = await req.json();
    const validatedData = shiftSchema.parse(body);

    const { data, error } = await shifts.create(validatedData);

    if (error) {
      return {
        error: 'Failed to create shift',
        data: null,
        metadata: { originalError: error },
      };
    }

    if (!data) {
      return {
        error: 'Failed to create shift - no data returned',
        data: null,
        metadata: {},
      };
    }

    return {
      data,
      error: null,
      metadata: {
        message: 'Shift created successfully',
      },
    };
  },
  {
    requireAuth: true,
    requireSupervisor: true,
    validateBody: shiftSchema,
  }
); 