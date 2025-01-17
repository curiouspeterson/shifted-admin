/**
 * Employee Management API Routes
 * Last Updated: January 17, 2025
 * 
 * This file implements the main endpoints for employee management:
 * - GET: List employees with filtering, sorting, and pagination
 * - POST: Create new employee records
 * 
 * Features:
 * - Role-based access control (supervisor/admin only for mutations)
 * - Input validation using Zod schemas
 * - Pagination and filtering
 * - Response caching for list operations
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 409: Conflicting data (e.g., duplicate email)
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ApiHandlerOptions, ExtendedNextRequest } from '@/lib/api/types';
import { EmployeesOperations } from '@/lib/api/database/employees';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_CONFLICT,
} from '@/lib/constants/http';
import { CacheControl } from '@/lib/api/cache';
import {
  listEmployeesQuerySchema,
  createEmployeeSchema,
  employeeSortSchema,
} from '@/lib/schemas/api';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
} from '@/lib/errors';

type EmployeeSortColumn = NonNullable<z.infer<typeof employeeSortSchema>['sort']>;

// Custom rate limits for employee operations
const employeeRateLimits = {
  // List employees (100 requests per minute)
  list: {
    windowMs: 60000,
    maxRequests: 100,
    identifier: 'employees:list',
  },
  
  // Create employee (30 requests per minute)
  create: {
    windowMs: 60000,
    maxRequests: 30,
    identifier: 'employees:create',
  },
} as const;

// Cache configuration for employees
const employeeCacheConfig = {
  // List operation (2 minutes cache)
  list: {
    control: CacheControl.ShortTerm,
    revalidate: 120,
    prefix: 'api:employees:list',
    includeQuery: true,
    excludeParams: ['offset'] as const,
  },
};

/**
 * GET /api/employees
 * List employees with optional filtering and pagination
 */
export const GET = createRouteHandler(
  async (req: ExtendedNextRequest) => {
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams);
    const { supabase } = req;

    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Build query options using sanitized query parameters
    const options = {
      limit: query.limit ? parseInt(query.limit) : undefined,
      offset: query.offset ? parseInt(query.offset) : undefined,
      orderBy: query.sort
        ? { column: query.sort as EmployeeSortColumn, ascending: query.order !== 'desc' }
        : undefined,
      filter: {
        ...(query.status && { status: query.status }),
        ...(query.role && { role: query.role }),
        ...(query.department && { department: query.department }),
      },
    };

    // Fetch employees
    const result = await employees.findMany(options);

    if (result.error) {
      throw new DatabaseError('Failed to fetch employees', { 
        cause: result.error 
      });
    }

    return NextResponse.json({ 
      data: result.data || [],
      error: null,
    }, { status: HTTP_STATUS_OK });
  },
  {
    validate: {
      query: listEmployeesQuerySchema,
    },
    cache: employeeCacheConfig.list,
    rateLimit: employeeRateLimits.list,
  } as ApiHandlerOptions
);

/**
 * POST /api/employees
 * Create a new employee record
 */
export const POST = createRouteHandler(
  async (req: ExtendedNextRequest) => {
    const { supabase, session } = req;
    const body = await req.json();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Only supervisors and admins can create employees
    if (!session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only supervisors and admins can create employees');
    }

    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Check if employee with same user ID exists
    const { data: existing } = await employees.findByUserId(body.user_id);
    if (existing) {
      throw new ValidationError('Employee record already exists for this user', {
        code: 'USER_EXISTS',
        status: HTTP_STATUS_CONFLICT,
      });
    }

    // Create employee record
    const result = await employees.create({
      ...body,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to create employee record', { 
        cause: result.error 
      });
    }

    return NextResponse.json({
      data: result.data,
      error: null,
    }, { status: HTTP_STATUS_CREATED });
  },
  {
    validate: {
      body: createEmployeeSchema,
    },
    rateLimit: employeeRateLimits.create,
  } as ApiHandlerOptions
);