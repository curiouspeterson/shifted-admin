import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['schedules']['Insert']

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

const scheduleInputSchema = z.object({
  start_date: z.string(),
  end_date: z.string()
})

const schedulesResponseSchema = z.object({
  schedules: z.array(scheduleSchema)
})

export const GET = createRouteHandler(
  async (req, { supabase }) => {
    const { data, error } = await supabase
      .from('schedules')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('Failed to fetch schedules', 500)
    }

    // Validate response data
    const validatedResponse = schedulesResponseSchema.parse({ schedules: data || [] })

    return NextResponse.json(validatedResponse)
  }
)

export const POST = createRouteHandler(
  async (req, { supabase, session }) => {
    const body = await req.json()
    const validatedData = scheduleInputSchema.parse(body)

    const now = new Date().toISOString()
    const newSchedule: ScheduleInsert = {
      ...validatedData,
      created_by: session.user.id,
      status: 'draft',
      is_published: false,
      created_at: now,
      updated_at: now
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert(newSchedule)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create schedule', 500)
    }

    return NextResponse.json({ schedule })
  },
  { requireSupervisor: true }
) 