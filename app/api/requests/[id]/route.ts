/**
 * Time-Off Request Details API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing individual time-off requests.
 * Currently supports:
 * - GET: Retrieve a specific request by ID
 * - PATCH: Update the status of a request (approve/deny)
 * - DELETE: Remove a request
 * 
 * GET and DELETE operations are available to the request owner and supervisors.
 * PATCH operations (status updates) are restricted to supervisors only.
 * The route uses dynamic path parameters to identify the target request.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'
import type { Session } from '@supabase/supabase-js'

/**
 * Type Definition
 * Using database type to ensure type safety with Supabase
 */
type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']

/**
 * Extended Session Type
 * Adds custom properties to the base Supabase Session type
 */
interface ExtendedSession extends Session {
  isSupervisor: boolean;
}

/**
 * Validation Schemas
 * Define the shape and constraints for request data
 */

/**
 * Request Status Update Schema
 * Used for validating PATCH request bodies
 * Only allows updating the status and adding a response message
 */
const requestUpdateSchema = z.object({
  status: z.enum(['approved', 'denied']),
  response_message: z.string().optional()
})

/**
 * GET /api/requests/[id]
 * Retrieves a specific time-off request by ID
 * Available to request owner and supervisors
 * Returns: The request record if found and authorized
 * Throws: 404 if not found, 403 if unauthorized, 400 if ID missing
 */
export const GET = createRouteHandler(
  async (req, { supabase, session, params }) => {
    if (!params?.id) {
      throw new AppError('Request ID is required', 400)
    }

    // Fetch request by ID
    const { data: request, error } = await supabase
      .from('time_off_requests')
      .select('*, employee:employees(*)')
      .eq('id', params.id)
      .single()

    if (error || !request) {
      throw new AppError('Request not found', 404)
    }

    // Verify access (owner or supervisor)
    const extendedSession = session as ExtendedSession
    if (request.employee_id !== extendedSession.user.id && !extendedSession.isSupervisor) {
      throw new AppError('Not authorized to view this request', 403)
    }

    return NextResponse.json({ request })
  }
)

/**
 * PATCH /api/requests/[id]
 * Updates the status of a time-off request
 * Restricted to supervisors only
 * Body: New status and optional response message
 * Returns: The updated request record
 * Throws: 404 if not found, 400 if ID missing
 */
export const PATCH = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Request ID is required', 400)
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = requestUpdateSchema.parse(body)

    // Update request status
    const { data: request, error } = await supabase
      .from('time_off_requests')
      .update({ 
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !request) {
      throw new AppError('Request not found', 404)
    }

    return NextResponse.json({ request })
  },
  { requireSupervisor: true }
)

/**
 * DELETE /api/requests/[id]
 * Removes a time-off request
 * Available to request owner and supervisors
 * Returns: Success message
 * Throws: 404 if not found, 403 if unauthorized, 400 if ID missing
 */
export const DELETE = createRouteHandler(
  async (req, { supabase, session, params }) => {
    if (!params?.id) {
      throw new AppError('Request ID is required', 400)
    }

    // First fetch the request to check ownership
    const { data: request, error: fetchError } = await supabase
      .from('time_off_requests')
      .select()
      .eq('id', params.id)
      .single()

    if (fetchError || !request) {
      throw new AppError('Request not found', 404)
    }

    // Verify access (owner or supervisor)
    const extendedSession = session as ExtendedSession
    if (request.employee_id !== extendedSession.user.id && !extendedSession.isSupervisor) {
      throw new AppError('Not authorized to delete this request', 403)
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from('time_off_requests')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      throw new AppError('Failed to delete request', 500)
    }

    return NextResponse.json({ 
      message: 'Request successfully deleted' 
    })
  }
) 