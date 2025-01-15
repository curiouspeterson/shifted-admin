/**
 * API Documentation Generator
 * Last Updated: 2024-03
 * 
 * This module provides utilities for generating API documentation
 * from route handlers and schemas.
 */

import { createOpenAPIGenerator, RouteDocConfig } from './openapi';
import { defaultRateLimits } from './rate-limit';
import { defaultCacheConfig } from './cache';

// OpenAPI configuration
const openAPIConfig = {
  title: '24/7 Dispatch Center API',
  version: '1.0.0',
  description: `
    API for managing schedules, shifts, and employees in the 24/7 Dispatch Center.
    
    ## Authentication
    
    The API uses JWT Bearer authentication. Include the JWT token in the Authorization header:
    \`\`\`
    Authorization: Bearer <token>
    \`\`\`
    
    ## Rate Limiting
    
    The API implements rate limiting to prevent abuse. Rate limits are specified per endpoint.
    Rate limit information is included in the response headers:
    - X-RateLimit-Limit: Maximum requests per window
    - X-RateLimit-Remaining: Remaining requests in current window
    - X-RateLimit-Reset: Time when the rate limit resets
    
    ## Caching
    
    GET endpoints may implement caching to improve performance. Cache information is included
    in the response headers and metadata.
    
    ## Error Handling
    
    The API uses standard HTTP status codes and returns error responses in a consistent format:
    \`\`\`json
    {
      "error": "Error message",
      "data": null,
      "metadata": {
        "errorCode": "ERROR_CODE",
        "validation": {
          "field": ["Error message"]
        }
      }
    }
    \`\`\`
  `,
  servers: [
    {
      url: '/api',
      description: 'API endpoint',
    },
  ],
  tags: [
    {
      name: 'schedules',
      description: 'Schedule management endpoints',
    },
    {
      name: 'shifts',
      description: 'Shift management endpoints',
    },
    {
      name: 'employees',
      description: 'Employee management endpoints',
    },
  ],
};

/**
 * Generate documentation for schedules endpoints
 */
function generateSchedulesDocs(generator: ReturnType<typeof createOpenAPIGenerator>) {
  // GET /api/schedules
  generator.addRoute('/schedules', 'GET', {
    summary: 'List schedules',
    description: 'Retrieve a list of schedules with optional filtering and pagination.',
    tags: ['schedules'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // POST /api/schedules
  generator.addRoute('/schedules', 'POST', {
    summary: 'Create schedule',
    description: 'Create a new schedule.',
    tags: ['schedules'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });

  // GET /api/schedules/{id}
  generator.addRoute('/schedules/{id}', 'GET', {
    summary: 'Get schedule',
    description: 'Retrieve a specific schedule by ID.',
    tags: ['schedules'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // PUT /api/schedules/{id}
  generator.addRoute('/schedules/{id}', 'PUT', {
    summary: 'Update schedule',
    description: 'Update an existing schedule.',
    tags: ['schedules'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });

  // DELETE /api/schedules/{id}
  generator.addRoute('/schedules/{id}', 'DELETE', {
    summary: 'Delete schedule',
    description: 'Delete a schedule.',
    tags: ['schedules'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });
}

/**
 * Generate documentation for shifts endpoints
 */
function generateShiftsDocs(generator: ReturnType<typeof createOpenAPIGenerator>) {
  // GET /api/shifts
  generator.addRoute('/shifts', 'GET', {
    summary: 'List shifts',
    description: 'Retrieve a list of shifts with optional filtering and pagination.',
    tags: ['shifts'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // POST /api/shifts
  generator.addRoute('/shifts', 'POST', {
    summary: 'Create shift',
    description: 'Create a new shift.',
    tags: ['shifts'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
  });

  // GET /api/shifts/{id}
  generator.addRoute('/shifts/{id}', 'GET', {
    summary: 'Get shift',
    description: 'Retrieve a specific shift by ID.',
    tags: ['shifts'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // PUT /api/shifts/{id}
  generator.addRoute('/shifts/{id}', 'PUT', {
    summary: 'Update shift',
    description: 'Update an existing shift.',
    tags: ['shifts'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
  });

  // DELETE /api/shifts/{id}
  generator.addRoute('/shifts/{id}', 'DELETE', {
    summary: 'Delete shift',
    description: 'Delete a shift.',
    tags: ['shifts'],
    requireAuth: true,
    rateLimit: defaultRateLimits.api,
  });
}

/**
 * Generate documentation for employees endpoints
 */
function generateEmployeesDocs(generator: ReturnType<typeof createOpenAPIGenerator>) {
  // GET /api/employees
  generator.addRoute('/employees', 'GET', {
    summary: 'List employees',
    description: 'Retrieve a list of employees with optional filtering and pagination.',
    tags: ['employees'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // POST /api/employees
  generator.addRoute('/employees', 'POST', {
    summary: 'Create employee',
    description: 'Create a new employee.',
    tags: ['employees'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });

  // GET /api/employees/{id}
  generator.addRoute('/employees/{id}', 'GET', {
    summary: 'Get employee',
    description: 'Retrieve a specific employee by ID.',
    tags: ['employees'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
    cache: defaultCacheConfig,
  });

  // PUT /api/employees/{id}
  generator.addRoute('/employees/{id}', 'PUT', {
    summary: 'Update employee',
    description: 'Update an existing employee.',
    tags: ['employees'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });

  // DELETE /api/employees/{id}
  generator.addRoute('/employees/{id}', 'DELETE', {
    summary: 'Delete employee',
    description: 'Delete an employee.',
    tags: ['employees'],
    requireAuth: true,
    requireSupervisor: true,
    rateLimit: defaultRateLimits.api,
  });
}

/**
 * Generate complete API documentation
 */
export function generateApiDocs() {
  const generator = createOpenAPIGenerator(openAPIConfig);

  // Generate documentation for each endpoint group
  generateSchedulesDocs(generator);
  generateShiftsDocs(generator);
  generateEmployeesDocs(generator);

  return generator.getDocument();
} 