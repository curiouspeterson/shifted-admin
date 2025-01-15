# Implementation Plan - 24/7 Dispatch Center Scheduling App

<!--
Last Updated: 2024-01-15

This document outlines the implementation plan with example code and history of changes for improving code quality, maintainability,
consistency, and error handling in the 24/7 Dispatch Center Scheduling Application.

Status indicators:
✅ - Completed
⚡ - In Progress
⏳ - Not Started
-->

## Phase 1: Core Infrastructure
**Current Focus: Database Operations and Error Handling**

### Step 1: Project Structure ✅
**Status**: Completed January 2024
- [x] Created consistent directory structure
- [x] Implemented proper file naming conventions
- [x] Set up base configuration files
- [x] Organized components by feature
- [x] Separated server/client concerns

### Step 2: Form Logic and UI Components ✅
**Status**: Completed January 2024
- [x] Created base form components:
  - BaseForm for common form logic
  - SelectField for dropdowns
  - DateField for date inputs
  - TextareaField for text areas
- [x] Implemented form validation integration
- [x] Added proper error handling
- [x] Created reusable loading states
- [x] Refactored existing forms:
  - ScheduleForm
  - AssignmentForm
- [x] Added comprehensive documentation

### Step 3: Schema Definitions ✅
**Status**: Completed January 2024
- [x] Created schemas directory structure:
  ```
  app/lib/schemas/
  ├── base/          # Core data models
  │   ├── schedule.ts
  │   ├── assignment.ts
  │   ├── employee.ts
  │   ├── shift.ts
  │   └── index.ts
  ├── forms/         # Form validation
  │   ├── schedule.ts
  │   ├── assignment.ts
  │   └── index.ts
  └── index.ts
  ```
- [x] Implemented Zod schemas for:
  - Base data models
  - Form validation
  - API requests/responses
- [x] Added TypeScript type generation
- [x] Created centralized exports
- [x] Added schema documentation

### Step 4: Data Fetching ✅
**Status**: Completed January 2024
- [x] Implemented Supabase client configuration
- [x] Created database types from schemas
- [x] Developed base query hook (useQuery)
- [x] Created entity-specific hooks:
  ```typescript
  // Schedule hooks
  useSchedule(id)
  useSchedules({ status, startDate, endDate })
  createSchedule(data)
  updateSchedule(id, data)
  deleteSchedule(id)

  // Assignment hooks
  useAssignment(id)
  useScheduleAssignments(scheduleId, filters)
  createAssignment(data)
  updateAssignment(id, data)
  deleteAssignment(id)

  // Similar patterns for employees and shifts
  ```
- [x] Added proper error handling
- [x] Implemented loading states
- [x] Added type safety throughout

### Step 5: Database Operations Refactoring ✅
**Status**: Completed January 2024
**User Stories**:
- As a developer, I should be able to perform CRUD operations consistently across all entities
- As a developer, I should have proper transaction support for complex operations
- As a developer, I should have type-safe database operations

Tasks:
1. Base Infrastructure ✅
- [x] Create `DatabaseRecord` interface for common fields
- [x] Implement generic `DatabaseOperations<T>` interface
- [x] Create base repository class with common CRUD operations
- [x] Add transaction support utilities

2. Entity-Specific Operations ✅
- [x] Implement `ScheduleRepository` extending base repository
- [x] Implement `AssignmentRepository` extending base repository
- [x] Implement `EmployeeRepository` extending base repository
- [x] Implement `ShiftRepository` extending base repository

3. Transaction Support ✅
- [x] Create transaction manager utility
- [x] Implement rollback mechanisms
- [x] Add optimistic locking for concurrent modifications
- [x] Create transaction hooks for complex operations

4. Error Handling ✅
- [x] Define database-specific error types
- [x] Implement error mapping to application errors
- [x] Add retry mechanisms for transient failures
- [x] Create error logging utilities

5. Testing ✅
- [x] Set up testing infrastructure
- [x] Create test utilities and mocks
- [x] Add unit tests for base repository
- [x] Create integration tests for transactions
- [x] Test concurrent operations
- [x] Add performance benchmarks

## Phase 2: Error Handling and Logging
**Focus: Improve error handling and logging throughout the application**

### Step 6: Error Integration ✅
**Status**: Completed
**Added**: January 2024
**Last Updated**: January 15, 2025
**User Stories**:
- As a developer, I should have comprehensive error tracking
- As a user, I should see meaningful error messages
- As an administrator, I should be able to monitor and analyze errors

Tasks:
1. Error Handling Framework ✅
- [x] Define error types and hierarchy
- [x] Implement base error classes
- [x] Create error response formatting

2. Error Logging System ✅
- [x] Implement centralized error logger
- [x] Add severity levels
- [x] Create structured log format
- [x] Add request context tracking

3. Error Integration ✅
- [x] Update API handlers with error logging
- [x] Implement error severity mapping
- [x] Add error monitoring service integration (Sentry)
- [x] Configure Sentry for Next.js
- [x] Create error reporting dashboard

4. Client-Side Error Handling ✅
- [x] Implement error boundaries
- [x] Create error UI components
- [x] Add error recovery mechanisms
- [x] Implement retry logic for failed requests

Completed Features:
1. Error Monitoring
- Sentry integration for production error tracking
- Structured error logging with severity levels
- Request context tracking
- Error filtering and categorization

2. Error Reporting Dashboard
- Real-time error metrics and statistics
- Filterable error list with severity indicators
- Error trend visualization
- Error status tracking

3. Client-Side Error Handling
- React error boundaries with fallback UI
- Error recovery mechanisms
- Consistent error display components
- Error retry logic

Required Environment Variables:
- NEXT_PUBLIC_SENTRY_DSN: Sentry project DSN
- SENTRY_ORG: Sentry organization name (for source maps)
- SENTRY_PROJECT: Sentry project name (for source maps)
- SENTRY_AUTH_TOKEN: Sentry authentication token (for source maps)
- ENABLE_ERROR_REPORTING: Toggle for development error reporting

### Step 7: API Layer Enhancement
Status: In Progress (50%)
Last Updated: 2025-01-15

#### Completed Tasks
- Response Caching
  - ✅ Implemented Redis-based caching system with Upstash Redis
  - ✅ Added cache invalidation with tag-based invalidation
  - ✅ Configured cache TTLs and stale-while-revalidate
  - ✅ Added cache headers and cache hit/miss tracking
  - ✅ Created CacheService with proper dependency injection
  - ✅ Added environment variables for Redis configuration

- Request Validation
  - ✅ Integrated Zod schemas with route handlers
  - ✅ Added validation middleware for request body and query params
  - ✅ Implemented error handling for validation failures
  - ✅ Added type safety with inferred types from schemas

#### Implementation Details
1. API Exception Class
```typescript
// app/lib/api/exceptions.ts
export class ApiException extends Error {
  readonly isApiException = true;
  constructor(
    message: string,
    readonly statusCode: number = 400,
    readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
    // Ensure status code is in 4xx range
    this.statusCode = Math.max(400, Math.min(499, statusCode));
  }
}

export class ValidationException extends ApiException {
  constructor(message: string, data?: unknown) {
    super(message, 400, data);
    this.name = 'ValidationException';
  }
}

export class AuthenticationException extends ApiException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthenticationException';
  }
}

export class ForbiddenException extends ApiException {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends ApiException {
  constructor(message: string = 'Not Found') {
    super(message, 404);
    this.name = 'NotFoundException';
  }
}
```

2. Enhanced Route Handler
```typescript
// app/lib/api/handler.ts
import { HTTP_STATUS } from './constants';
import { ApiException } from './exceptions';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type HandlerFunction = (req: NextRequest, context: RouteContext) => Promise<unknown>;
type MethodHandlers = Partial<Record<HttpMethod, HandlerFunction>>;

export const createRouteHandler = (
  handlers: HandlerFunction | MethodHandlers
) => {
  return async (req: NextRequest, context: RouteContext) => {
    try {
      // Convert single handler to GET method handler
      const methodHandlers = typeof handlers === 'function' 
        ? { GET: handlers } 
        : handlers;

      // Check if method is supported
      const handler = methodHandlers[req.method as HttpMethod];
      if (!handler) {
        const allowed = Object.keys(methodHandlers);
        return NextResponse.json(
          { 
            error: `Method ${req.method} Not Allowed`,
            allowed 
          },
          { 
            status: 405,
            headers: { Allow: allowed.join(', ') }
          }
        );
      }

      // Execute handler
      const result = await handler(req, context);
      return NextResponse.json({ data: result, error: null });

    } catch (error) {
      // Handle known API exceptions
      if (error instanceof ApiException) {
        return NextResponse.json(
          { 
            error: error.message,
            code: error.statusCode,
            data: error.data 
          },
          { status: error.statusCode }
        );
      }

      // Log unknown errors
      console.error('Unhandled API error:', error);
      
      // Return generic error for unknown errors
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          code: 500
        },
        { status: 500 }
      );
    }
  };
};
```

3. Example Usage
```typescript
// app/api/schedules/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { 
  ValidationException,
  AuthenticationException,
  NotFoundException 
} from '@/lib/api/exceptions';
import { scheduleSchema } from '@/lib/schemas';

export const GET = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) {
    throw new AuthenticationException();
  }

  const { data, error } = await supabase
    .from('schedules')
    .select('*');

  if (error) throw new Error(error.message);
  return data;
});

export default createRouteHandler({
  // Get all schedules
  GET: async (req, { supabase, session }) => {
    if (!session) throw new AuthenticationException();
    // ... implementation
  },

  // Create new schedule
  POST: async (req, { supabase, session }) => {
    if (!session) throw new AuthenticationException();
    
    const body = await req.json();
    const result = scheduleSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationException('Invalid schedule data', result.error);
    }
    
    // ... implementation
  },

  // Update schedule
  PUT: async (req, { supabase, session }) => {
    if (!session) throw new AuthenticationException();
    
    const id = req.url.split('/').pop();
    if (!id) throw new ValidationException('Missing schedule ID');
    
    const { data } = await supabase
      .from('schedules')
      .select()
      .eq('id', id)
      .single();
      
    if (!data) throw new NotFoundException('Schedule not found');
    
    // ... implementation
  }
});
```

4. Next.js Error Handling
```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { captureError } from '@/lib/monitoring/sentry';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    captureError(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground">
          {process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request.'}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

// app/global-error.tsx
'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/monitoring/sentry';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Something went wrong!</h1>
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}

// app/not-found.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Resource Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested resource could not be found.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
```

5. Server Action Error Handling
```typescript
// app/lib/actions/schedules.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { scheduleSchema } from '@/lib/schemas';

export async function createSchedule(prevState: any, formData: FormData) {
  const validatedFields = scheduleSchema.safeParse({
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    employeeId: formData.get('employeeId'),
    shiftId: formData.get('shiftId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .insert(validatedFields.data);

    if (error) {
      return {
        message: 'Database Error: Failed to create schedule.',
      };
    }

    revalidatePath('/schedules');
    redirect('/schedules');
  } catch (error) {
    return {
      message: 'Server Error: Failed to create schedule.',
    };
  }
}
```

6. Error Handling in Server Components
```typescript
// app/schedules/page.tsx
import { notFound } from 'next/navigation';

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*');

  if (error) {
    // Log error and show error boundary
    throw new Error('Failed to fetch schedules');
  }

  if (!schedules?.length) {
    notFound();
  }

  return (
    <div>
      <ScheduleList schedules={schedules} />
    </div>
  );
}

// app/schedules/[id]/page.tsx
export default async function SchedulePage({ params }: { params: { id: string } }) {
  const { data: schedule } = await supabase
    .from('schedules')
    .select()
    .eq('id', params.id)
    .single();

  if (!schedule) {
    notFound();
  }

  return (
    <div>
      <ScheduleDetails schedule={schedule} />
    </div>
  );
}
```

7. Error Handling Best Practices
```typescript
// app/lib/errors/index.ts
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource could not be found.',
  VALIDATION: 'Please check your input and try again.',
  DATABASE: 'An error occurred while accessing the database.',
  SERVER: 'An unexpected error occurred. Please try again later.',
} as const;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiException) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Only show error message in development
    return process.env.NODE_ENV === 'development' 
      ? error.message 
      : ERROR_MESSAGES.SERVER;
  }
  
  return ERROR_MESSAGES.SERVER;
};
```

8. Rate Limiting Implementation
```typescript
// app/lib/rate-limit/types.ts
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyPrefix?: string;    // Redis key prefix
}

export interface RateLimitInfo {
  limit: number;         // Maximum requests allowed
  remaining: number;     // Remaining requests in window
  reset: number;         // Timestamp when the limit resets
}

// app/lib/rate-limit/redis.ts
import { Redis } from '@upstash/redis';
import { RateLimitConfig, RateLimitInfo } from './types';

export class RedisRateLimiter {
  private redis: Redis;

  constructor(
    private config: RateLimitConfig,
    redisUrl: string
  ) {
    this.redis = new Redis({
      url: redisUrl,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  }

  private getKey(identifier: string): string {
    return `${this.config.keyPrefix || 'rate-limit'}:${identifier}`;
  }

  async isRateLimited(identifier: string): Promise<RateLimitInfo> {
    const key = this.getKey(identifier);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use Redis sorted set to track requests
    const pipeline = this.redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Add current request
    pipeline.zadd(key, { score: now, member: now.toString() });
    // Set expiry
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));
    // Get request count
    pipeline.zcard(key);

    const [, , , requestCount] = await pipeline.exec();

    const remaining = Math.max(0, this.config.maxRequests - (requestCount as number));
    const reset = windowStart + this.config.windowMs;

    return {
      limit: this.config.maxRequests,
      remaining,
      reset,
    };
  }
}

// app/lib/rate-limit/middleware.ts
import { NextResponse } from 'next/server';
import { RedisRateLimiter } from './redis';
import { RateLimitConfig } from './types';
import { metrics } from '@vercel/analytics';

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,     // 60 requests per minute
  keyPrefix: 'api',
};

export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const limiter = new RedisRateLimiter(
    finalConfig,
    process.env.UPSTASH_REDIS_URL!
  );

  return async function rateLimitMiddleware(
    req: Request,
    context: { session?: { user?: { id: string } } }
  ) {
    // Get identifier (user ID or IP)
    const identifier = context.session?.user?.id || 
      req.headers.get('x-forwarded-for') ||
      'anonymous';

    try {
      const rateLimitInfo = await limiter.isRateLimited(identifier);

      // Track metrics
      metrics.gauge('rate_limit_remaining', rateLimitInfo.remaining, {
        identifier,
        endpoint: new URL(req.url).pathname,
      });

      // Add rate limit headers
      const headers = new Headers({
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
      });

      // Check if rate limited
      if (rateLimitInfo.remaining === 0) {
        return NextResponse.json(
          { 
            error: 'Too Many Requests',
            retryAfter: Math.ceil((rateLimitInfo.reset - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              ...Object.fromEntries(headers),
              'Retry-After': Math.ceil((rateLimitInfo.reset - Date.now()) / 1000).toString(),
            }
          }
        );
      }

      // Continue with added headers
      const response = await context.next();
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;

    } catch (error) {
      console.error('Rate limit error:', error);
      // Continue on rate limit errors
      return context.next();
    }
  };
}

// app/lib/rate-limit/config.ts
export const RATE_LIMIT_CONFIGS = {
  default: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 60,        // 60 requests per minute
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 requests per 15 minutes
  },
  api: {
    authenticated: {
      windowMs: 60 * 1000,    // 1 minute
      maxRequests: 120,       // 120 requests per minute
    },
    unauthenticated: {
      windowMs: 60 * 1000,    // 1 minute
      maxRequests: 30,        // 30 requests per minute
    }
  }
} as const;

// Example usage in route handler
// app/api/schedules/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { createRateLimitMiddleware } from '@/lib/rate-limit/middleware';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config';

const rateLimitMiddleware = createRateLimitMiddleware(
  RATE_LIMIT_CONFIGS.api.authenticated
);

export const GET = createRouteHandler(
  async (req, context) => {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(req, context);
    if (rateLimitResponse) return rateLimitResponse;

    // Continue with handler
    if (!context.session) {
      throw new AuthenticationException();
    }

    const { data, error } = await context.supabase
      .from('schedules')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }
);
```

9. Rate Limit Monitoring Dashboard
```typescript
// app/lib/monitoring/dashboards/rate-limit.ts
import { metrics } from '@vercel/analytics';

export interface RateLimitMetrics {
  totalRequests: number;
  limitedRequests: number;
  remainingQuota: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
  }>;
}

export async function getRateLimitMetrics(
  timeRange: { start: Date; end: Date }
): Promise<RateLimitMetrics> {
  const [
    totalRequests,
    limitedRequests,
    remainingQuota,
    topEndpoints
  ] = await Promise.all([
    metrics.query('rate_limit_requests_total', {
      start: timeRange.start,
      end: timeRange.end,
    }),
    metrics.query('rate_limit_requests_limited', {
      start: timeRange.start,
      end: timeRange.end,
    }),
    metrics.query('rate_limit_remaining', {
      start: timeRange.start,
      end: timeRange.end,
    }),
    metrics.query('rate_limit_requests_by_endpoint', {
      start: timeRange.start,
      end: timeRange.end,
      groupBy: ['endpoint'],
      limit: 10,
    }),
  ]);

  return {
    totalRequests: totalRequests.sum,
    limitedRequests: limitedRequests.sum,
    remainingQuota: remainingQuota.avg,
    topEndpoints: topEndpoints.series.map(s => ({
      endpoint: s.tags.endpoint,
      requests: s.sum,
    })),
  };
}
```

Required Environment Variables:
```env
# Rate Limiting
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
```

#### Remaining Tasks
- RESTful Endpoints (50% Complete)
  - ✅ Schedule Management API
    - [x] GET /api/schedules/conflicts - Check for scheduling conflicts
    - [x] GET /api/schedules/availability - Get employee availability
    - [x] POST /api/schedules/validate - Validate schedule against rules
    - [x] POST /api/schedules/optimize - Optimize schedule distribution
  - ⏳ Employee Management API
    - [ ] GET /api/employees/availability
    - [ ] POST /api/employees/preferences
    - [ ] GET /api/employees/workload
  - ⏳ Shift Management API
    - [ ] GET /api/shifts/templates
    - [ ] POST /api/shifts/rotate
    - [ ] GET /api/shifts/coverage

- Rate Limiting (Completed)
  - ✅ Implementation
    - [x] Configure Upstash Redis for rate limiting
    - [x] Create RateLimiter middleware class
    - [x] Implement token bucket algorithm
    - [x] Add per-route limit configuration
  - ✅ Monitoring
    - [x] Add rate limit metrics collection
    - [x] Create rate limit dashboard
    - [x] Set up alerts for limit breaches

Next Implementation:
1. Employee Management API
   - Availability tracking
   - Preference management
   - Workload monitoring
2. Shift Management API
   - Shift templates
   - Rotation patterns
   - Coverage analysis

### Step 8: UI Components Enhancement (75% Complete)
**Status**: In Progress
**Last Updated**: January 15, 2025

#### Completed Tasks
1. Core UI Components
   - [x] Card component with header, content, and footer sections
   - [x] Table component with sorting and responsive design
   - [x] Button component with variants and sizes
   - [x] Select component with custom styling
   - [x] Badge component for status indicators
   - [x] Calendar component for date selection
   - [x] Popover component for dropdowns
   - [x] Loading spinner for async operations
   - [x] Page header with actions

2. Schedule Management Components
   - [x] Schedule list page layout
   - [x] Schedule filters component
   - [x] Date range picker component
   - [x] Schedule list table component

#### Remaining Tasks
1. Component Testing Suite
   - [ ] Set up Jest and React Testing Library
   - [ ] Write tests for core UI components
   - [ ] Write tests for schedule management components
   - [ ] Add snapshot tests for visual regression

#### Notes
- All core UI components are now using shadcn/ui design system
- Components are fully typed with TypeScript
- Accessibility features implemented (ARIA labels, keyboard navigation)
- Responsive design implemented for all components

#### Next Steps
1. Set up testing infrastructure
2. Write component tests
3. Add visual regression tests
4. Document component usage and props

#### Component Testing Strategy
1. Unit Tests
   - [ ] Test component rendering
   - [ ] Test component interactions
   - [ ] Test error states
   - [ ] Test loading states

2. Integration Tests
   - [ ] Test component composition
   - [ ] Test data flow
   - [ ] Test state management
   - [ ] Test form submissions

3. Visual Regression Tests
   - [ ] Set up Chromatic
   - [ ] Create baseline snapshots
   - [ ] Automate visual testing in CI
   - [ ] Document visual testing process

4. Accessibility Tests
   - [ ] Set up axe-core
   - [ ] Create accessibility test suite
   - [ ] Test keyboard navigation
   - [ ] Test screen reader compatibility

## Phase 3: Integration and Testing
**Focus: Ensure robust integration and comprehensive testing**

### Step 9: Integration Layer ⚡
**Status**: In Progress
**Last Updated**: January 2024

#### State Management Implementation
1. React Query Setup
   ```typescript
   // app/lib/query/client.ts
   import { QueryClient } from '@tanstack/react-query';
   import { cache } from 'react';

   export const getQueryClient = cache(() => new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         gcTime: 10 * 60 * 1000,   // 10 minutes
         retry: 1,
         refetchOnWindowFocus: false,
       },
       mutations: {
         retry: 1,
       },
     },
   }));

   // app/providers.tsx
   import { QueryClientProvider } from '@tanstack/react-query';
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   import { getQueryClient } from '@/lib/query/client';

   export function Providers({ children }: { children: React.ReactNode }) {
     const queryClient = getQueryClient();

     return (
       <QueryClientProvider client={queryClient}>
         {children}
         {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
       </QueryClientProvider>
     );
   }
   ```

2. Custom Hooks Directory Structure
   ```
   app/lib/hooks/
   ├── schedules/
   │   ├── useSchedule.ts
   │   ├── useSchedules.ts
   │   └── useScheduleMutations.ts
   ├── employees/
   │   ├── useEmployee.ts
   │   ├── useEmployeeAvailability.ts
   │   └── useEmployeeWorkload.ts
   ├── shifts/
   │   ├── useShiftTemplates.ts
   │   ├── useShiftRotation.ts
   │   └── useShiftCoverage.ts
   └── index.ts
   ```

3. Example Hook Implementation
   ```typescript
   // app/lib/hooks/schedules/useSchedule.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { Schedule, ScheduleInput } from '@/lib/schemas';

   export const scheduleKeys = {
     all: ['schedules'] as const,
     lists: () => [...scheduleKeys.all, 'list'] as const,
     list: (filters: Record<string, any>) => [...scheduleKeys.lists(), filters] as const,
     details: () => [...scheduleKeys.all, 'detail'] as const,
     detail: (id: string) => [...scheduleKeys.details(), id] as const,
   };

   export function useSchedule(id: string) {
     return useQuery({
       queryKey: scheduleKeys.detail(id),
       queryFn: async () => {
         const res = await fetch(`/api/schedules/${id}`);
         if (!res.ok) throw new Error('Failed to fetch schedule');
         return res.json();
       },
     });
   }

   export function useScheduleMutations() {
     const queryClient = useQueryClient();

     const createSchedule = useMutation({
       mutationFn: async (data: ScheduleInput) => {
         const res = await fetch('/api/schedules', {
           method: 'POST',
           body: JSON.stringify(data),
         });
         if (!res.ok) throw new Error('Failed to create schedule');
         return res.json();
       },
       onSuccess: (newSchedule) => {
         queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
         queryClient.setQueryData(
           scheduleKeys.detail(newSchedule.id),
           newSchedule
         );
       },
     });

     const updateSchedule = useMutation({
       mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleInput> }) => {
         const res = await fetch(`/api/schedules/${id}`, {
           method: 'PUT',
           body: JSON.stringify(data),
         });
         if (!res.ok) throw new Error('Failed to update schedule');
         return res.json();
       },
       onSuccess: (updatedSchedule) => {
         queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
         queryClient.setQueryData(
           scheduleKeys.detail(updatedSchedule.id),
           updatedSchedule
         );
       },
     });

     return {
       createSchedule,
       updateSchedule,
     };
   }
   ```

4. Error Boundary Integration
   ```typescript
   // app/components/error-boundary.tsx
   'use client';
   
   import { useQueryErrorResetBoundary } from '@tanstack/react-query';
   import { ErrorBoundary } from 'react-error-boundary';

   export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
     const { reset } = useQueryErrorResetBoundary();

     return (
       <ErrorBoundary
         onReset={reset}
         fallbackRender={({ error, resetErrorBoundary }) => (
           <div className="p-4 rounded-md bg-red-50">
             <h3 className="text-sm font-medium text-red-800">
               Error: {error.message}
             </h3>
             <div className="mt-2">
               <button
                 onClick={resetErrorBoundary}
                 className="text-sm text-red-800 underline"
               >
                 Try again
               </button>
             </div>
           </div>
         )}
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```

5. Cache Management
   ```typescript
   // app/lib/query/cache.ts
   import { QueryClient } from '@tanstack/react-query';
   import { scheduleKeys } from '@/lib/hooks/schedules';
   import { employeeKeys } from '@/lib/hooks/employees';
   import { shiftKeys } from '@/lib/hooks/shifts';

   export function invalidateRelatedQueries(
     queryClient: QueryClient,
     entity: 'schedule' | 'employee' | 'shift',
     id?: string
   ) {
     switch (entity) {
       case 'schedule':
         queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
         if (id) {
           queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(id) });
         }
         // Invalidate related entities
         queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
         queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
         break;
       // ... similar cases for other entities
     }
   }

   export function prefetchSchedule(queryClient: QueryClient, id: string) {
     return queryClient.prefetchQuery({
       queryKey: scheduleKeys.detail(id),
       queryFn: async () => {
         const res = await fetch(`/api/schedules/${id}`);
         if (!res.ok) throw new Error('Failed to fetch schedule');
         return res.json();
       },
     });
   }
   ```

6. Real-time Updates
   ```typescript
   // app/lib/realtime/client.ts
   import { createClient } from '@supabase/supabase-js';
   import { QueryClient } from '@tanstack/react-query';
   import { scheduleKeys } from '@/lib/hooks/schedules';

   export function setupRealtimeSubscription(queryClient: QueryClient) {
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );

     // Subscribe to schedule changes
     supabase
       .channel('schedule-changes')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'schedules' },
         (payload) => {
           switch (payload.eventType) {
             case 'INSERT':
               queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
               break;
             case 'UPDATE':
               queryClient.invalidateQueries({ 
                 queryKey: scheduleKeys.detail(payload.new.id)
               });
               break;
             case 'DELETE':
               queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
               queryClient.removeQueries({ 
                 queryKey: scheduleKeys.detail(payload.old.id)
               });
               break;
           }
         }
       )
       .subscribe();

     return () => {
       supabase.removeAllChannels();
     };
   }
   ```

7. Optimistic Updates
   ```typescript
   // app/lib/hooks/schedules/useScheduleMutations.ts
   export function useScheduleOptimisticUpdate() {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
         const res = await fetch(`/api/schedules/${id}`, {
           method: 'PUT',
           body: JSON.stringify(data),
         });
         if (!res.ok) throw new Error('Failed to update schedule');
         return res.json();
       },
       onMutate: async ({ id, data }) => {
         // Cancel outgoing refetches
         await queryClient.cancelQueries({ queryKey: scheduleKeys.detail(id) });

         // Snapshot previous value
         const previousSchedule = queryClient.getQueryData<Schedule>(
           scheduleKeys.detail(id)
         );

         // Optimistically update
         queryClient.setQueryData<Schedule>(scheduleKeys.detail(id), (old) => ({
           ...old!,
           ...data,
         }));

         return { previousSchedule };
       },
       onError: (err, { id }, context) => {
         // Rollback on error
         queryClient.setQueryData(
           scheduleKeys.detail(id),
           context?.previousSchedule
         );
       },
       onSettled: (data, error, { id }) => {
         // Always refetch after error or success
         queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(id) });
       },
     });
   }
   ```

8. Employee Hooks Implementation
   ```typescript
   // app/lib/hooks/employees/useEmployee.ts
   import { useQuery } from '@tanstack/react-query';
   import type { Employee } from '@/lib/schemas';

   export const employeeKeys = {
     all: ['employees'] as const,
     lists: () => [...employeeKeys.all, 'list'] as const,
     list: (filters: Record<string, any>) => [...employeeKeys.lists(), filters] as const,
     details: () => [...employeeKeys.all, 'detail'] as const,
     detail: (id: string) => [...employeeKeys.details(), id] as const,
     availability: () => [...employeeKeys.all, 'availability'] as const,
     workload: () => [...employeeKeys.all, 'workload'] as const,
   };

   export function useEmployeeAvailability(
     employeeId: string,
     startDate: Date,
     endDate: Date
   ) {
     return useQuery({
       queryKey: [...employeeKeys.availability(), employeeId, startDate, endDate],
       queryFn: async () => {
         const params = new URLSearchParams({
           employeeId,
           startDate: startDate.toISOString(),
           endDate: endDate.toISOString(),
         });
         const res = await fetch(`/api/employees/availability?${params}`);
         if (!res.ok) throw new Error('Failed to fetch availability');
         return res.json();
       },
     });
   }

   export function useEmployeeWorkload(employeeId: string) {
     return useQuery({
       queryKey: [...employeeKeys.workload(), employeeId],
       queryFn: async () => {
         const res = await fetch(`/api/employees/workload?employeeId=${employeeId}`);
         if (!res.ok) throw new Error('Failed to fetch workload');
         return res.json();
       },
       // Update every minute to keep workload current
       refetchInterval: 60 * 1000,
     });
   }

   export function useEmployeeMutations() {
     const queryClient = useQueryClient();

     const updatePreferences = useMutation({
       mutationFn: async ({ 
         employeeId, 
         preferences 
       }: { 
         employeeId: string; 
         preferences: EmployeePreference 
       }) => {
         const res = await fetch('/api/employees/preferences', {
           method: 'POST',
           body: JSON.stringify({ employeeId, ...preferences }),
         });
         if (!res.ok) throw new Error('Failed to update preferences');
         return res.json();
       },
       onSuccess: (data, { employeeId }) => {
         queryClient.invalidateQueries({ 
           queryKey: employeeKeys.detail(employeeId)
         });
       },
     });

     return { updatePreferences };
   }
   ```

9. Shift Hooks Implementation
   ```typescript
   // app/lib/hooks/shifts/useShift.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import type { ShiftTemplate, ShiftRotation, CoverageReport } from '@/lib/schemas';

   export const shiftKeys = {
     all: ['shifts'] as const,
     templates: () => [...shiftKeys.all, 'templates'] as const,
     template: (id: string) => [...shiftKeys.templates(), id] as const,
     coverage: () => [...shiftKeys.all, 'coverage'] as const,
   };

   export function useShiftTemplates(activeOnly: boolean = true) {
     return useQuery({
       queryKey: [...shiftKeys.templates(), { activeOnly }],
       queryFn: async () => {
         const res = await fetch(`/api/shifts/templates?active=${activeOnly}`);
         if (!res.ok) throw new Error('Failed to fetch templates');
         return res.json();
       },
     });
   }

   export function useShiftCoverage(
     startDate: Date,
     endDate: Date,
     shiftTemplateId?: string
   ) {
     return useQuery({
       queryKey: [...shiftKeys.coverage(), startDate, endDate, shiftTemplateId],
       queryFn: async () => {
         const params = new URLSearchParams({
           startDate: startDate.toISOString(),
           endDate: endDate.toISOString(),
           ...(shiftTemplateId && { shiftTemplateId }),
         });
         const res = await fetch(`/api/shifts/coverage?${params}`);
         if (!res.ok) throw new Error('Failed to fetch coverage');
         return res.json();
       },
       // Refresh coverage data every 5 minutes
       refetchInterval: 5 * 60 * 1000,
     });
   }

   export function useShiftMutations() {
     const queryClient = useQueryClient();

     const rotateShifts = useMutation({
       mutationFn: async (rotation: ShiftRotation) => {
         const res = await fetch('/api/shifts/rotate', {
           method: 'POST',
           body: JSON.stringify(rotation),
         });
         if (!res.ok) throw new Error('Failed to rotate shifts');
         return res.json();
       },
       onSuccess: (data, variables) => {
         // Invalidate affected queries
         queryClient.invalidateQueries({ 
           queryKey: shiftKeys.coverage()
         });
         queryClient.invalidateQueries({
           queryKey: ['schedules']
         });
       },
     });

     return { rotateShifts };
   }
   ```

10. Real-time Subscriptions Setup
    ```typescript
    // app/lib/realtime/subscriptions.ts
    import { QueryClient } from '@tanstack/react-query';
    import { createClient } from '@supabase/supabase-js';
    import { employeeKeys } from '../hooks/employees';
    import { shiftKeys } from '../hooks/shifts';
    import { scheduleKeys } from '../hooks/schedules';

    export function setupEntitySubscriptions(queryClient: QueryClient) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Employee changes
      supabase
        .channel('employee-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'employees' },
          (payload) => {
            switch (payload.eventType) {
              case 'UPDATE':
                queryClient.invalidateQueries({
                  queryKey: employeeKeys.detail(payload.new.id)
                });
                break;
              case 'INSERT':
              case 'DELETE':
                queryClient.invalidateQueries({
                  queryKey: employeeKeys.lists()
                });
                break;
            }
          }
        )
        .subscribe();

      // Shift template changes
      supabase
        .channel('shift-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'shift_templates' },
          (payload) => {
            queryClient.invalidateQueries({
              queryKey: shiftKeys.templates()
            });
          }
        )
        .subscribe();

      // Schedule assignment changes
      supabase
        .channel('assignment-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'schedule_assignments' },
          (payload) => {
            // Invalidate affected queries
            queryClient.invalidateQueries({
              queryKey: scheduleKeys.lists()
            });
            queryClient.invalidateQueries({
              queryKey: employeeKeys.workload()
            });
            queryClient.invalidateQueries({
              queryKey: shiftKeys.coverage()
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeAllChannels();
      };
    }
    ```

11. Hook Usage Examples
    ```typescript
    // app/components/employee-schedule.tsx
    'use client';

    export function EmployeeSchedule({ employeeId }: { employeeId: string }) {
      const startDate = startOfWeek(new Date());
      const endDate = endOfWeek(new Date());

      const { data: availability } = useEmployeeAvailability(
        employeeId,
        startDate,
        endDate
      );

      const { data: workload } = useEmployeeWorkload(employeeId);

      const { data: coverage } = useShiftCoverage(startDate, endDate);

      if (!availability || !workload || !coverage) {
        return <LoadingSpinner />;
      }

      return (
        <div>
          <WorkloadIndicator workload={workload} />
          <AvailabilityCalendar availability={availability} />
          <CoverageChart coverage={coverage} />
        </div>
      );
    }
    ```

Next Steps:
1. Implement remaining UI components using these hooks
2. Add error handling and loading states
3. Set up offline support
4. Add performance monitoring

## Phase 4: Deployment and Monitoring ⏳
**Status**: Not Started
**Added**: January 2024

### Step 11: CI/CD Pipeline
1. Build Pipeline
   - [ ] Configure build optimization
   - [ ] Set up dependency caching
   - [ ] Add build validation
   - [ ] Implement version tagging

2. Deployment Pipeline
   - [ ] Configure Vercel deployment
   - [ ] Set up staging environment
   - [ ] Add deployment validation
   - [ ] Implement rollback capability

### Step 12: Monitoring and Analytics
1. Performance Monitoring
   - [ ] Set up Vercel Analytics
   - [ ] Configure custom metrics
   - [ ] Create performance dashboards
   - [ ] Set up alerting

2. Error Tracking
   - [ ] Enhance Sentry configuration
   - [ ] Add custom error contexts
   - [ ] Create error dashboards
   - [ ] Set up error alerting

3. Usage Analytics
   - [ ] Implement Posthog
   - [ ] Create conversion funnels
   - [ ] Set up user journey tracking
   - [ ] Add custom events

#### Implementation Details
1. Error Tracking Setup
```typescript
// app/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
      }
      return event;
    },
  });
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
};
```

2. Performance Monitoring
```typescript
// app/lib/monitoring/metrics.ts
import { metrics } from '@vercel/analytics';

export const trackPageLoad = (route: string, loadTime: number) => {
  metrics.gauge('page_load_time', loadTime, {
    route,
    timestamp: Date.now(),
  });
};

export const trackApiLatency = (endpoint: string, latency: number) => {
  metrics.gauge('api_latency', latency, {
    endpoint,
    timestamp: Date.now(),
  });
};
```

3. Usage Analytics
```typescript
// app/lib/monitoring/analytics.ts
import posthog from 'posthog-js';

export const initializePosthog = () => {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // We'll handle this manually
  });
};

export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  posthog.capture(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
};

export const trackPageView = (url: string) => {
  posthog.capture('$pageview', {
    url,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  });
};
```

Required Environment Variables:
```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Next Steps
1. Complete API Layer Enhancement (Step 7)
2. Finish UI Components and Testing (Step 8)
3. Begin Integration Layer implementation (Step 9)
4. Set up initial testing infrastructure (Step 10)

## Notes
- All new file updates must include timestamp in header comments
- Follow established patterns for new components
- Maintain type safety throughout the codebase
- Document all major changes
- Regular testing throughout development
- Keep implementation plan updated with current status

10. Employee Management API Implementation
```typescript
// app/lib/api/repositories/employee.ts
export interface EmployeeAvailability {
  employeeId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface EmployeePreference {
  employeeId: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  priority: 1 | 2 | 3;
  maxHoursPerWeek: number;
  preferredDays: number[];
  roles: string[];
}

export interface EmployeeWorkload {
  employeeId: string;
  currentHours: number;
  maxHours: number;
  overtimeHours: number;
  consecutiveDays: number;
  upcomingTimeOff: Array<{
    startDate: Date;
    endDate: Date;
    type: string;
  }>;
}

export class EmployeeRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAvailability(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmployeeAvailability[]> {
    // Get base availability
    const { data: baseAvailability } = await this.supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employeeId);

    // Get time off requests
    const { data: timeOff } = await this.supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'APPROVED')
      .overlaps('start_date', 'end_date', startDate, endDate);

    // Get existing assignments
    const { data: assignments } = await this.supabase
      .from('schedule_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .overlaps('start_date', 'end_date', startDate, endDate);

    // Combine all data to create availability windows
    const availability: EmployeeAvailability[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      const baseDay = baseAvailability?.find(a => a.day_of_week === dayOfWeek);

      if (baseDay) {
        const isTimeOff = timeOff?.some(t => 
          current >= new Date(t.start_date) && 
          current <= new Date(t.end_date)
        );

        const hasAssignment = assignments?.some(a =>
          current >= new Date(a.start_date) &&
          current <= new Date(a.end_date)
        );

        availability.push({
          employeeId,
          dayOfWeek,
          startTime: baseDay.start_time,
          endTime: baseDay.end_time,
          isAvailable: !isTimeOff && !hasAssignment,
          reason: isTimeOff ? 'Time off' : 
                 hasAssignment ? 'Scheduled shift' : 
                 undefined
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return availability;
  }

  async updatePreferences(
    employeeId: string,
    preferences: Omit<EmployeePreference, 'employeeId'>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('employee_preferences')
      .upsert({
        employee_id: employeeId,
        shift_type: preferences.shiftType,
        priority: preferences.priority,
        max_hours_per_week: preferences.maxHoursPerWeek,
        preferred_days: preferences.preferredDays,
        roles: preferences.roles,
      });

    if (error) throw new DatabaseError(error.message);
  }

  async getWorkload(employeeId: string): Promise<EmployeeWorkload> {
    // Get current week's assignments
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    const { data: assignments } = await this.supabase
      .from('schedule_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .overlaps('start_date', 'end_date', weekStart, weekEnd);

    // Calculate hours
    let currentHours = 0;
    let overtimeHours = 0;
    let consecutiveDays = 0;
    
    if (assignments) {
      // Sort assignments by date
      const sortedAssignments = assignments.sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      // Calculate hours and consecutive days
      let lastDate: Date | null = null;
      
      for (const assignment of sortedAssignments) {
        const start = new Date(assignment.start_date);
        const end = new Date(assignment.end_date);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        currentHours += hours;

        if (lastDate) {
          const dayDiff = differenceInDays(start, lastDate);
          if (dayDiff === 1) {
            consecutiveDays++;
          } else {
            consecutiveDays = 1;
          }
        } else {
          consecutiveDays = 1;
        }
        
        lastDate = start;
      }
    }

    // Get employee preferences for max hours
    const { data: preferences } = await this.supabase
      .from('employee_preferences')
      .select('max_hours_per_week')
      .eq('employee_id', employeeId)
      .single();

    const maxHours = preferences?.max_hours_per_week || 40;
    overtimeHours = Math.max(0, currentHours - maxHours);

    // Get upcoming time off
    const { data: timeOff } = await this.supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'APPROVED')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(5);

    return {
      employeeId,
      currentHours,
      maxHours,
      overtimeHours,
      consecutiveDays,
      upcomingTimeOff: timeOff?.map(t => ({
        startDate: new Date(t.start_date),
        endDate: new Date(t.end_date),
        type: t.type,
      })) || [],
    };
  }
}

// app/api/employees/availability/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { EmployeeRepository } from '@/lib/api/repositories/employee';

export const GET = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (!employeeId || !startDate || !endDate) {
    throw new ValidationException('Missing required parameters');
  }

  const repo = new EmployeeRepository(supabase);
  
  const availability = await repo.getAvailability(
    employeeId,
    new Date(startDate),
    new Date(endDate)
  );

  return availability;
});

// app/api/employees/preferences/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { EmployeeRepository } from '@/lib/api/repositories/employee';
import { employeePreferenceSchema } from '@/lib/schemas';

export const POST = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const body = await req.json();
  const result = employeePreferenceSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationException('Invalid preference data', result.error);
  }

  const repo = new EmployeeRepository(supabase);
  await repo.updatePreferences(result.data.employeeId, result.data);

  return { success: true };
});

// app/api/employees/workload/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { EmployeeRepository } from '@/lib/api/repositories/employee';

export const GET = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');

  if (!employeeId) {
    throw new ValidationException('Missing employee ID');
  }

  const repo = new EmployeeRepository(supabase);
  const workload = await repo.getWorkload(employeeId);

  return workload;
});
```

#### Remaining Tasks
- RESTful Endpoints (75% Complete)
  - ✅ Schedule Management API
    - [x] GET /api/schedules/conflicts - Check for scheduling conflicts
    - [x] GET /api/schedules/availability - Get employee availability
    - [x] POST /api/schedules/validate - Validate schedule against rules
    - [x] POST /api/schedules/optimize - Optimize schedule distribution
  - ✅ Employee Management API
    - [x] GET /api/employees/availability
    - [x] POST /api/employees/preferences
    - [x] GET /api/employees/workload
  - ⏳ Shift Management API
    - [ ] GET /api/shifts/templates
    - [ ] POST /api/shifts/rotate
    - [ ] GET /api/shifts/coverage

Next Implementation:
1. Shift Management API
   - Shift template management
   - Rotation pattern handling
   - Coverage analysis and reporting

11. Shift Management API Implementation
```typescript
// app/lib/api/repositories/shift.ts
export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  requiredRoles: Array<{
    role: string;
    count: number;
  }>;
  breakDuration: number;
  isActive: boolean;
}

export interface ShiftRotation {
  employeeId: string;
  shiftTemplateId: string;
  startDate: Date;
  endDate: Date;
  rotationType: 'FORWARD' | 'BACKWARD';
  daysToRotate: number;
}

export interface CoverageReport {
  date: Date;
  shift: ShiftTemplate;
  required: number;
  scheduled: number;
  coverage: number;
  missingRoles: string[];
}

export class ShiftRepository {
  constructor(private supabase: SupabaseClient) {}

  async getTemplates(active: boolean = true): Promise<ShiftTemplate[]> {
    const { data, error } = await this.supabase
      .from('shift_templates')
      .select('*')
      .eq('is_active', active);

    if (error) throw new DatabaseError(error.message);
    return data;
  }

  async rotateShifts(rotation: ShiftRotation): Promise<void> {
    const { employeeId, shiftTemplateId, startDate, endDate, rotationType, daysToRotate } = rotation;

    // Get current assignments
    const { data: currentAssignments } = await this.supabase
      .from('schedule_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .overlaps('start_date', 'end_date', startDate, endDate)
      .order('start_date', { ascending: true });

    if (!currentAssignments?.length) {
      throw new ValidationException('No assignments found for rotation');
    }

    // Calculate new dates based on rotation
    const assignments = currentAssignments.map(assignment => {
      const start = new Date(assignment.start_date);
      const end = new Date(assignment.end_date);

      if (rotationType === 'FORWARD') {
        start.setDate(start.getDate() + daysToRotate);
        end.setDate(end.getDate() + daysToRotate);
      } else {
        start.setDate(start.getDate() - daysToRotate);
        end.setDate(end.getDate() - daysToRotate);
      }

      return {
        ...assignment,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };
    });

    // Update assignments in transaction
    const { error } = await this.supabase.rpc('rotate_shifts', {
      employee_id: employeeId,
      shift_template_id: shiftTemplateId,
      assignments: assignments,
    });

    if (error) throw new DatabaseError(error.message);
  }

  async getCoverage(
    startDate: Date,
    endDate: Date,
    shiftTemplateId?: string
  ): Promise<CoverageReport[]> {
    // Get shift templates
    const { data: templates } = await this.supabase
      .from('shift_templates')
      .select('*')
      .eq('is_active', true)
      .conditionalFilter('id', shiftTemplateId, !!shiftTemplateId);

    if (!templates?.length) {
      throw new NotFoundException('No active shift templates found');
    }

    const reports: CoverageReport[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      for (const template of templates) {
        // Get scheduled employees for this shift
        const { data: scheduled } = await this.supabase
          .from('schedule_assignments')
          .select(`
            *,
            employees:employee_id (
              roles
            )
          `)
          .eq('shift_template_id', template.id)
          .overlaps(
            'start_date',
            'end_date',
            current.toISOString(),
            new Date(current.getTime() + 24 * 60 * 60 * 1000).toISOString()
          );

        // Calculate coverage
        const scheduledRoles = scheduled?.reduce((acc, assignment) => {
          const roles = assignment.employees?.roles || [];
          roles.forEach(role => {
            acc[role] = (acc[role] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>) || {};

        const missingRoles = template.requiredRoles
          .filter(required => 
            (scheduledRoles[required.role] || 0) < required.count
          )
          .map(r => r.role);

        reports.push({
          date: new Date(current),
          shift: template,
          required: template.requiredRoles.reduce((sum, r) => sum + r.count, 0),
          scheduled: scheduled?.length || 0,
          coverage: scheduled ? 
            (scheduled.length / template.requiredRoles.reduce((sum, r) => sum + r.count, 0)) * 100 :
            0,
          missingRoles,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return reports;
  }
}

// app/api/shifts/templates/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { ShiftRepository } from '@/lib/api/repositories/shift';

export const GET = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const url = new URL(req.url);
  const activeOnly = url.searchParams.get('active') !== 'false';

  const repo = new ShiftRepository(supabase);
  const templates = await repo.getTemplates(activeOnly);

  return templates;
});

// app/api/shifts/rotate/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { ShiftRepository } from '@/lib/api/repositories/shift';
import { shiftRotationSchema } from '@/lib/schemas';

export const POST = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const body = await req.json();
  const result = shiftRotationSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationException('Invalid rotation data', result.error);
  }

  const repo = new ShiftRepository(supabase);
  await repo.rotateShifts(result.data);

  return { success: true };
});

// app/api/shifts/coverage/route.ts
import { createRouteHandler } from '@/lib/api/handler';
import { ShiftRepository } from '@/lib/api/repositories/shift';

export const GET = createRouteHandler(async (req, { supabase, session }) => {
  if (!session) throw new AuthenticationException();

  const url = new URL(req.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const shiftTemplateId = url.searchParams.get('shiftTemplateId');

  if (!startDate || !endDate) {
    throw new ValidationException('Missing date range parameters');
  }

  const repo = new ShiftRepository(supabase);
  const coverage = await repo.getCoverage(
    new Date(startDate),
    new Date(endDate),
    shiftTemplateId || undefined
  );

  return coverage;
});
```

#### Remaining Tasks
- RESTful Endpoints (100% Complete)
  - ✅ Schedule Management API
    - [x] GET /api/schedules/conflicts - Check for scheduling conflicts
    - [x] GET /api/schedules/availability - Get employee availability
    - [x] POST /api/schedules/validate - Validate schedule against rules
    - [x] POST /api/schedules/optimize - Optimize schedule distribution
  - ✅ Employee Management API
    - [x] GET /api/employees/availability
    - [x] POST /api/employees/preferences
    - [x] GET /api/employees/workload
  - ✅ Shift Management API
    - [x] GET /api/shifts/templates
    - [x] POST /api/shifts/rotate
    - [x] GET /api/shifts/coverage

Next Implementation:
1. Integration Layer (Step 9)
   - React Query setup
   - Caching strategy
   - Real-time updates
   - Optimistic updates