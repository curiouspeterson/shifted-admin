/**
 * Employee Management API Routes
 * Last Updated: 2024-03
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
import { createRouteHandler } from '@/lib/api/handler';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { EmployeesOperations } from '@/lib/api/database/employees';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_CONFLICT,
} from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  listEmployeesQuerySchema,
  createEmployeeSchema,
  employeeSortSchema,
} from '@/lib/schemas/api';
import type { Database } from '@/lib/supabase/database.types';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
} from '@/lib/errors';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type EmployeeSortColumn = NonNullable<z.infer<typeof employeeSortSchema>['sort']>;
type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
type CreateEmployee = z.infer<typeof createEmployeeSchema>;

// Custom rate limits for employee operations
const employeeRateLimits = {
  // List employees (100 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 100,
    identifier: 'employees:list',
  },
  
  // Create employee (30 requests per minute)
  create: {
    ...defaultRateLimits.api,
    limit: 30,
    identifier: 'employees:create',
  },
} as const;

// Cache configuration for employees
const employeeCacheConfig = {
  // List operation (2 minutes cache)
  list: {
    ...cacheConfigs.short,
    prefix: 'api:employees:list',
    includeQuery: true,
    excludeParams: ['offset'] as string[],
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/employees
 * List employees with optional filtering and pagination
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  querySchema: listEmployeesQuerySchema,
  rateLimit: employeeRateLimits.list,
  middleware: middlewareConfig,
  cache: employeeCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase, 
    query, 
    cache 
  }: RouteContext<ListEmployeesQuery>): Promise<ApiResponse> => {
    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Build query options using sanitized query parameters
    const options = {
      limit: query?.limit,
      offset: query?.offset,
      orderBy: query?.sort
        ? { column: query.sort as EmployeeSortColumn, ascending: query.order !== 'desc' }
        : undefined,
      filter: {
        ...(query?.status && { status: query.status }),
        ...(query?.role && { role: query.role }),
        ...(query?.department && { department: query.department }),
      },
    };

    // Fetch employees
    const result = await employees.findMany(options);

    if (result.error) {
      throw new DatabaseError('Failed to fetch employees', result.error);
    }

    const employees_data = result.data || [];

    return {
      data: employees_data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: employees_data.length,
        timestamp: new Date().toISOString(),
        ...(cache && {
          cached: true,
          cacheHit: cache.hit,
          cacheTtl: cache.ttl,
        }),
      },
    };
  },
});

/**
 * POST /api/employees
 * Create a new employee record
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: createEmployeeSchema,
  rateLimit: employeeRateLimits.create,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ 
    supabase, 
    session, 
    body 
  }: RouteContext<unknown, CreateEmployee>): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!body) {
      throw new ValidationError('Request body is required');
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
      throw new DatabaseError('Failed to create employee record', result.error);
    }

    if (!result.data) {
      throw new DatabaseError('No data returned from employee creation');
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_CREATED,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
});