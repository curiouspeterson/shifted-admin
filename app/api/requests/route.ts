/**
 * Time-Off Requests API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing employee time-off requests.
 * Supports:
 * - GET: Retrieve all time-off requests for the authenticated employee
 * - POST: Create a new time-off request
 * 
 * Includes validation, error handling, and proper type safety for all operations.
 * Uses Zod for request/response validation and proper database typing.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

/**
 * Type Definitions
 * Using database types to ensure type safety with Supabase
 */
type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert']

/**
 * Validation Schemas
 * Define the shape and constraints for time-off request data
 */

/**
 * Complete Time-Off Request Schema
 * Used for validating database records and API responses
 * Includes all fields from the database
 */
const timeOffRequestSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.string(),
  reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

/**
 * Time-Off Request Input Schema
 * Used for validating POST request bodies
 * Only includes fields that can be set by the client
 */
const timeOffRequestInputSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional()
})

/**
 * API Response Schema
 * Wraps time-off request data in a response object
 */
const timeOffRequestsResponseSchema = z.object({
  requests: z.array(timeOffRequestSchema)
})

/**
 * GET /api/requests
 * Retrieves all time-off requests for the authenticated employee
 * Ordered by creation date (newest first)
 * Accessible to authenticated employees
 */
export const GET = createRouteHandler(
  async (req, { supabase, session }) => {
    /**
     * Get Employee ID
     * Lookup employee record for the authenticated user
     * Required for filtering requests by employee
     */
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404)
    }

    /**
     * Fetch Time-Off Requests
     * Get all requests for the employee
     * Ordered by creation date descending
     */
    const { data: requests, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('Failed to fetch requests', 500)
    }

    // Validate and return response data
    const validatedResponse = timeOffRequestsResponseSchema.parse({ 
      requests: requests || [] 
    })

    return NextResponse.json(validatedResponse)
  }
)

/**
 * POST /api/requests
 * Creates a new time-off request for the authenticated employee
 * Body must contain start_date and end_date
 * Returns: The newly created request
 */
export const POST = createRouteHandler(
  async (req, { supabase, session }) => {
    /**
     * Get Employee ID
     * Lookup employee record for the authenticated user
     * Required for creating the request
     */
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404)
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = timeOffRequestInputSchema.parse(body)

    /**
     * Prepare New Request Data
     * Combines validated input with system-generated fields
     */
    const now = new Date().toISOString()
    const newRequest: TimeOffRequestInsert = {
      ...validatedData,
      employee_id: employee.id,
      status: 'pending',
      created_at: now,
      updated_at: now
    }

    /**
     * Create Time-Off Request
     * Insert the new request and return the created record
     */
    const { data: request, error } = await supabase
      .from('time_off_requests')
      .insert(newRequest)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create request', 500)
    }

    // Validate and return the created request
    const validatedRequest = timeOffRequestSchema.parse(request)

    return NextResponse.json({ request: validatedRequest })
  }
) 