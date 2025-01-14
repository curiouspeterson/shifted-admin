/**
 * Employees API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing employees.
 * Currently supports:
 * - GET: Retrieve all employees (supervisor access only)
 * 
 * The route uses Zod for request/response validation and implements
 * proper error handling and type safety.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Employee Data Validation Schema
 * Defines the expected shape of employee data and enforces type safety
 */
const employeeSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  position: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  user_id: z.string().nullable()
})

/**
 * API Response Schema
 * Wraps the employee data in a response object with proper typing
 */
const employeesResponseSchema = z.object({
  employees: z.array(employeeSchema)
})

/**
 * GET /api/employees
 * Retrieves all employees from the database
 * Requires supervisor access
 * Returns: Array of employee objects sorted by last name
 */
export const GET = createRouteHandler(
  async (req, { supabase }) => {
    // Query all employees, ordered by last name
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) {
      throw new AppError('Failed to fetch employees', 500)
    }

    // Validate response data against schema before returning
    const validatedResponse = employeesResponseSchema.parse({ employees: data })

    return NextResponse.json(validatedResponse)
  },
  { requireSupervisor: true } // Access control: only supervisors can list all employees
)