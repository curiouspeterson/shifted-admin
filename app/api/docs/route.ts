/**
 * API Documentation Route
 * Last Updated: 2024-03
 * 
 * This route serves the OpenAPI documentation for the API.
 */

import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/lib/api/handler';
import { generateApiDocs } from '@/lib/api/docs';
import { cacheConfigs } from '@/lib/api/cache';

// Cache configuration for docs
const docsCacheConfig = {
  ...cacheConfigs.long,
  prefix: 'api:docs',
};

// GET /api/docs
export const GET = createRouteHandler({
  methods: ['GET'],
  cache: docsCacheConfig,
  cors: true,
  handler: async () => {
    const docs = generateApiDocs();

    return {
      data: docs,
      error: null,
      status: 200,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  },
}); 