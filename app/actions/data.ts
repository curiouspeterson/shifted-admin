/**
 * Data Actions
 * Last Updated: 2025-01-16
 * 
 * Server actions for data mutations following Next.js 14 best practices.
 * Uses Supabase for data storage and implements proper cache invalidation.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server-side'
import type { Database } from '@/lib/database/database.types'
import { toast } from 'sonner'

type Tables = Database['public']['Tables']
type ScheduleStatusType = Database['public']['Enums']['schedule_status']

/**
 * Create employee
 */
export async function createEmployee(data: {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  position: string
  department: string
  is_active?: boolean
}) {
  try {
    const supabase = createServerComponentClient()
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone ?? null,
        position: data.position,
        department: data.department,
        is_active: data.is_active ?? true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/employees', 'page')
    return { data: employee, error: null }
  } catch (error) {
    console.error('Error creating employee:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create employee'
    }
  }
}

/**
 * Update employee
 */
export async function updateEmployee(
  id: string,
  data: Partial<{
    first_name: string
    last_name: string
    email: string
    phone: string | null
    position: string
    department: string
    is_active: boolean
  }>
) {
  try {
    const supabase = createServerComponentClient()
    const { data: employee, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/employees', 'page')
    revalidatePath(`/employees/${id}`, 'page')
    return { data: employee, error: null }
  } catch (error) {
    console.error('Error updating employee:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update employee'
    }
  }
}

/**
 * Create schedule
 */
export async function createSchedule(data: {
  title: string
  description?: string | null
  start_date: string
  end_date: string
  status?: ScheduleStatusType
}) {
  try {
    const supabase = createServerComponentClient()
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        title: data.title,
        description: data.description ?? null,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status ?? 'draft'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/schedules', 'page')
    return { data: schedule, error: null }
  } catch (error) {
    console.error('Error creating schedule:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create schedule'
    }
  }
}

/**
 * Update schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    start_date: string
    end_date: string
    status: ScheduleStatusType
  }>
) {
  try {
    const supabase = createServerComponentClient()
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/schedules', 'page')
    revalidatePath(`/schedules/${id}`, 'page')
    return { data: schedule, error: null }
  } catch (error) {
    console.error('Error updating schedule:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update schedule'
    }
  }
}

/**
 * Create schedule assignment
 */
export async function createAssignment(data: {
  schedule_id: string
  shift_id: string
  employee_id: string
  date: string
  is_supervisor_shift?: boolean
}) {
  const supabase = createServerComponentClient()
  const { data: assignment, error } = await supabase
    .from('schedule_assignments')
    .insert({
      schedule_id: data.schedule_id,
      shift_id: data.shift_id,
      employee_id: data.employee_id,
      date: data.date,
      is_supervisor_shift: data.is_supervisor_shift ?? false
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/schedules', 'page')
  revalidatePath(`/schedules/${data.schedule_id}`, 'page')
  return assignment
}

/**
 * Update schedule assignment
 */
export async function updateAssignment(
  assignmentId: string,
  data: Partial<{
    schedule_id: string
    shift_id: string
    employee_id: string
    date: string
    is_supervisor_shift: boolean
    overtime_hours: number | null
    overtime_status: string | null
  }>
) {
  const supabase = createServerComponentClient()
  const { data: assignment, error } = await supabase
    .from('schedule_assignments')
    .update(data)
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) throw error

  if (data.schedule_id) {
    revalidatePath('/dashboard/schedules', 'page')
    revalidatePath(`/schedules/${data.schedule_id}`, 'page')
  }
  return assignment
}

/**
 * Delete schedule assignment
 */
export async function deleteAssignment(scheduleId: string, assignmentId: string) {
  const supabase = createServerComponentClient()
  const { error } = await supabase
    .from('schedule_assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw error

  revalidatePath('/dashboard/schedules', 'page')
  revalidatePath(`/schedules/${scheduleId}`, 'page')
} 