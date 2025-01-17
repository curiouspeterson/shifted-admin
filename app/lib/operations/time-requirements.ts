/**
 * Time Requirements Operations
 * Last Updated: 2025-01-17
 * 
 * Handles database operations for schedule time requirements.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const timeRequirementSchema = z.object({
  schedule_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  min_employees: z.number().min(1),
  max_employees: z.number().min(1),
  notes: z.string().optional()
})

export type TimeRequirement = z.infer<typeof timeRequirementSchema>

export interface DatabaseError {
  message: string
  details?: unknown
}

export class TimeRequirementsOperations {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(data: TimeRequirement) {
    const result = timeRequirementSchema.safeParse(data)
    
    if (!result.success) {
      return {
        data: null,
        error: {
          message: 'Invalid requirement data',
          details: result.error.errors
        } as DatabaseError
      }
    }

    return this.supabase
      .from('schedule_requirements')
      .insert(result.data)
      .select()
      .single()
  }

  async update(id: string, data: Partial<TimeRequirement>) {
    const result = timeRequirementSchema.partial().safeParse(data)
    
    if (!result.success) {
      return {
        data: null,
        error: {
          message: 'Invalid requirement data',
          details: result.error.errors
        } as DatabaseError
      }
    }

    return this.supabase
      .from('schedule_requirements')
      .update(result.data)
      .eq('id', id)
      .select()
      .single()
  }

  async delete(id: string) {
    return this.supabase
      .from('schedule_requirements')
      .delete()
      .eq('id', id)
  }

  async getByScheduleId(scheduleId: string) {
    return this.supabase
      .from('schedule_requirements')
      .select()
      .eq('schedule_id', scheduleId)
  }
} 