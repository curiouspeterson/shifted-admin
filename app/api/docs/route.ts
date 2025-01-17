/**
 * API Documentation Route Handler
 * Last Updated: 2025-01-17
 * 
 * Serves API documentation with proper caching and rate limiting.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { cacheConfigs } from '@/lib/cache'
import { NextResponse } from 'next/server'

// Rate limiter: 100 requests per minute
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'docs'
})

// Cache configuration for docs
const docsCacheConfig = {
  ...cacheConfigs.static,
  prefix: 'api:docs',
}

interface ApiDoc {
  title: string
  description: string
  version: string
  endpoints: Array<{
    path: string
    method: string
    description: string
    auth: boolean
    rateLimit?: {
      points: number
      duration: number
    }
  }>
}

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async () => {
    const docs: ApiDoc = {
      title: 'Shifted Admin API',
      description: 'API documentation for the Shifted Admin system',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/auth/sign-in',
          method: 'POST',
          description: 'Authenticate a user',
          auth: false,
          rateLimit: {
            points: 5,
            duration: 900 // 15 minutes
          }
        },
        {
          path: '/api/auth/sign-out',
          method: 'POST',
          description: 'Sign out a user',
          auth: true,
          rateLimit: {
            points: 5,
            duration: 900
          }
        },
        {
          path: '/api/availability',
          method: 'GET',
          description: 'Get employee availability',
          auth: true,
          rateLimit: {
            points: 100,
            duration: 60
          }
        }
      ]
    }

    return NextResponse.json<ApiResponse<ApiDoc>>(
      { data: docs },
      {
        headers: {
          'Cache-Control': docsCacheConfig.control
        }
      }
    )
  }
}) 