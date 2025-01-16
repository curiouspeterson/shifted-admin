/**
 * Schedule Actions
 * Last Updated: 2024-01-16
 * 
 * Server actions for managing schedules. These actions handle data mutations
 * and revalidation of affected routes.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { scheduleInputSchema } from '@/lib/schemas/schedule'
import type { Schedule } from '@/lib/types/scheduling'

/**
 * Create a new schedule
 */
export async function createSchedule(data: z.infer<typeof scheduleInputSchema>) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        ...data,
        status: 'draft',
        version: 1,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/schedules')
    return schedule
  } catch (error) {
    console.error('Failed to create schedule:', error)
    throw new Error('Failed to create schedule. Please try again.')
  }
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<z.infer<typeof scheduleInputSchema>>
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/schedules')
    revalidatePath(`/dashboard/schedules/${id}`)
    return schedule
  } catch (error) {
    console.error('Failed to update schedule:', error)
    throw new Error('Failed to update schedule. Please try again.')
  }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const id = formData.get('id')
  
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid schedule ID')
  }
  
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/dashboard/schedules')
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    throw new Error('Failed to delete schedule. Please try again.')
  }
}

/**
 * Publish a schedule
 */
export async function publishSchedule(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const id = formData.get('id')
  
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid schedule ID')
  }
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        version: 1
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/schedules')
    revalidatePath(`/dashboard/schedules/${id}`)
    return schedule
  } catch (error) {
    console.error('Failed to publish schedule:', error)
    throw new Error('Failed to publish schedule. Please try again.')
  }
}

/**
 * Unpublish a schedule
 */
export async function unpublishSchedule(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const id = formData.get('id')
  
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid schedule ID')
  }
  
  try {
    const { data: schedule, error } = await supabase
      .from('schedules')
      .update({
        status: 'draft',
        published_at: null,
        published_by: null
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard/schedules')
    revalidatePath(`/dashboard/schedules/${id}`)
    return schedule
  } catch (error) {
    console.error('Failed to unpublish schedule:', error)
    throw new Error('Failed to unpublish schedule. Please try again.')
  }
}

/**
 * Get schedules with pagination and filtering
 */
export async function getSchedules(params: {
  limit?: number
  offset?: number
  sort?: 'start_date' | 'end_date' | 'status' | 'created_at'
  order?: 'asc' | 'desc'
  status?: 'draft' | 'published' | 'archived'
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    let query = supabase
      .from('schedules')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status)
    }
    
    // Apply sorting
    if (params.sort) {
      query = query.order(params.sort, {
        ascending: params.order === 'asc'
      })
    }
    
    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit)
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }
    
    const { data: schedules, error, count } = await query
    
    if (error) throw error
    
    return {
      schedules,
      count: count || 0
    }
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    throw new Error('Failed to fetch schedules. Please try again.')
  }
} 