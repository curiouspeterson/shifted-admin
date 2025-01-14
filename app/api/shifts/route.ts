import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type Shift = Database['public']['Tables']['shifts']['Row']

// Validation schemas
const shiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  duration_hours: z.number(),
  min_staff_count: z.number(),
  requires_supervisor: z.boolean(),
  crosses_midnight: z.boolean(),
  created_at: z.string().nullable()
})

const shiftsResponseSchema = z.object({
  shifts: z.array(shiftSchema)
})

export const GET = createRouteHandler(
  async (req, { supabase }) => {
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch shifts', 500)
    }

    // Validate response data
    const validatedResponse = shiftsResponseSchema.parse({ 
      shifts: shifts || [] 
    })

    return NextResponse.json(validatedResponse)
  }
) 