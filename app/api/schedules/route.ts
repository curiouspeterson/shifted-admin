/**
 * Schedules API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing schedules.
 * Supports:
 * - GET: Retrieve all schedules (accessible to all authenticated users)
 * - POST: Create a new schedule (supervisor access only)
 * 
 * Uses Zod for request/response validation and implements proper
 * error handling and type safety.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

/**
 * Type Definitions
 * Imported from the database types to ensure consistency
 */
type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']

/**
 * Schedule Validation Schemas
 * Define the shape and constraints for schedule data
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
 * Input validation schema for creating new schedules
 * Only requires start and end dates; other fields are set automatically
 */
const scheduleInputSchema = z.object({
  start_date: z.string(),
  end_date: z.string()
})

/**
 * API Response Schema
 * Wraps schedule data in a response object with proper typing
 */
const schedulesResponseSchema = z.object({
  schedules: z.array(scheduleSchema)
})

/**
 * GET /api/schedules
 * Retrieves all schedules from the database
 * Ordered by creation date (newest first)
 * Accessible to all authenticated users
 */
export const GET = createRouteHandler(
  async (req, { supabase }) => {
    // Query all schedules, ordered by creation date
    const { data, error } = await supabase
      .from('schedules')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('Failed to fetch schedules', 500)
    }

    // Validate response data, providing empty array if no data
    const validatedResponse = schedulesResponseSchema.parse({ schedules: data || [] })

    return NextResponse.json(validatedResponse)
  }
)

/**
 * POST /api/schedules
 * Creates a new schedule
 * Requires supervisor access
 * Body must contain start_date and end_date
 * Returns: The newly created schedule
 */
export const POST = createRouteHandler(
  async (req, { supabase, session }) => {
    // Parse and validate request body
    const body = await req.json()
    const validatedData = scheduleInputSchema.parse(body)

    // Prepare new schedule data with defaults
    const now = new Date().toISOString()
    const newSchedule: ScheduleInsert = {
      ...validatedData,
      created_by: session.user.id,
      status: 'draft',
      is_published: false,
      created_at: now,
      updated_at: now
    }

    // Insert new schedule and return the created record
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert(newSchedule)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create schedule', 500)
    }

    return NextResponse.json({ schedule })
  },
  { requireSupervisor: true }
) 