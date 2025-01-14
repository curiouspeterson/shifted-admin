/**
 * Shifts API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing shift definitions.
 * Currently supports:
 * - GET: Retrieve all shift templates
 * 
 * Shifts represent standard work periods that can be assigned to employees
 * in schedules. Each shift includes timing, staffing requirements, and
 * supervisor requirements.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

/**
 * Type Definition
 * Using database type to ensure type safety with Supabase
 */
type Shift = Database['public']['Tables']['shifts']['Row']

/**
 * Validation Schemas
 * Define the shape and constraints for shift data
 */

/**
 * Complete Shift Schema
 * Used for validating database records and API responses
 * Includes all fields that define a shift template
 */
const shiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  duration_hours: z.number(),
  min_staff_count: z.number(),
  requires_supervisor: z.boolean(),
  crosses_midnight: z.boolean(),
  created_at: z.string().nullable()
})

/**
 * API Response Schema
 * Wraps shift data in a response object
 */
const shiftsResponseSchema = z.object({
  shifts: z.array(shiftSchema)
})

/**
 * GET /api/shifts
 * Retrieves all shift templates from the database
 * Ordered by start time for consistent presentation
 * Accessible to all authenticated users
 * 
 * Returns: Array of shift objects containing:
 * - Shift timing (start/end times, duration)
 * - Staffing requirements (minimum staff, supervisor needs)
 * - Shift properties (name, midnight crossing)
 */
export const GET = createRouteHandler(
  async (req, { supabase }) => {
    // Fetch all shifts, ordered by start time
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch shifts', 500)
    }

    // Validate and return response data
    const validatedResponse = shiftsResponseSchema.parse({ 
      shifts: shifts || [] 
    })

    return NextResponse.json(validatedResponse)
  }
) 