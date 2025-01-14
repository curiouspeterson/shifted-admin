import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleUpdate = Database['public']['Tables']['schedules']['Update']

// Validation schemas
const scheduleSchema = z.object({
  id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.string(),
  is_published: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  published_at: z.string().nullable(),
  published_by: z.string().nullable()
})

const scheduleUpdateSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  is_published: z.boolean().optional()
})

export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .select()
      .eq('id', params.id)
      .single()

    if (error) {
      throw new AppError('Failed to fetch schedule', 500)
    }

    if (!schedule) {
      throw new AppError('Schedule not found', 404)
    }

    // Validate response data
    const validatedSchedule = scheduleSchema.parse(schedule)

    return NextResponse.json({ schedule: validatedSchedule })
  }
)

export const PUT = createRouteHandler(
  async (req, { supabase, session, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const body = await req.json()
    const validatedData = scheduleUpdateSchema.parse(body)

    const now = new Date().toISOString()
    const updateData: ScheduleUpdate = {
      ...validatedData,
      updated_at: now
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update schedule', 500)
    }

    if (!schedule) {
      throw new AppError('Schedule not found', 404)
    }

    // Validate response data
    const validatedSchedule = scheduleSchema.parse(schedule)

    return NextResponse.json({ schedule: validatedSchedule })
  },
  { requireSupervisor: true }
) 