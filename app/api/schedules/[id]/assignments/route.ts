/**
 * Schedule Assignments API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing schedule assignments.
 * Supports:
 * - GET: Retrieve all assignments for a specific schedule
 * - POST: Create a new assignment (supervisor access only)
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
type Assignment = Database['public']['Tables']['schedule_assignments']['Row']
type AssignmentInsert = Database['public']['Tables']['schedule_assignments']['Insert']

/**
 * Validation Schemas
 * Define the shape and constraints for assignment data
 */

/**
 * Complete Assignment Schema
 * Used for validating database records and API responses
 */
const assignmentSchema = z.object({
  id: z.string(),
  schedule_id: z.string(),
  employee_id: z.string(),
  shift_id: z.string(),
  date: z.string(),
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().nullable(),
  overtime_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

/**
 * Assignment Input Schema
 * Used for validating POST request bodies
 * Only includes fields that can be set by the client
 */
const assignmentInputSchema = z.object({
  employee_id: z.string(),
  shift_id: z.string(),
  date: z.string(),
  is_supervisor_shift: z.boolean().optional()
})

/**
 * API Response Schema
 * Wraps assignment data in a response object
 */
const assignmentsResponseSchema = z.object({
  assignments: z.array(assignmentSchema)
})

/**
 * GET /api/schedules/[id]/assignments
 * Retrieves all assignments for a specific schedule
 * Includes related employee and shift data
 * Accessible to all authenticated users
 */
export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    // Validate schedule ID from route parameter
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    // Fetch assignments with related data
    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        employee:employees(*),
        shift:shifts(*)
      `)
      .eq('schedule_id', params.id)

    if (error) {
      throw new AppError('Failed to fetch assignments', 500)
    }

    // Validate and return response data
    const validatedResponse = assignmentsResponseSchema.parse({ 
      assignments: assignments || [] 
    })

    return NextResponse.json(validatedResponse)
  }
)

/**
 * POST /api/schedules/[id]/assignments
 * Creates a new assignment for a specific schedule
 * Requires supervisor access
 * Body must contain employee_id, shift_id, and date
 * Returns: The newly created assignment
 */
export const POST = createRouteHandler(
  async (req, { supabase, params }) => {
    // Validate schedule ID from route parameter
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = assignmentInputSchema.parse(body)

    // Prepare new assignment data
    const now = new Date().toISOString()
    const newAssignment: AssignmentInsert = {
      ...validatedData,
      schedule_id: params.id,
      created_at: now,
      updated_at: now
    }

    // Insert new assignment and return the created record
    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .insert(newAssignment)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create assignment', 500)
    }

    // Validate and return the created assignment
    const validatedAssignment = assignmentSchema.parse(assignment)

    return NextResponse.json({ assignment: validatedAssignment })
  },
  { requireSupervisor: true }
) 