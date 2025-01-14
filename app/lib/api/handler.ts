import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServer } from '../supabase'
import { AppError } from '../errors'
import type { Session } from '@supabase/supabase-js'

type RouteHandler = (req: NextRequest, context: RouteContext) => Promise<NextResponse>

interface RouteContext {
  supabase: ReturnType<typeof createServer>
  session: Session
  params?: { [key: string]: string }
}

interface HandlerOptions {
  requireAuth?: boolean
  requireSupervisor?: boolean
}

export function createRouteHandler(
  handler: RouteHandler,
  options: HandlerOptions = { requireAuth: true }
) {
  return async (req: NextRequest, context?: { params: { [key: string]: string } }) => {
    try {
      const supabase = createServer()

      // Handle authentication if required
      if (options.requireAuth) {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          throw new AppError('Authentication failed', 401)
        }
        
        if (!session) {
          throw new AppError('Unauthorized', 401)
        }

        // Check supervisor status if required
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

        return handler(req, { 
          supabase, 
          session,
          params: context?.params
        })
      }

      // Handle non-authenticated routes
      return handler(req, { 
        supabase,
        session: null as any,
        params: context?.params
      })
    } catch (error) {
      console.error('Route handler error:', error)

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