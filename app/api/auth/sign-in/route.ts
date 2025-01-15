/**
 * Sign In API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the authentication endpoint for user sign-in.
 * Handles email/password authentication using Supabase Auth and
 * retrieves associated employee details upon successful authentication.
 * 
 * Features:
 * - Email/password authentication with rate limiting
 * - Input validation using Zod schemas
 * - Employee details retrieval
 * - Standardized error handling
 * 
 * Error Handling:
 * - 400: Invalid credentials or missing required fields
 * - 401: Authentication failed
 * - 429: Rate limit exceeded
 * - 500: Server error or database operation failed
 */

import { z } from 'zod';
import { createRouteHandler } from '../../../lib/api/handler';
import type { ApiResponse } from '../../../lib/api/types';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../../lib/constants/http';
import { defaultRateLimits } from '../../../lib/api/rate-limit';
import {
  ValidationError,
  AuthenticationError,
  DatabaseError,
} from '../../../lib/errors';

// Validation schema for sign-in credentials
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Custom rate limits for authentication
const authRateLimits = {
  signIn: {
    ...defaultRateLimits.api,
    limit: 20, // 20 attempts per minute
    identifier: 'auth:sign-in',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 10 * 1024, // 10KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * POST /api/auth/sign-in
 * Authenticates a user and returns their session and employee details
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: false,
  bodySchema: signInSchema,
  rateLimit: authRateLimits.signIn,
  middleware: middlewareConfig,
  cors: true,
  handler: async ({ supabase, body }): Promise<ApiResponse> => {
    // Attempt authentication with Supabase
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: body!.email,
      password: body!.password,
    });

    // Handle authentication errors
    if (signInError) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!session) {
      throw new DatabaseError('Failed to create session');
    }

    // Fetch associated employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, position, role, department, status')
      .eq('user_id', session.user.id)
      .single();

    // Handle employee lookup errors
    if (employeeError) {
      throw new DatabaseError('Failed to fetch employee details', employeeError);
    }

    if (!employee) {
      throw new ValidationError('No employee record found for this user');
    }

    return {
      data: {
        session,
        employee,
      },
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 