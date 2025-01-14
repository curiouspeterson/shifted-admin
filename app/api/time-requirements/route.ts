import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type TimeRequirement = Database['public']['Tables']['time_based_requirements']['Row']

// Validation schemas
const timeRequirementSchema = z.object({
  id: z.string(),
  schedule_id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  min_total_staff: z.number(),
  min_supervisors: z.number(),
  crosses_midnight: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable()
})

const timeRequirementsResponseSchema = z.object({
  requirements: z.array(timeRequirementSchema)
})

export const GET = createRouteHandler(
  async (req, { supabase }) => {
    const { data: requirements, error } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('is_active', true)
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch time requirements', 500)
    }

    // Validate response data
    const validatedResponse = timeRequirementsResponseSchema.parse({ 
      requirements: requirements || [] 
    })

    return NextResponse.json(validatedResponse)
  }
) 