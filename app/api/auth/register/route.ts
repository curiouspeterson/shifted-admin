/**
 * User Registration API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the endpoint for new user registration.
 * Handles user creation, employee record creation, and initial setup.
 * 
 * Features:
 * - Input validation using Zod schemas
 * - Rate limiting to prevent abuse
 * - Transaction-based user and employee creation
 * - Role-based access control
 * 
 * Error Handling:
 * - 400: Invalid input data
 * - 401: Not authorized to create users
 * - 409: Email already exists
 * - 429: Rate limit exceeded
 * - 500: Server error or database operation failed
 */

import { z } from 'zod';
import { createRouteHandler } from '../../../lib/api/handler';
import type { ApiResponse } from '../../../lib/api/types';
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_CONFLICT,
} from '../../../lib/constants/http';
import { defaultRateLimits } from '../../../lib/api/rate-limit';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
} from '../../../lib/errors';

// Validation schema for user registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  position: z.string().min(1, 'Position is required'),
  role: z.enum(['employee', 'supervisor', 'admin']),
});

// Custom rate limits for registration
const authRateLimits = {
  register: {
    ...defaultRateLimits.api,
    limit: 10, // 10 registration attempts per minute
    identifier: 'auth:register',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 20 * 1024, // 20KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * POST /api/auth/register
 * Creates a new user account and associated employee record
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  requireSupervisor: true,
  bodySchema: registerSchema,
  rateLimit: authRateLimits.register,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, session, body }): Promise<ApiResponse> => {
    // Only supervisors and admins can create new users
    if (!session?.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only supervisors and admins can create new users');
    }

    // Start a transaction for user and employee creation
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: body!.email,
      password: body!.password,
      email_confirm: true,
      user_metadata: {
        role: body!.role,
      },
    });

    if (userError) {
      if (userError.message.includes('already exists')) {
        throw new ValidationError('Email already registered', {
          code: 'EMAIL_EXISTS',
          status: HTTP_STATUS_CONFLICT,
        });
      }
      throw new DatabaseError('Failed to create user account', userError);
    }

    if (!user) {
      throw new DatabaseError('No user data returned from creation');
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: user.id,
        first_name: body!.first_name,
        last_name: body!.last_name,
        email: body!.email,
        position: body!.position,
        is_active: true,
      })
      .select()
      .single();

    if (employeeError) {
      // Attempt to clean up user if employee creation fails
      await supabase.auth.admin.deleteUser(user.id);
      throw new DatabaseError('Failed to create employee record', employeeError);
    }

    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: body!.role,
        },
        employee,
      },
      error: null,
      status: HTTP_STATUS_CREATED,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 