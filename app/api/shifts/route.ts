/**
 * Shifts API Route
 * Last Updated: 2025-01-17
 * 
 * This file implements the endpoints for managing shift definitions:
 * - GET: List all shifts with filtering and pagination
 * - POST: Create new shift definitions
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - Shift validation and conflict detection
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import { ShiftsOperations } from '@/lib/api/database/shifts';
import { CacheControl } from '@/lib/api/cache';
import {
  listShiftsQuerySchema,
  createShiftSchema,
  shiftSortSchema,
} from '@/lib/schemas/api';
import { Errors } from '@/lib/errors/types';

// Type definitions
type ShiftSortColumn = NonNullable<z.infer<typeof shiftSortSchema>['sort']>;
type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
type CreateShift = z.infer<typeof createShiftSchema>;

// Cache configurations for shifts
const shiftsCacheConfig = {
  // List shifts (5 minutes cache)
  list: {
    control: CacheControl.ShortTerm,
    revalidate: 300, // 5 minutes
    prefix: 'shifts:list',
    includeQuery: true,
    excludeParams: ['page', 'limit', 'offset'] as const
  },
} as const;

// GET /api/shifts
export const GET = createRouteHandler<ShiftsOperations.ShiftList>({
  cache: shiftsCacheConfig.list,
  validate: {
    query: listShiftsQuerySchema
  },
  handler: async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = listShiftsQuerySchema.parse({
        limit: searchParams.get('limit'),
        offset: searchParams.get('offset'),
        sort: searchParams.get('sort'),
        ascending: searchParams.get('ascending') === 'true',
        crosses_midnight: searchParams.get('crosses_midnight') === 'true',
        requires_supervisor: searchParams.get('requires_supervisor') === 'true'
      });

      const shifts = await ShiftsOperations.findMany({
        limit: query.limit,
        offset: query.offset,
        orderBy: query.sort ? {
          column: query.sort,
          ascending: query.ascending
        } : undefined,
        filter: {
          crosses_midnight: query.crosses_midnight,
          requires_supervisor: query.requires_supervisor
        }
      });

      return NextResponse.json<ApiResponse<ShiftsOperations.ShiftList>>({
        data: shifts
      });
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftsOperations.ShiftList>>(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json<ApiResponse<ShiftsOperations.ShiftList>>(
        { error: 'Failed to fetch shifts' },
        { status: 500 }
      );
    }
  }
});

// POST /api/shifts
export const POST = createRouteHandler<ShiftsOperations.Shift, CreateShift>({
  validate: {
    body: createShiftSchema
  },
  handler: async (req) => {
    try {
      const body = await req.json() as CreateShift;
      const result = createShiftSchema.safeParse(body);

      if (!result.success) {
        throw Errors.validation('Invalid request body', result.error.errors);
      }

      const shift = await ShiftsOperations.create(result.data);
      return NextResponse.json<ApiResponse<ShiftsOperations.Shift>>({
        data: shift
      });
    } catch (error) {
      console.error('Failed to create shift:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftsOperations.Shift>>(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json<ApiResponse<ShiftsOperations.Shift>>(
        { error: 'Failed to create shift' },
        { status: 500 }
      );
    }
  }
}); 