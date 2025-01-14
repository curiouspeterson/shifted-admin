/**
 * Schedule Details API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing individual schedule records.
 * Currently supports:
 * - GET: Retrieve a specific schedule by ID
 * - PUT: Update schedule details (status, dates, publication state)
 * 
 * GET operations are available to all authenticated users.
 * PUT operations are restricted to supervisors only.
 * The route uses dynamic path parameters to identify the target schedule.
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
type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

/**
 * Validation Schemas
 * Define the shape and constraints for schedule data
 */

/**
 * Schedule Schema
 * Used for validating schedule records from the database
 * Ensures all required fields are present and correctly typed
 */
const scheduleSchema = z.object({
  id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.string(),
  is_published: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  published_at: z.string().nullable(),
  published_by: z.string().nullable()
})

/**
 * Schedule Update Schema
 * Used for validating PUT request bodies
 * Only allows updating specific fields while maintaining optional updates
 */
const scheduleUpdateSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  is_published: z.boolean().optional()
})

/**
 * GET /api/schedules/[id]
 * Retrieves a specific schedule by ID
 * Available to all authenticated users
 * Returns: The schedule record if found
 * Throws: 404 if not found, 400 if ID missing, 500 if fetch fails
 */
export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .select()
      .eq('id', params.id)
      .single()

    if (error) {
      throw new AppError('Failed to fetch schedule', 500)
    }

    if (!schedule) {
      throw new AppError('Schedule not found', 404)
    }

    // Validate response data
    const validatedSchedule = scheduleSchema.parse(schedule)

    return NextResponse.json({ schedule: validatedSchedule })
  }
)

/**
 * PUT /api/schedules/[id]
 * Updates a schedule's details
 * Restricted to supervisors only
 * Body: Updated schedule fields (dates, status, publication state)
 * Returns: The updated schedule record
 * Throws: 404 if not found, 400 if ID missing, 500 if update fails
 */
export const PUT = createRouteHandler(
  async (req, { supabase, session, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const body = await req.json()
    const validatedData = scheduleUpdateSchema.parse(body)

    const now = new Date().toISOString()
    const updateData: ScheduleUpdate = {
      ...validatedData,
      updated_at: now
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update schedule', 500)
    }

    if (!schedule) {
      throw new AppError('Schedule not found', 404)
    }

    // Validate response data
    const validatedSchedule = scheduleSchema.parse(schedule)

    return NextResponse.json({ schedule: validatedSchedule })
  },
  { requireSupervisor: true }
) 