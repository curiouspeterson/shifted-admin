/**
 * Assignment Actions
 * Last Updated: 2024-01-15
 * 
 * Server actions for managing schedule assignments.
 */

'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { toDbAssignment, toDomainAssignment } from '@/lib/database/mappers/assignment'

// Assignment input schema
const assignmentSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  shiftId: z.string().min(1, 'Shift is required'),
  startTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  endTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .nullable()
})

type AssignmentInput = z.infer<typeof assignmentSchema>

/**
 * Creates a new schedule assignment
 */
export async function createAssignment(data: AssignmentInput) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Validate input
  const validatedData = assignmentSchema.parse(data)

  // Convert to database format
  const dbData = toDbAssignment(validatedData)

  // Insert into database
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert(dbData)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Convert to domain format
  const domainAssignment = toDomainAssignment(assignment)

  // Revalidate schedule page
  revalidatePath(`/dashboard/schedules/${data.scheduleId}`)

  return domainAssignment
}

/**
 * Updates an existing schedule assignment
 */
export async function updateAssignment(id: string, data: AssignmentInput) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Validate input
  const validatedData = assignmentSchema.parse(data)

  // Convert to database format
  const dbData = toDbAssignment(validatedData)

  // Update in database
  const { data: assignment, error } = await supabase
    .from('assignments')
    .update(dbData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Convert to domain format
  const domainAssignment = toDomainAssignment(assignment)

  // Revalidate schedule page
  revalidatePath(`/dashboard/schedules/${data.scheduleId}`)

  return domainAssignment
}

/**
 * Deletes a schedule assignment
 */
export async function deleteAssignment(id: string, scheduleId: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Revalidate schedule page
  revalidatePath(`/dashboard/schedules/${scheduleId}`)
} 