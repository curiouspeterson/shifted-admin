/**
 * Employee Detail API Routes
 * Last Updated: 2024-03
 * 
 * This file implements the endpoints for individual employee management:
 * - GET: Retrieve employee details
 * - PATCH: Update employee information
 * - DELETE: Deactivate employee (soft delete)
 * 
 * Features:
 * - Role-based access control
 * - Input validation using Zod schemas
 * - Response caching for GET requests
 * - Soft delete functionality
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: Employee not found
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '../../../lib/api/handler';
import type { ApiResponse } from '../../../lib/api/types';
import { EmployeesOperations } from '../../../lib/api/database/employees';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_NOT_FOUND,
} from '../../../lib/constants/http';
import { defaultRateLimits } from '../../../lib/api/rate-limit';
import { cacheConfigs } from '../../../lib/api/cache';
import {
  updateEmployeeSchema,
} from '../../../lib/schemas/api';
import {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '../../../lib/errors';

// Custom rate limits for employee detail operations
const employeeRateLimits = {
  // Get employee details (150 requests per minute)
  get: {
    ...defaultRateLimits.api,
    limit: 150,
    identifier: 'employees:get',
  },
  
  // Update employee (40 requests per minute)
  update: {
    ...defaultRateLimits.api,
    limit: 40,
    identifier: 'employees:update',
  },

  // Delete employee (20 requests per minute)
  delete: {
    ...defaultRateLimits.api,
    limit: 20,
    identifier: 'employees:delete',
  },
} as const;

// Cache configuration for employee details
const employeeCacheConfig = {
  // Get operation (1 minute cache)
  get: {
    ...cacheConfigs.short,
    ttl: 60, // 1 minute
    prefix: 'api:employees:detail',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/employees/[id]
 * Retrieve details for a specific employee
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  rateLimit: employeeRateLimits.get,
  middleware: middlewareConfig,
  cache: employeeCacheConfig.get,
  cors: true,
  handler: async ({ supabase, params, cache }): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Employee ID is required');
    }

    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Fetch employee details
    const result = await employees.findById(params.id);

    if (result.error) {
      throw new DatabaseError('Failed to fetch employee details', result.error);
    }

    if (!result.data) {
      throw new NotFoundError('Employee not found');
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
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
 * PATCH /api/employees/[id]
 * Update an employee's information
 */
export const PATCH = createRouteHandler({
  methods: ['PATCH'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: updateEmployeeSchema,
  rateLimit: employeeRateLimits.update,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, session, params, body }): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Employee ID is required');
    }

    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Check if employee exists
    const existing = await employees.findById(params.id);
    if (!existing.data) {
      throw new NotFoundError('Employee not found');
    }

    // Only admins can modify other supervisors
    if (existing.data.role === 'supervisor' && 
        session?.user.user_metadata.role !== 'admin') {
      throw new AuthorizationError('Only admins can modify supervisor accounts');
    }

    // Update employee record
    const result = await employees.update(params.id, {
      ...body!,
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to update employee', result.error);
    }

    return {
      data: result.data,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
});

/**
 * DELETE /api/employees/[id]
 * Soft delete an employee by setting their status to inactive
 */
export const DELETE = createRouteHandler({
  methods: ['DELETE'],
  requireAuth: true,
  requireSupervisor: true,
  rateLimit: employeeRateLimits.delete,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, session, params }): Promise<ApiResponse> => {
    if (!params?.id) {
      throw new ValidationError('Employee ID is required');
    }

    // Initialize database operations
    const employees = new EmployeesOperations(supabase);

    // Check if employee exists
    const existing = await employees.findById(params.id);
    if (!existing.data) {
      throw new NotFoundError('Employee not found');
    }

    // Only admins can delete supervisors
    if (existing.data.role === 'supervisor' && 
        session?.user.user_metadata.role !== 'admin') {
      throw new AuthorizationError('Only admins can delete supervisor accounts');
    }

    // Soft delete by updating status to inactive
    const result = await employees.update(params.id, {
      status: 'inactive',
      updated_at: new Date().toISOString(),
    });

    if (result.error) {
      throw new DatabaseError('Failed to deactivate employee', result.error);
    }

    return {
      data: null,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 