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
import type { ApiHandlerOptions, ExtendedNextRequest, QueryOptions, RouteContext } from '@/lib/api/types';
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
import type { DatabaseErrorDetail } from '@/lib/errors/database';
import type { ValidationErrorDetail } from '@/lib/errors/validation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

const DEFAULT_PAGE_SIZE = 10;

type EmployeeSortColumn = keyof Database['public']['Tables']['employees']['Row'];
type QueryOptionsWithEmployeeSort = {
  limit: number;
  offset: number;
  orderBy?: {
    column: EmployeeSortColumn;
    ascending?: boolean | undefined;
  } | undefined;
  filter?: Record<string, string | undefined> | undefined;
};

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
    try {
      const context: RouteContext = {
        req,
        supabase: req.supabase,
        user: req.user,
        session: req.session
      };

      const searchParams = Object.fromEntries(new URL(req.url).searchParams);
      
      const filter: Record<string, string | undefined> = {};
      if (searchParams['status']) filter['status'] = searchParams['status'];
      if (searchParams['role']) filter['role'] = searchParams['role'];
      if (searchParams['department']) filter['department'] = searchParams['department'];
      
      const queryParams: QueryOptionsWithEmployeeSort = {
        limit: searchParams['limit'] ? parseInt(searchParams['limit'] as string, 10) : DEFAULT_PAGE_SIZE,
        offset: searchParams['offset'] ? parseInt(searchParams['offset'] as string, 10) : 0,
        orderBy: searchParams['sort'] ? {
          column: searchParams['sort'] as EmployeeSortColumn,
          ascending: searchParams['order'] ? searchParams['order'] === 'asc' : undefined
        } : undefined,
        filter
      };

      const { data: employees, error } = await context.supabase
        .from('employees')
        .select('*')
        .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)
        .order(queryParams.orderBy?.column || 'created_at', {
          ascending: queryParams.orderBy?.ascending ?? true
        });

      if (error) {
        throw new DatabaseError('Failed to fetch employees', {
          code: 'QUERY_ERROR',
          table: 'employees'
        });
      }

      return NextResponse.json({ data: employees });

    } catch (error) {
      if (error instanceof ValidationError) {
        const validationError: ValidationErrorDetail = {
          path: ['query'],
          message: error.message,
          code: 'INVALID_QUERY_PARAMS'
        };
        throw new ValidationError('Invalid query parameters', [validationError]);
      }

      if (error instanceof DatabaseError) {
        throw error;
      }

      throw new DatabaseError('Failed to process request', {
        code: 'UNKNOWN_ERROR',
        table: 'employees'
      });
    }
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