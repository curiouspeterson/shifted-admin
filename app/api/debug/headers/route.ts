/**
 * Debug Headers API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements a debugging endpoint for inspecting HTTP headers
 * and cookies. It provides detailed information about:
 * - All request headers
 * - All cookies
 * - Size analysis of headers and cookies
 * 
 * This route is useful for debugging authentication issues, cookie problems,
 * and investigating request size limitations.
 */

import { createRouteHandler } from '@/lib/api/handler'
import type { ApiResponse, RouteContext } from '@/lib/api/types'
import { defaultRateLimits } from '@/lib/api/rate-limit'
import { AppError, AuthError } from '@/lib/errors'
import { HTTP_STATUS_OK, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@/lib/constants/http'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

// Custom rate limits for debug operations
const debugRateLimits = {
  ...defaultRateLimits.api,
  limit: 10, // 10 requests per minute
  identifier: 'debug:headers',
}

interface DebugHeadersResponse {
  summary: {
    totalHeadersSize: number;
    totalCookiesSize: number;
    headerCount: number;
    cookieCount: number;
  };
  cookies: Array<{
    name: string;
    size: number;
    value: string;
    truncated?: boolean;
  }>;
  headers: Array<{
    name: string;
    size: number;
    value: string;
    truncated?: boolean;
  }>;
}

/**
 * GET /api/debug/headers
 * Analyzes and returns information about request headers and cookies
 * 
 * Returns:
 * - Summary of total sizes
 * - Detailed list of cookies with sizes and truncated values
 * - Detailed list of headers with sizes and truncated values
 */
export const GET = createRouteHandler<unknown>({
  methods: ['GET'],
  requireAuth: true,
  rateLimit: debugRateLimits,
  handler: async (context: RouteContext) => {
    // Only allow admin users to access debug endpoints
    if (!context.session?.user?.role || context.session.user.role !== 'admin') {
      throw new AuthError('Only admin users can access debug endpoints')
    }

    try {
      // Get all cookies from the request
      const cookieStore = cookies();
      const allCookies = cookieStore.getAll();
      
      // Extract Headers from the request
      const headersList = headers();
      const headersObj: Record<string, string> = {};
      headersList.forEach((value: string, key: string) => {
        headersObj[key] = value;
      });

      // Process cookies with size analysis and truncation
      const cookieSizes = allCookies.map(cookie => {
        const size = cookie.value.length;
        return {
          name: cookie.name,
          size,
          value: size > 100 ? `${cookie.value.slice(0, 97)}...` : cookie.value,
          truncated: size > 100
        };
      });

      // Process headers with size analysis and truncation
      const headerSizes = Object.entries(headersObj).map(([name, value]) => {
        const size = value.length;
        return {
          name,
          size,
          value: size > 100 ? `${value.slice(0, 97)}...` : value,
          truncated: size > 100
        };
      });

      // Calculate summary statistics
      const summary = {
        totalHeadersSize: headerSizes.reduce((sum, h) => sum + h.size, 0),
        totalCookiesSize: cookieSizes.reduce((sum, c) => sum + c.size, 0),
        headerCount: headerSizes.length,
        cookieCount: cookieSizes.length
      };

      return {
        data: {
          summary,
          cookies: cookieSizes,
          headers: headerSizes
        },
        error: null,
        status: HTTP_STATUS_OK,
        metadata: {
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<DebugHeadersResponse>;
    } catch (error) {
      throw new AppError(
        'Failed to analyze headers and cookies',
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        'Error processing request headers and cookies'
      );
    }
  }
}); 