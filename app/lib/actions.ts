/**
 * Server Actions
 * Last Updated: 2024-03-21
 * 
 * Server actions for data mutations following Next.js 14 best practices.
 * Uses Supabase for data storage and implements proper cache invalidation.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database/database.types'

type Tables = Database['public']['Tables']

/**
 * Revalidate a path
 */
function revalidate(path: string) {
  revalidatePath(path, 'page')
}

/**
 * Create employee
 */
export async function createEmployee(data: Tables['employees']['Insert']) {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/employees')
  return employee
}

/**
 * Update employee
 */
export async function updateEmployee(
  id: string,
  data: Tables['employees']['Update']
) {
  const supabase = createClient()
  const { data: employee, error } = await supabase
    .from('employees')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/employees')
  revalidate(`/employees/${id}`)
  return employee
}

/**
 * Create schedule
 */
export async function createSchedule(data: Tables['schedules']['Insert']) {
  const supabase = createClient()
  const { data: schedule, error } = await supabase
    .from('schedules')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/schedules')
  return schedule
}

/**
 * Update schedule
 */
export async function updateSchedule(
  id: string,
  data: Tables['schedules']['Update']
) {
  const supabase = createClient()
  const { data: schedule, error } = await supabase
    .from('schedules')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/schedules')
  revalidate(`/schedules/${id}`)
  return schedule
}

/**
 * Add assignment
 */
export async function addAssignment(
  scheduleId: string,
  employeeId: string
) {
  const supabase = createClient()
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({
      schedule_id: scheduleId,
      employee_id: employeeId,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/schedules')
  revalidate(`/schedules/${scheduleId}`)
  return assignment
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  scheduleId: string,
  assignmentId: string,
  status: 'active' | 'inactive'
) {
  const supabase = createClient()
  const { data: assignment, error } = await supabase
    .from('assignments')
    .update({ status })
    .eq('id', assignmentId)
    .eq('schedule_id', scheduleId)
    .select()
    .single()

  if (error) throw error

  revalidate('/dashboard/schedules')
  revalidate(`/schedules/${scheduleId}`)
  return assignment
}

/**
 * Remove assignment
 */
export async function removeAssignment(scheduleId: string, assignmentId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('schedule_id', scheduleId)

  if (error) throw error

  revalidate('/dashboard/schedules')
  revalidate(`/schedules/${scheduleId}`)
} 