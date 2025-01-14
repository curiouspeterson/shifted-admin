/**
 * Employee Details API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing individual employee records.
 * Currently supports:
 * - GET: Retrieve a specific employee by ID
 * - PATCH: Update employee details
 * - DELETE: Remove an employee record
 * 
 * GET operations are available to all authenticated users.
 * PATCH and DELETE operations are restricted to supervisors only.
 * The route uses dynamic path parameters to identify the target employee.
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
type Employee = Database['public']['Tables']['employees']['Row']

/**
 * Validation Schemas
 * Define the shape and constraints for employee data
 */

/**
 * Employee Update Schema
 * Used for validating PATCH request bodies
 * Only allows updating specific fields
 */
const employeeUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().min(1).optional(),
  hourly_rate: z.number().positive().optional(),
  start_date: z.string().datetime().optional(),
  is_active: z.boolean().optional()
})

/**
 * GET /api/employees/[id]
 * Retrieves a specific employee by ID
 * Available to all authenticated users
 * Returns: The employee record if found
 * Throws: 404 if not found, 400 if ID missing
 */
export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Employee ID is required', 400)
    }

    // Fetch employee by ID
    const { data: employee, error } = await supabase
      .from('employees')
      .select()
      .eq('id', params.id)
      .single()

    if (error || !employee) {
      throw new AppError('Employee not found', 404)
    }

    return NextResponse.json({ employee })
  }
)

/**
 * PATCH /api/employees/[id]
 * Updates an employee's details
 * Restricted to supervisors only
 * Body: Updated employee fields
 * Returns: The updated employee record
 * Throws: 404 if not found, 400 if ID missing or validation fails
 */
export const PATCH = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Employee ID is required', 400)
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = employeeUpdateSchema.parse(body)

    // Update employee record
    const { data: employee, error } = await supabase
      .from('employees')
      .update({ 
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !employee) {
      throw new AppError('Employee not found', 404)
    }

    return NextResponse.json({ employee })
  },
  { requireSupervisor: true }
)

/**
 * DELETE /api/employees/[id]
 * Removes an employee record
 * Restricted to supervisors only
 * Returns: Success message
 * Throws: 404 if not found, 400 if ID missing
 */
export const DELETE = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Employee ID is required', 400)
    }

    // Delete the employee record
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw new AppError('Failed to delete employee', 500)
    }

    return NextResponse.json({ 
      message: 'Employee successfully deleted' 
    })
  },
  { requireSupervisor: true }
) 