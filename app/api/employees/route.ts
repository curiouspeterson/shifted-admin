/**
 * Employees API Route
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing employees.
 * It provides functionality to:
 * - Get all employees
 * - Create new employees
 * - Update existing employees
 * - Delete employees
 * 
 * All operations require supervisor permissions.
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createRouteHandler } from '../../lib/api/handler';
import { EmployeesOperations } from '../../lib/api/database/employees';
import type { RouteContext } from '../../lib/api/types';

// Validation Schemas
const employeeSchema = z.object({
  user_id: z.string().uuid(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  position: z.enum(['staff', 'shift_supervisor', 'management']),
  hourly_rate: z.number().min(0),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.enum(['first_name', 'last_name', 'email', 'position', 'start_date']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  position: z.enum(['staff', 'shift_supervisor', 'management']).optional(),
});

// GET /api/employees
export const GET = createRouteHandler(
  async (req: NextRequest, { supabase }: RouteContext) => {
    const employees = new EmployeesOperations(supabase);
    const query = Object.fromEntries(req.nextUrl.searchParams);
    const { sort, order, limit, offset, position } = querySchema.parse(query);

    const { data, error } = await employees.findMany({
      orderBy: sort ? {
        column: sort,
        ascending: order !== 'desc',
      } : undefined,
      limit,
      offset,
      filter: position ? { position } : undefined,
    });

    if (error) {
      return {
        error: 'Failed to fetch employees',
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

// POST /api/employees
export const POST = createRouteHandler(
  async (req: NextRequest, { supabase }: RouteContext) => {
    const employees = new EmployeesOperations(supabase);
    const body = await req.json();
    const validatedData = employeeSchema.parse(body);

    const { data, error } = await employees.create(validatedData);

    if (error) {
      return {
        error: 'Failed to create employee',
        data: null,
        metadata: { originalError: error },
      };
    }

    if (!data) {
      return {
        error: 'Failed to create employee - no data returned',
        data: null,
        metadata: {},
      };
    }

    return {
      data,
      error: null,
      metadata: {
        message: 'Employee created successfully',
      },
    };
  },
  {
    requireAuth: true,
    requireSupervisor: true,
    validateBody: employeeSchema,
  }
);