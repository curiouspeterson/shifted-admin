/**
 * Sign Out API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the endpoint for user sign-out.
 * Handles session termination and cleanup using Supabase Auth.
 * 
 * Features:
 * - Session termination
 * - Rate limiting to prevent abuse
 * - Standardized error handling
 * 
 * Error Handling:
 * - 401: Not authenticated
 * - 429: Rate limit exceeded
 * - 500: Server error
 */

import { createRouteHandler } from '../../../lib/api/handler';
import type { ApiResponse } from '../../../lib/api/types';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
} from '../../../lib/constants/http';
import { defaultRateLimits } from '../../../lib/api/rate-limit';
import {
  AuthenticationError,
  DatabaseError,
} from '../../../lib/errors';

// Custom rate limits for authentication
const authRateLimits = {
  signOut: {
    ...defaultRateLimits.api,
    limit: 30, // 30 requests per minute
    identifier: 'auth:sign-out',
  },
};

/**
 * POST /api/auth/sign-out
 * Signs out the current user and invalidates their session
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: true,
  rateLimit: authRateLimits.signOut,
  cors: true,
  handler: async ({ supabase, session }): Promise<ApiResponse> => {
    if (!session) {
      throw new AuthenticationError('No active session');
    }

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw new DatabaseError('Failed to sign out', signOutError);
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