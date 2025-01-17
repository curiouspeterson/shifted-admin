/**
 * Employee Actions
 * Last Updated: 2025-01-16
 * 
 * Server actions for employee management.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { errorLogger } from '@/lib/logging/error-logger'

// Employee schema for validation and type inference
const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  position: z.string().min(2),
})

// Export the type for use in components
export type EmployeeFormData = z.infer<typeof employeeSchema>

export async function addEmployee(data: EmployeeFormData) {
  const supabase = createClient(cookies())

  const { error } = await supabase
    .from('employees')
    .insert({
      name: data.name,
      email: data.email,
      position: data.position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    errorLogger.error('Failed to add employee', {
      error,
      context: {
        name: data.name,
        email: data.email,
        position: data.position
      }
    })
    throw new Error('Failed to add employee')
  }

  revalidatePath('/dashboard/employees')
} 