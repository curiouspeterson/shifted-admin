/**
 * Time-Based Requirements API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing staffing requirements
 * based on time periods. Currently supports:
 * - GET: Retrieve all active time-based staffing requirements
 * 
 * Time-based requirements define the minimum staffing levels and supervisor
 * requirements for specific time periods, independent of shift definitions.
 * These are used to validate schedule coverage and ensure proper staffing
 * levels throughout the day.
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
type TimeRequirement = Database['public']['Tables']['time_based_requirements']['Row']

/**
 * Validation Schemas
 * Define the shape and constraints for time requirement data
 */

/**
 * Complete Time Requirement Schema
 * Used for validating database records and API responses
 * Includes all fields that define a time-based requirement
 */
const timeRequirementSchema = z.object({
  id: z.string(),
  schedule_id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  min_total_staff: z.number(),
  min_supervisors: z.number(),
  crosses_midnight: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable()
})

/**
 * API Response Schema
 * Wraps time requirement data in a response object
 */
const timeRequirementsResponseSchema = z.object({
  requirements: z.array(timeRequirementSchema)
})

/**
 * GET /api/time-requirements
 * Retrieves all active time-based staffing requirements
 * Ordered by start time for consistent presentation
 * Only returns active requirements (is_active = true)
 * 
 * Returns: Array of requirement objects containing:
 * - Time period (start/end times)
 * - Staffing requirements (minimum total staff, minimum supervisors)
 * - Period properties (midnight crossing, active status)
 */
export const GET = createRouteHandler(
  async (req, { supabase }) => {
    // Fetch active requirements, ordered by start time
    const { data: requirements, error } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('is_active', true)
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch time requirements', 500)
    }

    // Validate and return response data
    const validatedResponse = timeRequirementsResponseSchema.parse({ 
      requirements: requirements || [] 
    })

    return NextResponse.json(validatedResponse)
  }
) 