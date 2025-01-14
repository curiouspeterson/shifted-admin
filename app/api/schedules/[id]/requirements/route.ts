/**
 * Schedule Requirements API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing time-based staffing requirements
 * for specific schedules. Currently supports:
 * - GET: Retrieve all requirements for a specific schedule
 * - PUT: Update staffing levels for a specific requirement
 * 
 * All operations are restricted to supervisors only.
 * The route uses dynamic path parameters to identify the target schedule.
 * Requirements define minimum staffing levels and supervisor counts for specific time blocks.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'

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
 * Update Schema
 * Defines the fields that can be updated for a requirement
 * Only allows modifying staffing level requirements
 */
const updateRequirementSchema = z.object({
  min_total_staff: z.number(),
  min_supervisors: z.number()
})

/**
 * GET /api/schedules/[id]/requirements
 * Retrieves all time-based requirements for a specific schedule
 * Restricted to supervisors only
 * Returns: Array of requirement objects ordered by start time
 * Throws: 400 if schedule ID missing, 500 if fetch fails
 */
export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const { data: requirements, error } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', params.id)
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch requirements', 500)
    }

    // Validate response data
    const validatedResponse = timeRequirementsResponseSchema.parse({ 
      requirements: requirements || [] 
    })

    return NextResponse.json(validatedResponse)
  },
  { requireSupervisor: true }
)

/**
 * PUT /api/schedules/[id]/requirements
 * Updates staffing levels for a specific requirement
 * Restricted to supervisors only
 * Body: Requirement ID and updated staffing levels
 * Returns: The updated requirement record
 * Throws: 400 if IDs missing, 404 if not found, 500 if update fails
 */
export const PUT = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const body = await req.json()
    const { id: requirementId, ...updateData } = body

    if (!requirementId) {
      throw new AppError('Requirement ID is required', 400)
    }

    // Validate update data
    const validatedData = updateRequirementSchema.parse(updateData)

    const { data: requirement, error } = await supabase
      .from('time_based_requirements')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', requirementId)
      .eq('schedule_id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update requirement', 500)
    }

    if (!requirement) {
      throw new AppError('Requirement not found', 404)
    }

    // Validate response data
    const validatedRequirement = timeRequirementSchema.parse(requirement)

    return NextResponse.json(validatedRequirement)
  },
  { requireSupervisor: true }
)