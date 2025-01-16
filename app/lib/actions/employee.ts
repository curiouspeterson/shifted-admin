/**
 * Employee Server Actions
 * Last Updated: 2024-03-21
 * 
 * Server actions for employee-related operations.
 * These actions handle database operations and validation.
 */

'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type Employee,
  createEmployeeSchema,
  updateEmployeeSchema 
} from '@/lib/types/employee'
import {
  type DatabaseResult,
  type DbEmployee,
  createSuccessResult,
  createErrorResult,
  handleDatabaseError
} from '@/lib/types/database'

/**
 * Create a new employee
 */
export async function createEmployee(input: DbEmployee['Insert']): Promise<DatabaseResult<Employee>> {
  try {
    // Validate input
    const validatedData = createEmployeeSchema.parse(input)
    
    const supabase = createClient(cookies())
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error('Authentication error: ' + userError.message)
    if (!user) throw new Error('No authenticated user')

    // Insert employee with user_id
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...validatedData,
        user_id: user.id // Use the authenticated user's ID
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return createErrorResult('An employee with this email already exists')
      }
      throw error
    }

    // Revalidate employees page
    revalidatePath('/dashboard/employees')
    
    return createSuccessResult(data as Employee)
  } catch (error) {
    return handleDatabaseError(error)
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(input: DbEmployee['Update']): Promise<DatabaseResult<Employee>> {
  try {
    // Validate input
    const validatedData = updateEmployeeSchema.parse(input)
    
    const supabase = createClient(cookies())
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new Error('Authentication error: ' + userError.message)
    if (!user) throw new Error('No authenticated user')

    // Update employee
    const { data, error } = await supabase
      .from('employees')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) throw error

    // Revalidate employees page and employee detail page
    revalidatePath('/dashboard/employees')
    revalidatePath(`/dashboard/employees/${validatedData.id}`)
    
    return createSuccessResult(data as Employee)
  } catch (error) {
    return handleDatabaseError(error)
  }
}

/**
 * Get all employees
 */
export async function getEmployees(): Promise<DatabaseResult<Employee[]>> {
  try {
    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('employees')
      .select()
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return createSuccessResult(data as Employee[])
  } catch (error) {
    return handleDatabaseError(error)
  }
}

/**
 * Get a single employee by ID
 */
export async function getEmployee(id: string): Promise<DatabaseResult<Employee>> {
  try {
    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('employees')
      .select()
      .eq('id', id)
      .single()

    if (error) throw error
    
    return createSuccessResult(data as Employee)
  } catch (error) {
    return handleDatabaseError(error)
  }
} 