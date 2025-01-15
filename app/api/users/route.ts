/**
 * Users API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the API endpoints for managing Supabase Auth users:
 * - GET: List all users (supervisor/admin access only)
 * 
 * Features:
 * - Role-based access control (supervisor/admin only)
 * - Input validation using Zod schemas
 * - Response caching for list operations
 * - User metadata validation
 * 
 * Error Handling:
 * - 400: Invalid request data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { z } from 'zod';
import { createRouteHandler } from '@/lib/api/handler';
import type { ApiResponse, RouteContext } from '@/lib/api/types';
import { HTTP_STATUS_OK } from '@/lib/constants/http';
import { defaultRateLimits } from '@/lib/api/rate-limit';
import { cacheConfigs } from '@/lib/api/cache';
import {
  ValidationError,
  AuthorizationError,
  DatabaseError,
} from '@/lib/errors';

// User schema with metadata validation
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  last_sign_in_at: z.string().nullable(),
  user_metadata: z.object({
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    role: z.enum(['employee', 'supervisor', 'admin']),
  }).nullable(),
});

type User = z.infer<typeof userSchema>;

// Custom rate limits for user operations
const userRateLimits = {
  // List users (50 requests per minute)
  list: {
    ...defaultRateLimits.api,
    limit: 50,
    identifier: 'users:list',
  },
} as const;

// Cache configuration for users
const userCacheConfig = {
  // List operation (1 minute cache)
  list: {
    ...cacheConfigs.short,
    prefix: 'api:users:list',
  },
};

// Middleware configuration
const middlewareConfig = {
  maxSize: 100 * 1024, // 100KB
  requireContentType: true,
  allowedContentTypes: ['application/json'],
};

/**
 * GET /api/users
 * List all user accounts (supervisor/admin only)
 */
export const GET = createRouteHandler({
  methods: ['GET'],
  requireAuth: true,
  requireSupervisor: true,
  rateLimit: userRateLimits.list,
  middleware: middlewareConfig,
  cache: userCacheConfig.list,
  cors: true,
  handler: async ({ 
    supabase,
    session,
    cache,
  }: RouteContext): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Only supervisors and admins can list users
    if (!session.user.user_metadata.role || 
        !['supervisor', 'admin'].includes(session.user.user_metadata.role)) {
      throw new AuthorizationError('Only supervisors and admins can list users');
    }

    // Fetch all users using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      throw new DatabaseError('Failed to fetch users', error);
    }

    // Validate user data
    const validatedUsers = users?.map(user => {
      try {
        return userSchema.parse(user);
      } catch (err) {
        throw new ValidationError('Invalid user data format', err);
      }
    }) || [];

    return {
      data: validatedUsers,
      error: null,
      status: HTTP_STATUS_OK,
      metadata: {
        count: validatedUsers.length,
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