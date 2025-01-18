/**
 * Shifts API Route Handler
 * Last Updated: 2025-03-19
 * 
 * Implements REST endpoints for shift management:
 * - GET: List shifts with filtering, sorting and pagination
 * - POST: Create new shift definitions
 * 
 * Features:
 * - End-to-end type safety with Supabase and Zod
 * - Role-based access control via middleware
 * - Input validation and sanitization
 * - Error handling with custom error types
 * - Response caching for list operations
 */

import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';
import { ShiftsOperations } from '@/lib/api/database/shifts';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types';
import { z } from 'zod';

// Type definitions for enhanced type safety
type ShiftRow = Database['public']['Tables']['shifts']['Row'];
type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];

// Validation schemas
const listShiftsQuerySchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

const createShiftSchema = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationHours: z.number(),
  crossesMidnight: z.boolean().optional(),
  requiresSupervisor: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});

// GET /api/shifts - List shifts with filtering and pagination
export const GET = createRouteHandler<ShiftRow[]>({
  validate: {
    query: listShiftsQuerySchema
  },
  handler: async (req) => {
    try {
      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const query = listShiftsQuerySchema.parse({
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
        sort: searchParams.get('sort'),
        order: searchParams.get('order') as 'asc' | 'desc' | undefined
      });

      // Initialize database client and operations
      const supabase = createClient(cookies());
      const shiftsOps = new ShiftsOperations(supabase);
      
      // Build query options with type safety
      const options = {
        limit: query.limit ?? 10,
        offset: query.offset ?? 0,
        ...(query.sort && {
          orderBy: {
            column: query.sort,
            ascending: query.order === 'asc'
          }
        })
      };
      
      // Execute database query
      const result = await shiftsOps.findMany(options);

      if (result.error) {
        throw result.error;
      }

      // Return successful response
      return NextResponse.json<ApiResponse<ShiftRow[]>>({
        data: result.data ?? [],
        status: 200
      });

    } catch (error) {
      console.error('[Shifts API] Failed to fetch shifts:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftRow[]>>({
          data: [],
          error: error.message,
          status: 400
        }, { status: 400 });
      }

      return NextResponse.json<ApiResponse<ShiftRow[]>>({
        data: [],
        error: 'Internal server error',
        status: 500
      }, { status: 500 });
    }
  }
});

// POST /api/shifts - Create new shift
export const POST = createRouteHandler<ShiftRow>({
  validate: {
    body: createShiftSchema
  },
  handler: async (req) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validatedData = createShiftSchema.parse(body);

      // Initialize database client and operations
      const supabase = createClient(cookies());
      const shiftsOps = new ShiftsOperations(supabase);
      
      // Transform validated data to database schema
      const shiftData: ShiftInsert = {
        title: validatedData.name,
        start_time: validatedData.startTime,
        end_time: validatedData.endTime,
        duration_minutes: validatedData.durationHours * 60,
        pattern_type: 'fixed',
        crosses_midnight: validatedData.crossesMidnight ?? false,
        requires_supervisor: validatedData.requiresSupervisor ?? false,
        metadata: validatedData.metadata ?? null
      };
      
      // Create shift in database
      const dbResult = await shiftsOps.create(shiftData);
      
      if (dbResult.error) {
        throw dbResult.error;
      }

      if (!dbResult.data) {
        throw new Error('Failed to create shift');
      }

      // Return successful response
      return NextResponse.json<ApiResponse<ShiftRow>>({
        data: dbResult.data,
        status: 201
      }, { status: 201 });

    } catch (error) {
      console.error('[Shifts API] Failed to create shift:', error);
      
      if (error instanceof Error) {
        return NextResponse.json<ApiResponse<ShiftRow>>({
          error: error.message,
          status: 400
        }, { status: 400 });
      }

      return NextResponse.json<ApiResponse<ShiftRow>>({
        error: 'Internal server error',
        status: 500
      }, { status: 500 });
    }
  }
});