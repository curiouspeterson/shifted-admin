/**
 * API Route Handler Utility
 * Last Updated: 2024
 * 
 * This utility provides a centralized way to create API route handlers with:
 * - Automatic authentication handling
 * - Supervisor permission checks
 * - Error handling and response formatting
 * - Type safety for request/response handling
 * - Consistent context injection
 * 
 * It wraps Next.js API routes with common middleware functionality while
 * maintaining type safety and proper error handling.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServer } from '../supabase'
import { AppError } from '../errors'
import type { Session } from '@supabase/supabase-js'

/**
 * Route Handler Type Definition
 * Defines the shape of route handler functions that can be wrapped by this utility
 * @param req - The Next.js request object
 * @param context - Injected context containing Supabase client, session, and route params
 */
type RouteHandler = (req: NextRequest, context: RouteContext) => Promise<NextResponse>

/**
 * Route Context Interface
 * Defines the context object that is passed to route handlers
 * Contains necessary dependencies for handling requests
 */
interface RouteContext {
  supabase: ReturnType<typeof createServer>  // Typed Supabase client
  session: Session                           // Current user session
  params?: { [key: string]: string }        // Route parameters
}

/**
 * Handler Options Interface
 * Configuration options for route handler behavior
 * @property requireAuth - Whether the route requires authentication
 * @property requireSupervisor - Whether the route requires supervisor privileges
 */
interface HandlerOptions {
  requireAuth?: boolean
  requireSupervisor?: boolean
}

/**
 * Route Handler Factory
 * Creates a wrapped route handler with authentication and error handling
 * 
 * @param handler - The route handler function to wrap
 * @param options - Configuration options for authentication and permissions
 * @returns A wrapped handler function with error handling and auth checks
 */
export function createRouteHandler(
  handler: RouteHandler,
  options: HandlerOptions = { requireAuth: true }
) {
  return async (req: NextRequest, context?: { params: { [key: string]: string } }) => {
    try {
      // Initialize Supabase client for the request
      const supabase = createServer()

      /**
       * Authentication Check
       * Verifies user session if authentication is required
       * Also handles supervisor permission check if needed
       */
      if (options.requireAuth) {
        // Verify authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          throw new AppError('Authentication failed', 401)
        }
        
        if (!session) {
          throw new AppError('Unauthorized', 401)
        }

        /**
         * Supervisor Permission Check
         * Verifies if the user has supervisor privileges when required
         * Checks employee position against allowed supervisor roles
         */
        if (options.requireSupervisor) {
          const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('position')
            .eq('user_id', session.user.id)
            .single()

          if (employeeError) {
            throw new AppError('Failed to verify permissions', 500)
          }

          if (!employee) {
            throw new AppError('Employee not found', 404)
          }

          if (!['shift_supervisor', 'management'].includes(employee.position)) {
            throw new AppError('Insufficient permissions', 403)
          }
        }

        // Execute handler with authenticated context
        return handler(req, { 
          supabase, 
          session,
          params: context?.params
        })
      }

      /**
       * Non-Authenticated Route Handling
       * Executes handler without session requirement
       * Still provides Supabase client for database access
       */
      return handler(req, { 
        supabase,
        session: null as any,
        params: context?.params
      })
    } catch (error) {
      console.error('Route handler error:', error)

      /**
       * Error Response Handling
       * Formats errors into consistent response structure
       * Handles both AppError instances and generic errors
       */
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  }
} 