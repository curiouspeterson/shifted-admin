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

12. Enhanced Real-time Subscriptions
    ```typescript
    // app/lib/realtime/subscription-manager.ts
    import { QueryClient } from '@tanstack/react-query';
    import { createClient, SupabaseClient } from '@supabase/supabase-js';
    import { employeeKeys, scheduleKeys, shiftKeys } from '@/lib/hooks';
    import { toast } from '@/components/ui/toast';

    export class SubscriptionManager {
      private supabase: SupabaseClient;
      private queryClient: QueryClient;
      private subscriptions: Array<() => void> = [];

      constructor(queryClient: QueryClient) {
        this.queryClient = queryClient;
        this.supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
      }

      initialize() {
        this.subscribeToSchedules();
        this.subscribeToEmployees();
        this.subscribeToShifts();
        this.subscribeToAssignments();
      }

      private subscribeToSchedules() {
        const channel = this.supabase
          .channel('schedule-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'schedules' },
            async (payload) => {
              switch (payload.eventType) {
                case 'INSERT':
                  this.queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
                  toast.success('New schedule created');
                  break;
                case 'UPDATE':
                  await Promise.all([
                    this.queryClient.invalidateQueries({ 
                      queryKey: scheduleKeys.detail(payload.new.id)
                    }),
                    this.queryClient.invalidateQueries({
                      queryKey: employeeKeys.workload()
                    })
                  ]);
                  toast.success('Schedule updated');
                  break;
                case 'DELETE':
                  this.queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
                  this.queryClient.removeQueries({ 
                    queryKey: scheduleKeys.detail(payload.old.id)
                  });
                  toast.info('Schedule deleted');
                  break;
              }
            }
          )
          .subscribe();

        this.subscriptions.push(() => channel.unsubscribe());
      }

      private subscribeToEmployees() {
        const channel = this.supabase
          .channel('employee-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'employees' },
            async (payload) => {
              switch (payload.eventType) {
                case 'UPDATE':
                  await Promise.all([
                    this.queryClient.invalidateQueries({
                      queryKey: employeeKeys.detail(payload.new.id)
                    }),
                    this.queryClient.invalidateQueries({
                      queryKey: employeeKeys.availability()
                    })
                  ]);
                  break;
                case 'INSERT':
                case 'DELETE':
                  this.queryClient.invalidateQueries({
                    queryKey: employeeKeys.lists()
                  });
                  break;
              }
            }
          )
          .subscribe();

        this.subscriptions.push(() => channel.unsubscribe());
      }

      private subscribeToShifts() {
        const channel = this.supabase
          .channel('shift-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'shift_templates' },
            async (payload) => {
              await Promise.all([
                this.queryClient.invalidateQueries({
                  queryKey: shiftKeys.templates()
                }),
                this.queryClient.invalidateQueries({
                  queryKey: shiftKeys.coverage()
                })
              ]);
            }
          )
          .subscribe();

        this.subscriptions.push(() => channel.unsubscribe());
      }

      private subscribeToAssignments() {
        const channel = this.supabase
          .channel('assignment-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'schedule_assignments' },
            async (payload) => {
              await Promise.all([
                this.queryClient.invalidateQueries({
                  queryKey: scheduleKeys.lists()
                }),
                this.queryClient.invalidateQueries({
                  queryKey: employeeKeys.workload()
                }),
                this.queryClient.invalidateQueries({
                  queryKey: shiftKeys.coverage()
                })
              ]);
              
              // Show toast notification
              const action = payload.eventType === 'INSERT' ? 'created' :
                           payload.eventType === 'UPDATE' ? 'updated' :
                           'deleted';
              toast.success(`Assignment ${action}`);
            }
          )
          .subscribe();

        this.subscriptions.push(() => channel.unsubscribe());
      }

      cleanup() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
      }
    }

    // app/providers.tsx
    'use client';

    import { QueryClientProvider } from '@tanstack/react-query';
    import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
    import { useEffect } from 'react';
    import { getQueryClient } from '@/lib/query/client';
    import { SubscriptionManager } from '@/lib/realtime/subscription-manager';

    export function Providers({ children }: { children: React.ReactNode }) {
      const queryClient = getQueryClient();

      useEffect(() => {
        const manager = new SubscriptionManager(queryClient);
        manager.initialize();
        return () => manager.cleanup();
      }, [queryClient]);

      return (
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </QueryClientProvider>
      );
    }
    ```

13. Enhanced Hooks with Optimistic Updates
    ```typescript
    // app/lib/hooks/schedules/useScheduleAssignment.ts
    import { useMutation, useQueryClient } from '@tanstack/react-query';
    import { scheduleKeys, employeeKeys, shiftKeys } from '@/lib/hooks/keys';
    import type { ScheduleAssignment } from '@/lib/schemas';

    export function useScheduleAssignment() {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: async (assignment: ScheduleAssignment) => {
          const res = await fetch('/api/schedules/assignments', {
            method: 'POST',
            body: JSON.stringify(assignment),
          });
          if (!res.ok) throw new Error('Failed to create assignment');
          return res.json();
        },
        onMutate: async (newAssignment) => {
          // Cancel outgoing refetches
          await Promise.all([
            queryClient.cancelQueries({ queryKey: scheduleKeys.detail(newAssignment.scheduleId) }),
            queryClient.cancelQueries({ queryKey: employeeKeys.workload() }),
            queryClient.cancelQueries({ queryKey: shiftKeys.coverage() })
          ]);

          // Snapshot previous values
          const previousSchedule = queryClient.getQueryData(
            scheduleKeys.detail(newAssignment.scheduleId)
          );

          // Optimistically update schedule
          queryClient.setQueryData(
            scheduleKeys.detail(newAssignment.scheduleId),
            (old: any) => ({
              ...old,
              assignments: [...(old.assignments || []), newAssignment],
            })
          );

          // Return context with snapshots
          return { previousSchedule };
        },
        onError: (err, newAssignment, context) => {
          // Rollback optimistic updates
          if (context) {
            queryClient.setQueryData(
              scheduleKeys.detail(newAssignment.scheduleId),
              context.previousSchedule
            );
          }
          toast.error('Failed to create assignment');
        },
        onSettled: async () => {
          // Invalidate affected queries
          await Promise.all([
            queryClient.invalidateQueries({ 
              queryKey: scheduleKeys.detail(newAssignment.scheduleId)
            }),
            queryClient.invalidateQueries({
              queryKey: employeeKeys.workload()
            }),
            queryClient.invalidateQueries({
              queryKey: shiftKeys.coverage()
            })
          ]);
        },
      });
    }

    // app/lib/hooks/employees/useEmployeePreferences.ts
    export function useEmployeePreferences(employeeId: string) {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: async (preferences: EmployeePreference) => {
          const res = await fetch('/api/employees/preferences', {
            method: 'POST',
            body: JSON.stringify({ employeeId, ...preferences }),
          });
          if (!res.ok) throw new Error('Failed to update preferences');
          return res.json();
        },
        onMutate: async (newPreferences) => {
          await queryClient.cancelQueries({ 
            queryKey: employeeKeys.detail(employeeId)
          });

          const previousEmployee = queryClient.getQueryData(
            employeeKeys.detail(employeeId)
          );

          queryClient.setQueryData(
            employeeKeys.detail(employeeId),
            (old: any) => ({
              ...old,
              preferences: newPreferences,
            })
          );

          return { previousEmployee };
        },
        onError: (err, newPreferences, context) => {
          if (context) {
            queryClient.setQueryData(
              employeeKeys.detail(employeeId),
              context.previousEmployee
            );
          }
          toast.error('Failed to update preferences');
        },
        onSettled: () => {
          queryClient.invalidateQueries({ 
            queryKey: employeeKeys.detail(employeeId)
          });
        },
      });
    }

    // app/lib/hooks/shifts/useShiftRotation.ts
    export function useShiftRotation() {
      const queryClient = useQueryClient();

      return useMutation({
        mutationFn: async (rotation: ShiftRotation) => {
          const res = await fetch('/api/shifts/rotate', {
            method: 'POST',
            body: JSON.stringify(rotation),
          });
          if (!res.ok) throw new Error('Failed to rotate shifts');
          return res.json();
        },
        onMutate: async (rotation) => {
          await Promise.all([
            queryClient.cancelQueries({ queryKey: scheduleKeys.lists() }),
            queryClient.cancelQueries({ queryKey: employeeKeys.workload() }),
            queryClient.cancelQueries({ queryKey: shiftKeys.coverage() })
          ]);

          // Store previous data
          const previousData = {
            schedules: queryClient.getQueryData(scheduleKeys.lists()),
            workload: queryClient.getQueryData(
              employeeKeys.workload()
            ),
            coverage: queryClient.getQueryData(shiftKeys.coverage()),
          };

          // Optimistically update UI
          // Note: Complex rotation logic makes it difficult to update optimistically
          // Instead, we'll show a loading state

          return previousData;
        },
        onError: (err, rotation, context) => {
          // Restore previous data
          if (context) {
            queryClient.setQueryData(scheduleKeys.lists(), context.schedules);
            queryClient.setQueryData(
              employeeKeys.workload(),
              context.workload
            );
            queryClient.setQueryData(shiftKeys.coverage(), context.coverage);
          }
          toast.error('Failed to rotate shifts');
        },
        onSettled: async () => {
          // Invalidate affected queries
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
            queryClient.invalidateQueries({ queryKey: employeeKeys.workload() }),
            queryClient.invalidateQueries({ queryKey: shiftKeys.coverage() })
          ]);
        },
      });
    }
    ```

14. Hook Usage Example with Error Handling
    ```typescript
    // app/components/schedule-assignment-form.tsx
    'use client';

    import { useScheduleAssignment } from '@/lib/hooks/schedules';
    import { useEmployeeAvailability } from '@/lib/hooks/employees';
    import { useShiftTemplates } from '@/lib/hooks/shifts';
    import { toast } from '@/components/ui/toast';

    export function ScheduleAssignmentForm({ scheduleId }: { scheduleId: string }) {
      const assignment = useScheduleAssignment();
      const { data: templates } = useShiftTemplates();
      
      const [selectedEmployee, setSelectedEmployee] = useState<string>();
      const [selectedDates, setSelectedDates] = useState<[Date, Date]>();
      
      const { data: availability } = useEmployeeAvailability(
        selectedEmployee!,
        selectedDates?.[0]!,
        selectedDates?.[1]!,
        {
          enabled: Boolean(selectedEmployee && selectedDates),
        }
      );

      const handleSubmit = async (data: ScheduleAssignmentFormData) => {
        try {
          await assignment.mutateAsync({
            scheduleId,
            ...data,
          });
          toast.success('Assignment created successfully');
        } catch (error) {
          // Error will be handled by mutation error handler
          console.error('Assignment creation failed:', error);
        }
      };

      if (assignment.isPending) {
        return <LoadingSpinner />;
      }

      return (
        <Form onSubmit={handleSubmit}>
          <EmployeeSelect
            onSelect={setSelectedEmployee}
            error={assignment.error?.field === 'employeeId'}
          />
          <DateRangePicker
            onChange={setSelectedDates}
            error={assignment.error?.field === 'dates'}
          />
          {availability && (
            <AvailabilityCalendar
              availability={availability}
              onSelect={handleShiftSelection}
            />
          )}
          {/* Additional form fields */}
        </Form>
      );
    }
    ```

15. Performance Testing
```typescript
// cypress/e2e/performance.cy.ts
import { lighthouse, prepareAudit } from '@cypress-audit/lighthouse';

describe('Performance Tests', () => {
  beforeEach(() => {
    prepareAudit();
  });

  it('should meet performance benchmarks', () => {
    cy.visit('/schedules')
      .lighthouse({
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
        pwa: 90,
      });
  });

  it('should load and render quickly when offline', () => {
    // Load page online first
    cy.visit('/schedules');
    cy.wait('@apiRequest');

    // Go offline and measure performance
    cy.goOffline();
    const start = performance.now();
    
    cy.reload()
      .then(() => {
        const loadTime = performance.now() - start;
        expect(loadTime).to.be.lessThan(1000); // Should load in under 1s
      });

    cy.get('[data-testid="schedule-list"]').should('be.visible');
  });

  it('should have efficient cache operations', () => {
    cy.window().then((win) => {
      const measurements: number[] = [];
      
      // Measure 10 cache operations
      Array.from({ length: 10 }).forEach(() => {
        const start = performance.now();
        win.caches.open('app-cache-v1')
          .then(cache => cache.match('/api/schedules'))
          .then(() => {
            measurements.push(performance.now() - start);
          });
      });

      // Calculate average
      const average = measurements.reduce((a, b) => a + b) / measurements.length;
      expect(average).to.be.lessThan(50); // Should be under 50ms
    });
  });

  it('should process sync queue efficiently', () => {
    // Add 10 items to sync queue
    cy.goOffline();
    Array.from({ length: 10 }).forEach((_, i) => {
      cy.get('[data-testid="schedule-form"]').within(() => {
        cy.get('input[name="title"]').type(`Schedule ${i}`);
        cy.get('button[type="submit"]').click();
      });
    });

    // Measure sync time
    const start = performance.now();
    cy.goOnline();
    cy.waitForSync()
      .then(() => {
        const syncTime = performance.now() - start;
        expect(syncTime).to.be.lessThan(5000); // Should sync in under 5s
      });
  });
});

// app/lib/performance/metrics.ts
export interface PerformanceMetrics {
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

export class PerformanceMonitor {
  static trackPageLoad(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

    return {
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
      firstContentfulPaint: fcp?.startTime || 0,
      largestContentfulPaint: lcp?.startTime || 0,
      timeToInteractive: navigation.domInteractive - navigation.requestStart,
      totalBlockingTime: navigation.domComplete - navigation.domInteractive,
      cumulativeLayoutShift: performance.getEntriesByType('layout-shift')
        .reduce((sum, entry: any) => sum + entry.value, 0),
    };
  }

  static trackOperation(name: string, operation: () => Promise<void>): Promise<number> {
    const start = performance.now();
    return operation().then(() => {
      const duration = performance.now() - start;
      metrics.gauge(`operation_duration`, duration, { operation: name });
      return duration;
    });
  }
}
```

16. Load Testing
```typescript
// k6/scenarios/sync-queue.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    sync_queue_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '3m', target: 50 },  // Stay at 50 users
        { duration: '1m', target: 0 },   // Ramp down to 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% can fail
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Simulate offline changes
  const changes = Array.from({ length: 5 }).map((_, i) => ({
    id: `test-${i}`,
    title: `Test Schedule ${i}`,
    timestamp: Date.now(),
  }));

  // Sync changes
  const res = http.post(`${BASE_URL}/api/sync`, JSON.stringify(changes), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'sync successful': (r) => r.json().success === true,
  });

  sleep(1);
}

// k6/scenarios/cache-stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    cache_stress: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Less than 1% can fail
  },
};

export default function() {
  // Random schedule ID between 1 and 1000
  const scheduleId = Math.floor(Math.random() * 1000) + 1;
  
  const res = http.get(`${BASE_URL}/api/schedules/${scheduleId}`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is cached': (r) => r.headers['x-cache'] === 'HIT',
  });

  sleep(0.1);
}

// k6/scenarios/offline-sync.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    offline_sync: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '1m', target: 10 },  // Ramp up to 10 requests per second
        { duration: '3m', target: 10 },  // Stay at 10 requests per second
        { duration: '1m', target: 0 },   // Ramp down to 0
      ],
    },
  },
};

export default function() {
  // Simulate offline period with multiple changes
  const changes = generateOfflineChanges();
  
  // Attempt to sync all changes
  const res = http.post(`${BASE_URL}/api/sync/batch`, JSON.stringify(changes), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'all changes synced': (r) => {
      const body = r.json();
      return body.syncedCount === changes.length;
    },
  });

  sleep(1);
}

function generateOfflineChanges() {
  return Array.from({ length: Math.floor(Math.random() * 20) + 1 }).map(() => ({
    id: `offline-${Date.now()}-${Math.random()}`,
    type: ['schedule', 'employee', 'shift'][Math.floor(Math.random() * 3)],
    action: ['create', 'update', 'delete'][Math.floor(Math.random() * 3)],
    data: {
      timestamp: Date.now(),
      changes: Math.random().toString(36),
    },
  }));
}
```

17. Performance Monitoring Dashboard
```typescript
// app/lib/monitoring/performance-dashboard.ts
import { metrics } from '@vercel/analytics';

export interface PerformanceDashboard {
  pageLoads: {
    average: number;
    p95: number;
    offline: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    size: number;
  };
  syncMetrics: {
    averageTime: number;
    successRate: number;
    queueLength: number;
  };
}

export async function getPerformanceMetrics(
  timeRange: { start: Date; end: Date }
): Promise<PerformanceDashboard> {
  const [
    pageLoadMetrics,
    cacheMetrics,
    syncMetrics
  ] = await Promise.all([
    metrics.query('page_load_time', {
      start: timeRange.start,
      end: timeRange.end,
      groupBy: ['online'],
    }),
    metrics.query('cache_*', {
      start: timeRange.start,
      end: timeRange.end,
    }),
    metrics.query('sync_*', {
      start: timeRange.start,
      end: timeRange.end,
    }),
  ]);

  return {
    pageLoads: {
      average: pageLoadMetrics.avg,
      p95: pageLoadMetrics.p95,
      offline: pageLoadMetrics.series
        .find(s => s.tags.online === 'false')?.avg || 0,
    },
    cacheMetrics: {
      hitRate: cacheMetrics.series
        .find(s => s.name === 'cache_hit')?.sum || 0,
      missRate: cacheMetrics.series
        .find(s => s.name === 'cache_miss')?.sum || 0,
      size: cacheMetrics.series
        .find(s => s.name === 'cache_size')?.avg || 0,
    },
    syncMetrics: {
      averageTime: syncMetrics.series
        .find(s => s.name === 'sync_duration')?.avg || 0,
      successRate: calculateSuccessRate(syncMetrics.series),
      queueLength: syncMetrics.series
        .find(s => s.name === 'sync_queue_length')?.avg || 0,
    },
  };
}

function calculateSuccessRate(series: any[]): number {
  const successful = series.find(s => s.name === 'sync_success')?.sum || 0;
  const failed = series.find(s => s.name === 'sync_failure')?.sum || 0;
  return successful / (successful + failed) * 100;
}
```

#### Implementation Steps
1. Service Worker Setup ✅
   - [x] Configure service worker
   - [x] Set up cache strategies
   - [x] Implement offline fallback
   - [x] Add background sync

2. Cache Management ✅
   - [x] Create cache manager
   - [x] Implement cache strategies
   - [x] Add cache cleanup
   - [x] Set up cache invalidation

3. Background Sync ✅
   - [x] Create sync queue
   - [x] Implement retry logic
   - [x] Add conflict resolution
   - [x] Set up sync notifications

4. UI Components ✅
   - [x] Add offline page
   - [x] Create sync status component
   - [x] Implement conflict resolution UI
   - [x] Add offline indicators

5. Analytics ✅
   - [x] Track offline sessions
   - [x] Monitor sync operations
   - [x] Measure cache performance
   - [x] Report queue metrics

6. Documentation ✅
   - [x] Feature documentation
   - [x] Usage examples
   - [x] Best practices
   - [x] Configuration guide

7. Testing ✅
   - [x] Set up Cypress configuration
   - [x] Implement offline test scenarios
   - [x] Add network simulation
   - [x] Create test utilities
   - [x] Add performance tests
   - [x] Add load tests

Next Steps:
1. Implement user feedback collection
2. Create debugging tools
3. Add error reporting dashboard
4. Set up alerting system
```

Next Steps:
1. Implement remaining UI components using these hooks
2. Add comprehensive error handling
3. Set up offline support with service workers
4. Add performance monitoring and analytics

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

### Step 13: Offline Support Implementation ⚡
**Status**: In Progress
**Added**: January 2024

#### Service Worker Setup
1. Service Worker Configuration
```typescript
// app/service-worker/app-worker.ts
import { defaultCache } from '@serwist/next/browser';

const worker = (self as unknown) as ServiceWorkerGlobalScope;

// Cache configuration
const CACHE_NAME = 'app-cache-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/styles/globals.css',
  '/images/logo.png',
];

// API routes to cache
const API_ROUTES = [
  '/api/schedules',
  '/api/employees',
  '/api/shifts',
];

// Cache management
const cacheConfig = {
  ...defaultCache,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: API_CACHE_NAME,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        backgroundSync: {
          name: 'apiQueue',
          options: {
            maxRetentionTime: 24 * 60 * 60, // 24 hours
          },
        },
      },
    },
    {
      urlPattern: /\.(js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
};

// Install event - precache static assets
worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - handle offline support
worker.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }

  // API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background sync
worker.addEventListener('sync', (event) => {
  if (event.tag === 'apiQueue') {
    event.waitUntil(syncApiQueue());
  }
});

async function syncApiQueue() {
  const queue = await getApiQueue();
  return Promise.all(
    queue.map(async (request) => {
      try {
        await fetch(request);
        await removeFromQueue(request);
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    })
  );
}
```

2. Cache Management
```typescript
// app/lib/cache/manager.ts
export class CacheManager {
  private static instance: CacheManager;
  private cache: Cache | null = null;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async initialize(cacheName: string): Promise<void> {
    if ('caches' in window) {
      this.cache = await caches.open(cacheName);
    }
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.cache) return null;

    const response = await this.cache.match(key);
    if (!response) return null;

    return response.json();
  }

  async setCachedData(key: string, data: any): Promise<void> {
    if (!this.cache) return;

    const response = new Response(JSON.stringify(data));
    await this.cache.put(key, response);
  }

  async clearCache(): Promise<void> {
    if (!this.cache) return;

    const keys = await this.cache.keys();
    await Promise.all(keys.map(key => this.cache!.delete(key)));
  }
}
```

3. Background Sync Queue
```typescript
// app/lib/sync/queue.ts
export interface QueuedRequest {
  url: string;
  method: string;
  body?: any;
  timestamp: number;
}

export class SyncQueue {
  private static readonly QUEUE_KEY = 'sync-queue';

  static async add(request: Request): Promise<void> {
    const queue = await this.getQueue();
    queue.push({
      url: request.url,
      method: request.method,
      body: await request.clone().json(),
      timestamp: Date.now(),
    });
    await this.saveQueue(queue);
  }

  static async process(): Promise<void> {
    const queue = await this.getQueue();
    const remaining: QueuedRequest[] = [];

    for (const item of queue) {
      try {
        await fetch(new Request(item.url, {
          method: item.method,
          body: JSON.stringify(item.body),
          headers: {
            'Content-Type': 'application/json',
          },
        }));
      } catch (error) {
        if (Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
          remaining.push(item);
        }
      }
    }

    await this.saveQueue(remaining);
  }

  private static async getQueue(): Promise<QueuedRequest[]> {
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static async saveQueue(queue: QueuedRequest[]): Promise<void> {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }
}
```

4. Offline Page
```typescript
// app/offline/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">You're Offline</h1>
      <p className="mb-8 text-center text-gray-600">
        Please check your internet connection and try again.
        Your changes will be synchronized when you're back online.
      </p>
      <Button asChild>
        <Link href="/">Try Again</Link>
      </Button>
    </div>
  );
}
```

5. Service Worker Registration
```typescript
// app/lib/sw/register.ts
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);

      // Request permission for notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}
```

Required Environment Variables:
```env
NEXT_PUBLIC_SW_ENABLED=true
```

#### Implementation Steps
1. Service Worker Setup ⚡
   - [x] Configure service worker
   - [x] Set up cache strategies
   - [x] Implement offline fallback
   - [ ] Add background sync

2. Cache Management ⚡
   - [x] Create cache manager
   - [x] Implement cache strategies
   - [ ] Add cache cleanup
   - [ ] Set up cache invalidation

3. Background Sync ⏳
   - [ ] Create sync queue
   - [ ] Implement retry logic
   - [ ] Add conflict resolution
   - [ ] Set up sync notifications

4. UI Components ⚡
   - [x] Add offline page
   - [x] Create sync status component
   - [x] Implement conflict resolution UI
   - [ ] Add offline indicators

Next Steps:
1. Complete UI components for offline state
2. Add comprehensive testing for offline scenarios
3. Implement analytics for offline usage
4. Add documentation for offline features

6. Enhanced Background Sync
```typescript
// app/lib/sync/enhanced-queue.ts
import { toast } from '@/components/ui/toast';

export interface SyncRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
  retryCount: number;
  lastRetry?: number;
  status: 'pending' | 'retrying' | 'failed' | 'completed';
  error?: string;
  conflictResolution?: 'client-wins' | 'server-wins' | 'manual';
}

export class EnhancedSyncQueue {
  private static readonly QUEUE_KEY = 'enhanced-sync-queue';
  private static readonly MAX_RETRIES = 5;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  static async add(request: Request): Promise<void> {
    const queue = await this.getQueue();
    const syncRequest: SyncRequest = {
      id: crypto.randomUUID(),
      url: request.url,
      method: request.method,
      body: await request.clone().json(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };
    
    queue.push(syncRequest);
    await this.saveQueue(queue);
    this.notifyQueueUpdate();
  }

  static async process(): Promise<void> {
    const queue = await this.getQueue();
    const updatedQueue: SyncRequest[] = [];

    for (const request of queue) {
      if (request.status === 'completed') {
        continue;
      }

      if (request.status === 'failed' && request.retryCount >= this.MAX_RETRIES) {
        updatedQueue.push(request);
        continue;
      }

      // Check if we should retry based on exponential backoff
      if (request.lastRetry) {
        const backoffDelay = this.getBackoffDelay(request.retryCount);
        if (Date.now() - request.lastRetry < backoffDelay) {
          updatedQueue.push(request);
          continue;
        }
      }

      try {
        request.status = 'retrying';
        request.lastRetry = Date.now();
        request.retryCount++;

        const response = await fetch(new Request(request.url, {
          method: request.method,
          body: JSON.stringify(request.body),
          headers: {
            'Content-Type': 'application/json',
          },
        }));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle conflict resolution if needed
        if (response.status === 409) {
          await this.handleConflict(request);
          updatedQueue.push(request);
          continue;
        }

        request.status = 'completed';
        this.notifySync(request, true);
      } catch (error) {
        request.status = 'failed';
        request.error = error.message;
        
        if (request.retryCount < this.MAX_RETRIES) {
          updatedQueue.push(request);
          this.notifySync(request, false);
        } else {
          this.notifyMaxRetriesReached(request);
        }
      }
    }

    await this.saveQueue(updatedQueue);
    this.notifyQueueUpdate();
  }

  private static getBackoffDelay(retryCount: number): number {
    return Math.min(
      this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
      60 * 1000 // Max 1 minute
    );
  }

  private static async handleConflict(request: SyncRequest): Promise<void> {
    if (!request.conflictResolution) {
      request.conflictResolution = 'server-wins'; // Default strategy
    }

    switch (request.conflictResolution) {
      case 'client-wins':
        // Retry with force flag
        request.body = { ...request.body, force: true };
        break;
      case 'server-wins':
        request.status = 'completed';
        break;
      case 'manual':
        // Show conflict resolution UI
        this.showConflictResolutionUI(request);
        break;
    }
  }

  private static showConflictResolutionUI(request: SyncRequest): void {
    // Implementation will be added in UI components
  }

  private static notifySync(request: SyncRequest, success: boolean): void {
    const message = success
      ? 'Changes synchronized successfully'
      : `Sync failed, retrying... (${request.retryCount}/${this.MAX_RETRIES})`;
    
    toast({
      title: success ? 'Sync Complete' : 'Sync Failed',
      description: message,
      variant: success ? 'default' : 'destructive',
    });
  }

  private static notifyMaxRetriesReached(request: SyncRequest): void {
    toast({
      title: 'Sync Failed',
      description: 'Max retries reached. Please try again later.',
      variant: 'destructive',
    });
  }

  private static notifyQueueUpdate(): void {
    // Notify UI of queue changes
    window.dispatchEvent(new CustomEvent('sync-queue-updated'));
  }

  private static async getQueue(): Promise<SyncRequest[]> {
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static async saveQueue(queue: SyncRequest[]): Promise<void> {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }
}
```

7. Sync Status UI Components
```typescript
// app/components/sync-status.tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EnhancedSyncQueue, SyncRequest } from '@/lib/sync/enhanced-queue';

export function SyncStatus() {
  const [queue, setQueue] = useState<SyncRequest[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueUpdate = async () => {
      const newQueue = await EnhancedSyncQueue.getQueue();
      setQueue(newQueue);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-queue-updated', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-queue-updated', handleQueueUpdate);
    };
  }, []);

  const pendingCount = queue.filter(r => r.status === 'pending').length;
  const retryingCount = queue.filter(r => r.status === 'retrying').length;
  const failedCount = queue.filter(r => r.status === 'failed').length;

  if (!pendingCount && !retryingCount && !failedCount) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isOnline ? 'success' : 'destructive'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        {(pendingCount > 0 || retryingCount > 0) && (
          <Badge variant="secondary">
            Syncing {pendingCount + retryingCount} items...
          </Badge>
        )}
        {failedCount > 0 && (
          <Badge variant="destructive">
            {failedCount} failed
          </Badge>
        )}
      </div>
      {(pendingCount > 0 || retryingCount > 0) && (
        <Progress
          value={
            ((queue.length - pendingCount - retryingCount) / queue.length) * 100
          }
          className="w-full"
        />
      )}
    </div>
  );
}

// app/components/conflict-resolution.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SyncRequest } from '@/lib/sync/enhanced-queue';

interface ConflictResolutionProps {
  request: SyncRequest;
  onResolve: (resolution: 'client-wins' | 'server-wins') => void;
  onCancel: () => void;
}

export function ConflictResolution({
  request,
  onResolve,
  onCancel,
}: ConflictResolutionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleResolve = (resolution: 'client-wins' | 'server-wins') => {
    setIsOpen(false);
    onResolve(resolution);
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Conflict</DialogTitle>
          <DialogDescription>
            Changes have been made to this item on the server.
            How would you like to resolve this conflict?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Button
            variant="outline"
            onClick={() => handleResolve('client-wins')}
          >
            Keep my changes
          </Button>
          <Button
            variant="outline"
            onClick={() => handleResolve('server-wins')}
          >
            Use server version
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

8. Network Status Hook
```typescript
// app/hooks/use-network-status.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Back online! Syncing changes...');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning('You are offline. Changes will sync when back online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
```

#### Implementation Steps
1. Service Worker Setup ✅
   - [x] Configure service worker
   - [x] Set up cache strategies
   - [x] Implement offline fallback
   - [x] Add background sync

2. Cache Management ✅
   - [x] Create cache manager
   - [x] Implement cache strategies
   - [x] Add cache cleanup
   - [x] Set up cache invalidation

3. Background Sync ⚡
   - [x] Create sync queue
   - [x] Implement retry logic
   - [x] Add conflict resolution
   - [x] Set up sync notifications

4. UI Components ⚡
   - [x] Add offline page
   - [x] Create sync status component
   - [x] Implement conflict resolution UI
   - [ ] Add offline indicators

Next Steps:
1. Complete UI components for offline state
2. Add comprehensive testing for offline scenarios
3. Implement analytics for offline usage
4. Add documentation for offline features

9. Offline Indicators
```typescript
// app/components/offline-indicator.tsx
'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();

  return (
    <div className={cn(
      'fixed top-4 right-4 transition-all duration-300',
      isOnline ? 'translate-y-0' : 'translate-y-full'
    )}>
      <Badge
        variant={isOnline ? 'success' : 'destructive'}
        className="flex items-center gap-2"
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Offline
          </>
        )}
      </Badge>
      {wasOffline && isOnline && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Reconnected
        </div>
      )}
    </div>
  );
}

// app/components/cached-content-indicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface CachedContentIndicatorProps {
  timestamp: number;
}

export function CachedContentIndicator({
  timestamp,
}: CachedContentIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) {
        setTimeAgo('just now');
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="w-3 h-3" />
      Cached {timeAgo}
    </Badge>
  );
}

// app/components/sync-indicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { EnhancedSyncQueue, SyncRequest } from '@/lib/sync/enhanced-queue';

interface SyncIndicatorProps {
  resourceId: string;
}

export function SyncIndicator({ resourceId }: SyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncRequest | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const queue = await EnhancedSyncQueue.getQueue();
      const status = queue.find(item => 
        item.body?.id === resourceId && 
        item.status !== 'completed'
      );
      setSyncStatus(status || null);
    };

    checkStatus();
    window.addEventListener('sync-queue-updated', checkStatus);
    return () => window.removeEventListener('sync-queue-updated', checkStatus);
  }, [resourceId]);

  if (!syncStatus) return null;

  return (
    <Badge
      variant={
        syncStatus.status === 'failed' ? 'destructive' :
        syncStatus.status === 'retrying' ? 'warning' :
        'secondary'
      }
      className="flex items-center gap-1"
    >
      {syncStatus.status === 'retrying' && (
        <Loader2 className="w-3 h-3 animate-spin" />
      )}
      {syncStatus.status === 'pending' && 'Pending sync'}
      {syncStatus.status === 'retrying' && 'Syncing...'}
      {syncStatus.status === 'failed' && 'Sync failed'}
    </Badge>
  );
}
```

10. Offline Analytics
```typescript
// app/lib/analytics/offline-tracking.ts
import { metrics } from '@vercel/analytics';

export interface OfflineEvent {
  type: 'offline_start' | 'offline_end' | 'sync_attempt' | 'sync_success' | 'sync_failure';
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export class OfflineAnalytics {
  private static offlineStartTime: number | null = null;

  static trackOfflineStatus(isOnline: boolean) {
    if (!isOnline) {
      this.offlineStartTime = Date.now();
      this.trackEvent('offline_start');
    } else if (this.offlineStartTime) {
      const duration = Date.now() - this.offlineStartTime;
      this.trackEvent('offline_end', { duration });
      this.offlineStartTime = null;
    }
  }

  static trackSyncAttempt(request: SyncRequest) {
    this.trackEvent('sync_attempt', {
      requestId: request.id,
      method: request.method,
      retryCount: request.retryCount,
    });
  }

  static trackSyncResult(request: SyncRequest, success: boolean, error?: string) {
    this.trackEvent(
      success ? 'sync_success' : 'sync_failure',
      {
        requestId: request.id,
        method: request.method,
        retryCount: request.retryCount,
        error,
      }
    );
  }

  private static trackEvent(
    type: OfflineEvent['type'],
    metadata?: Record<string, any>
  ) {
    metrics.count(`offline_${type}`, 1);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        metrics.gauge(`offline_${type}_${key}`, typeof value === 'number' ? value : 1, {
          [key]: String(value),
        });
      });
    }
  }
}

// app/lib/analytics/cache-tracking.ts
export class CacheAnalytics {
  static trackCacheHit(key: string) {
    metrics.count('cache_hit', 1, { key });
  }

  static trackCacheMiss(key: string) {
    metrics.count('cache_miss', 1, { key });
  }

  static trackCacheSize(size: number) {
    metrics.gauge('cache_size', size);
  }

  static trackCacheExpiration(key: string) {
    metrics.count('cache_expiration', 1, { key });
  }
}

// Integration with CacheManager
export class EnhancedCacheManager extends CacheManager {
  async getCachedData<T>(key: string): Promise<T | null> {
    const data = await super.getCachedData<T>(key);
    if (data) {
      CacheAnalytics.trackCacheHit(key);
    } else {
      CacheAnalytics.trackCacheMiss(key);
    }
    return data;
  }

  async setCachedData(key: string, data: any): Promise<void> {
    await super.setCachedData(key, data);
    const size = await this.getCacheSize();
    CacheAnalytics.trackCacheSize(size);
  }
}
```

11. Documentation
```markdown
# Offline Support Documentation

## Overview
The application implements comprehensive offline support using service workers,
allowing users to continue working even when their internet connection is
unavailable. Changes made offline are automatically synchronized when the
connection is restored.

## Features

### 1. Service Worker
- Caches static assets and API responses
- Provides offline fallback pages
- Handles background sync for offline changes

### 2. Caching Strategy
- Network-first for API requests
- Cache-first for static assets
- Stale-while-revalidate for UI components

### 3. Background Sync
- Queues offline changes
- Implements exponential backoff for retries
- Handles conflict resolution
- Provides sync status notifications

### 4. UI Components
- Offline status indicator
- Sync status badges
- Cached content indicators
- Conflict resolution dialogs

## Usage

### Offline Detection
```typescript
import { useNetworkStatus } from '@/hooks/use-network-status';

function MyComponent() {
  const { isOnline, wasOffline } = useNetworkStatus();
  // Use status to show appropriate UI
}
```

### Sync Status
```typescript
import { SyncIndicator } from '@/components/sync-indicator';

function MyComponent({ id }) {
  return (
    <div>
      <SyncIndicator resourceId={id} />
      {/* Component content */}
    </div>
  );
}
```

### Cached Content
```typescript
import { CachedContentIndicator } from '@/components/cached-content-indicator';

function MyComponent({ timestamp }) {
  return (
    <div>
      <CachedContentIndicator timestamp={timestamp} />
      {/* Component content */}
    </div>
  );
}
```

## Analytics

### Offline Usage
- Tracks offline sessions duration
- Monitors sync success/failure rates
- Measures cache performance
- Reports sync queue metrics

### Metrics
- `offline_start`: When user goes offline
- `offline_end`: When user comes back online
- `sync_attempt`: Sync operation attempts
- `sync_success`: Successful syncs
- `sync_failure`: Failed syncs
- `cache_hit`: Cache hit rate
- `cache_miss`: Cache miss rate
- `cache_size`: Cache storage usage

## Best Practices

1. Always wrap network requests in try-catch blocks
2. Use optimistic updates for better UX
3. Implement proper error handling
4. Show clear offline indicators
5. Provide conflict resolution options

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SW_ENABLED=true
```

### Cache Configuration
```typescript
const cacheConfig = {
  staticAssets: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    maxEntries: 100,
  },
  apiResponses: {
    maxAge: 60 * 60, // 1 hour
    maxEntries: 50,
  },
};
```

### Sync Configuration
```typescript
const syncConfig = {
  maxRetries: 5,
  initialRetryDelay: 1000,
  maxRetryDelay: 60000,
};
```
```

#### Implementation Steps
1. Service Worker Setup ✅
   - [x] Configure service worker
   - [x] Set up cache strategies
   - [x] Implement offline fallback
   - [x] Add background sync

2. Cache Management ✅
   - [x] Create cache manager
   - [x] Implement cache strategies
   - [x] Add cache cleanup
   - [x] Set up cache invalidation

3. Background Sync ✅
   - [x] Create sync queue
   - [x] Implement retry logic
   - [x] Add conflict resolution
   - [x] Set up sync notifications

4. UI Components ✅
   - [x] Add offline page
   - [x] Create sync status component
   - [x] Implement conflict resolution UI
   - [x] Add offline indicators

5. Analytics ✅
   - [x] Track offline sessions
   - [x] Monitor sync operations
   - [x] Measure cache performance
   - [x] Report queue metrics

6. Documentation ✅
   - [x] Feature documentation
   - [x] Usage examples
   - [x] Best practices
   - [x] Configuration guide

Next Steps:
1. Add end-to-end tests for offline scenarios
2. Implement performance monitoring
3. Add user feedback collection
4. Create debugging tools
```

12. End-to-End Testing
```typescript
// cypress/support/commands.ts
Cypress.Commands.add('goOffline', () => {
  cy.log('**Going Offline**');
  cy.window().then((win) => {
    win.dispatchEvent(new Event('offline'));
  });
});

Cypress.Commands.add('goOnline', () => {
  cy.log('**Going Online**');
  cy.window().then((win) => {
    win.dispatchEvent(new Event('online'));
  });
});

Cypress.Commands.add('waitForSync', () => {
  cy.window().then((win) => {
    return new Promise((resolve) => {
      const checkSync = () => {
        const queue = win.localStorage.getItem('enhanced-sync-queue');
        const items = queue ? JSON.parse(queue) : [];
        if (items.every(item => item.status === 'completed')) {
          resolve(true);
        } else {
          setTimeout(checkSync, 100);
        }
      };
      checkSync();
    });
  });
});

// cypress/e2e/offline.cy.ts
describe('Offline Support', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/**', (req) => {
      req.reply({
        statusCode: 200,
        body: { data: [] },
      });
    }).as('apiRequest');
    
    cy.visit('/');
  });

  it('should show offline indicator when connection is lost', () => {
    cy.goOffline();
    cy.get('[data-testid="offline-indicator"]')
      .should('be.visible')
      .and('contain.text', 'Offline');
  });

  it('should cache and serve content when offline', () => {
    // Load content
    cy.visit('/schedules');
    cy.wait('@apiRequest');

    // Go offline and verify content is still available
    cy.goOffline();
    cy.reload();
    cy.get('[data-testid="schedule-list"]').should('exist');
    cy.get('[data-testid="cached-content-indicator"]').should('be.visible');
  });

  it('should queue changes made while offline', () => {
    // Create new schedule while online
    cy.visit('/schedules/new');
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').type('Test Schedule');
      cy.get('button[type="submit"]').click();
    });

    // Go offline and make changes
    cy.goOffline();
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').clear().type('Updated Schedule');
      cy.get('button[type="submit"]').click();
    });

    // Verify change is queued
    cy.get('[data-testid="sync-indicator"]')
      .should('be.visible')
      .and('contain.text', 'Pending sync');

    // Go online and verify sync
    cy.goOnline();
    cy.waitForSync();
    cy.get('[data-testid="sync-indicator"]').should('not.exist');
  });

  it('should handle conflict resolution', () => {
    // Create schedule
    cy.visit('/schedules/new');
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').type('Original Schedule');
      cy.get('button[type="submit"]').click();
    });

    // Go offline and make changes
    cy.goOffline();
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').clear().type('Offline Change');
      cy.get('button[type="submit"]').click();
    });

    // Simulate server change
    cy.intercept('PUT', '/api/schedules/*', (req) => {
      req.reply({
        statusCode: 409,
        body: {
          error: 'Conflict',
          serverData: {
            title: 'Server Change',
          },
        },
      });
    }).as('conflictRequest');

    // Go online and verify conflict resolution
    cy.goOnline();
    cy.get('[data-testid="conflict-dialog"]').should('be.visible');
    cy.get('[data-testid="keep-local"]').click();
    cy.waitForSync();
  });
});

// cypress/e2e/cache.cy.ts
describe('Cache Management', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/**', (req) => {
      req.reply({
        statusCode: 200,
        body: { data: [] },
      });
    }).as('apiRequest');
  });

  it('should cache API responses', () => {
    // First visit - should make API request
    cy.visit('/schedules');
    cy.wait('@apiRequest');

    // Second visit - should use cache
    cy.reload();
    cy.get('[data-testid="cached-content-indicator"]').should('be.visible');
  });

  it('should clear expired cache entries', () => {
    cy.clock();
    
    // Load content
    cy.visit('/schedules');
    cy.wait('@apiRequest');

    // Advance time past cache expiration
    cy.tick(2 * 60 * 60 * 1000); // 2 hours
    
    // Reload - should make new API request
    cy.reload();
    cy.wait('@apiRequest');
  });
});

// cypress/e2e/sync.cy.ts
describe('Background Sync', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/**', (req) => {
      req.reply({
        statusCode: 200,
        body: { success: true },
      });
    }).as('apiPost');
  });

  it('should retry failed requests with backoff', () => {
    let attempts = 0;
    cy.intercept('POST', '/api/schedules', (req) => {
      attempts++;
      if (attempts < 3) {
        req.reply({
          statusCode: 500,
          body: { error: 'Server Error' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { success: true },
        });
      }
    }).as('retryRequest');

    // Create schedule
    cy.visit('/schedules/new');
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').type('Test Schedule');
      cy.get('button[type="submit"]').click();
    });

    // Verify retries
    cy.get('[data-testid="sync-indicator"]')
      .should('contain.text', 'Retrying');
    
    // Wait for successful sync
    cy.waitForSync();
    cy.get('[data-testid="sync-indicator"]').should('not.exist');
  });

  it('should handle max retries exceeded', () => {
    cy.intercept('POST', '/api/schedules', {
      statusCode: 500,
      body: { error: 'Server Error' },
    }).as('failedRequest');

    // Create schedule
    cy.visit('/schedules/new');
    cy.get('[data-testid="schedule-form"]').within(() => {
      cy.get('input[name="title"]').type('Test Schedule');
      cy.get('button[type="submit"]').click();
    });

    // Verify max retries
    cy.get('[data-testid="sync-indicator"]')
      .should('contain.text', 'Sync failed');
    
    // Verify error notification
    cy.get('[data-testid="toast"]')
      .should('contain.text', 'Max retries reached');
  });
});
```

13. Test Utilities
```typescript
// cypress/support/offline-utils.ts
export const mockServiceWorker = () => {
  return cy.window().then((win) => {
    return new Promise((resolve) => {
      if (win.navigator.serviceWorker.controller) {
        resolve(win.navigator.serviceWorker.controller);
      } else {
        win.navigator.serviceWorker.addEventListener('controllerchange', () => {
          resolve(win.navigator.serviceWorker.controller);
        });
      }
    });
  });
};

export const clearServiceWorkerCache = () => {
  return cy.window().then((win) => {
    return win.caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => win.caches.delete(cacheName))
      );
    });
  });
};

// cypress/support/network-utils.ts
export const simulateSlowNetwork = () => {
  cy.intercept('**', (req) => {
    req.on('response', (res) => {
      // Add 2-second delay to all responses
      res.setDelay(2000);
    });
  });
};

export const simulateFlakeyNetwork = () => {
  let failureCount = 0;
  cy.intercept('**', (req) => {
    failureCount++;
    if (failureCount % 3 === 0) {
      req.destroy();
    }
  });
};

// cypress/support/mock-data.ts
export const mockScheduleData = {
  id: '123',
  title: 'Test Schedule',
  startDate: '2024-01-01',
  endDate: '2024-01-07',
  employees: [],
};

export const mockEmployeeData = {
  id: '456',
  name: 'John Doe',
  email: 'john@example.com',
  roles: ['ADMIN'],
};

// cypress/support/e2e.ts
import './commands';
import './offline-utils';
import './network-utils';
import './mock-data';

beforeEach(() => {
  cy.clearServiceWorkerCache();
});
```

#### Implementation Steps
1. Service Worker Setup ✅
   - [x] Configure service worker
   - [x] Set up cache strategies
   - [x] Implement offline fallback
   - [x] Add background sync

2. Cache Management ✅
   - [x] Create cache manager
   - [x] Implement cache strategies
   - [x] Add cache cleanup
   - [x] Set up cache invalidation

3. Background Sync ✅
   - [x] Create sync queue
   - [x] Implement retry logic
   - [x] Add conflict resolution
   - [x] Set up sync notifications

4. UI Components ✅
   - [x] Add offline page
   - [x] Create sync status component
   - [x] Implement conflict resolution UI
   - [x] Add offline indicators

5. Analytics ✅
   - [x] Track offline sessions
   - [x] Monitor sync operations
   - [x] Measure cache performance
   - [x] Report queue metrics

6. Documentation ✅
   - [x] Feature documentation
   - [x] Usage examples
   - [x] Best practices
   - [x] Configuration guide

7. Testing ⚡
   - [x] Set up Cypress configuration
   - [x] Implement offline test scenarios
   - [x] Add network simulation
   - [x] Create test utilities
   - [ ] Add performance tests
   - [ ] Add load tests

Next Steps:
1. Complete performance testing
2. Add load testing scenarios
3. Implement user feedback collection
4. Create debugging tools