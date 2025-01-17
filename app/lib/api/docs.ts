/**
 * API Documentation Utilities
 * Last Updated: 2024-03-21
 * 
 * Utilities for generating and serving API documentation.
 */

import { createRateLimiter, defaultRateLimits } from '@/lib/api/rate-limit';

// Create rate limiter for documentation endpoints
const rateLimiter = createRateLimiter(defaultRateLimits.api);

/**
 * Generates OpenAPI documentation for the API
 */
export async function generateApiDocs() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Shifted API',
      version: '1.0.0',
      description: 'API for managing employee schedules and shifts',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
        description: 'API Server',
      },
    ],
    paths: {
      '/api/schedules': {
        get: {
          summary: 'List schedules',
          description: 'Returns a list of schedules',
          responses: {
            '200': {
              description: 'List of schedules',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Schedule',
                    },
                  },
                },
              },
            },
          },
        },
      },
      // Add more paths here
    },
    components: {
      schemas: {
        Schedule: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            startDate: {
              type: 'string',
              format: 'date',
            },
            endDate: {
              type: 'string',
              format: 'date',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'archived'],
            },
          },
          required: ['id', 'title', 'startDate', 'endDate', 'status'],
        },
        // Add more schemas here
      },
    },
  };
}

export { rateLimiter }; 