/**
 * Employee Availability API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing employee availability.
 * Supports:
 * - GET: Retrieve all availability entries for the authenticated employee
 * - POST: Create or update availability for a specific day
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
type Availability = Database['public']['Tables']['employee_availability']['Row']
type AvailabilityInsert = Database['public']['Tables']['employee_availability']['Insert']

/**
 * Validation Schemas
 * Define the shape and constraints for availability data
 */

/**
 * Complete Availability Schema
 * Used for validating database records and API responses
 * Includes all fields from the database
 */
const availabilitySchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_available: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
})

/**
 * Availability Input Schema
 * Used for validating POST request bodies
 * Only includes fields that can be set by the client
 */
const availabilityInputSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_available: z.boolean()
})

/**
 * API Response Schema
 * Wraps availability data in a response object
 */
const availabilityResponseSchema = z.object({
  availability: z.array(availabilitySchema)
})

/**
 * GET /api/availability
 * Retrieves all availability entries for the authenticated employee
 * Ordered by day of week
 * Accessible to authenticated employees
 */
export const GET = createRouteHandler(
  async (req, { supabase, session }) => {
    /**
     * Get Employee ID
     * Lookup employee record for the authenticated user
     * Required for filtering availability by employee
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
     * Fetch Availability
     * Get all availability entries for the employee
     * Ordered by day of week for consistent presentation
     */
    const { data: availability, error } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week')

    if (error) {
      throw new AppError('Failed to fetch availability', 500)
    }

    // Validate and return response data
    const validatedResponse = availabilityResponseSchema.parse({ 
      availability: availability || [] 
    })

    return NextResponse.json(validatedResponse)
  }
)

/**
 * POST /api/availability
 * Creates or updates availability for a specific day
 * Uses upsert to handle both creation and updates
 * Returns: The created/updated availability entry
 */
export const POST = createRouteHandler(
  async (req, { supabase, session }) => {
    /**
     * Get Employee ID
     * Lookup employee record for the authenticated user
     * Required for creating/updating availability
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
    const validatedData = availabilityInputSchema.parse(body)

    /**
     * Prepare Availability Data
     * Combines validated input with system-generated fields
     */
    const now = new Date().toISOString()
    const newAvailability: AvailabilityInsert = {
      ...validatedData,
      employee_id: employee.id,
      created_at: now,
      updated_at: now
    }

    /**
     * Upsert Availability
     * Creates new entry or updates existing one for the day
     * Returns the affected record
     */
    const { data: availability, error } = await supabase
      .from('employee_availability')
      .upsert(newAvailability)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update availability', 500)
    }

    // Validate and return the created/updated availability
    const validatedAvailability = availabilitySchema.parse(availability)

    return NextResponse.json({ availability: validatedAvailability })
  }
) 