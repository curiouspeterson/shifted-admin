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
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database/database.types';
import {
  listShiftsQuerySchema,
  createShiftSchema,
} from '@/lib/schemas/api';
import { Errors } from '@/lib/errors/types';
import type { Json } from '@/lib/types/json';

// Type definitions
type ShiftRow = Database['public']['Tables']['shifts']['Row'];
type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Ensure all boolean fields are required in the request
const strictCreateShiftSchema = createShiftSchema.transform((data) => ({
  ...data,
  requiresSupervisor: data.requiresSupervisor ?? false,
  crossesMidnight: data.crossesMidnight ?? false
}));

// GET /api/shifts
export const GET = createRouteHandler<ShiftRow[]>({
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
        order: searchParams.get('order') as 'asc' | 'desc' | undefined
      });

      const supabase = createClient(cookies());
      const shiftsOps = new ShiftsOperations(supabase);
      
      const options = {
        limit: query.limit ?? 10,
        offset: query.offset ?? 0,
        ...(query.sort && {
          orderBy: {
            column: query.sort as keyof ShiftRow,
            ascending: query.order === 'asc'
          } as const
        })
      } as const;
      
      const result = await shiftsOps.findMany(options);

      if (result.error) {
        throw result.error;
      }

      return NextResponse.json<ApiResponse<ShiftRow[]>>({
        data: result.data ?? []
      });
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftRow[]>>(
          { 
            data: [],
            error: error.message,
            status: 400
          },
          { status: 400 }
        );
      }

      return NextResponse.json<ApiResponse<ShiftRow[]>>(
        { 
          data: [],
          error: 'Failed to fetch shifts',
          status: 500
        },
        { status: 500 }
      );
    }
  }
});

// POST /api/shifts
export const POST = createRouteHandler<ShiftRow | undefined, z.infer<typeof strictCreateShiftSchema>>({
  validate: {
    body: strictCreateShiftSchema
  },
  handler: async (req) => {
    try {
      const body = await req.json();
      const result = strictCreateShiftSchema.safeParse(body);

      if (!result.success) {
        throw Errors.validation('Invalid request body', result.error.errors);
      }

      const supabase = createClient(cookies());
      const shiftsOps = new ShiftsOperations(supabase);
      
      const shiftData: ShiftInsert = {
        title: result.data.name,
        start_time: result.data.startTime,
        end_time: result.data.endTime,
        duration_minutes: result.data.durationHours * 60,
        pattern_type: 'fixed',
        crosses_midnight: result.data.crossesMidnight,
        requires_supervisor: result.data.requiresSupervisor,
        metadata: (result.data.metadata ?? null) as Json
      };
      
      const dbResult = await shiftsOps.create(shiftData);
      
      if (dbResult.error) {
        throw dbResult.error;
      }

      return NextResponse.json<ApiResponse<ShiftRow>>({
        data: dbResult.data!
      });
    } catch (error) {
      console.error('Failed to create shift:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftRow | undefined>>(
          { 
            data: undefined,
            error: error.message,
            status: 400
          },
          { status: 400 }
        );
      }

      return NextResponse.json<ApiResponse<ShiftRow | undefined>>(
        { 
          data: undefined,
          error: 'Failed to create shift',
          status: 500
        },
        { status: 500 }
      );
    }
  }
}); 