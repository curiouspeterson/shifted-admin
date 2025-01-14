import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type Availability = Database['public']['Tables']['employee_availability']['Row']
type AvailabilityInsert = Database['public']['Tables']['employee_availability']['Insert']

// Validation schemas
const availabilitySchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_available: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
})

const availabilityInputSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  is_available: z.boolean()
})

const availabilityResponseSchema = z.object({
  availability: z.array(availabilitySchema)
})

export const GET = createRouteHandler(
  async (req, { supabase, session }) => {
    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404)
    }

    const { data: availability, error } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week')

    if (error) {
      throw new AppError('Failed to fetch availability', 500)
    }

    // Validate response data
    const validatedResponse = availabilityResponseSchema.parse({ 
      availability: availability || [] 
    })

    return NextResponse.json(validatedResponse)
  }
)

export const POST = createRouteHandler(
  async (req, { supabase, session }) => {
    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      throw new AppError('Employee record not found', 404)
    }

    const body = await req.json()
    const validatedData = availabilityInputSchema.parse(body)

    const now = new Date().toISOString()
    const newAvailability: AvailabilityInsert = {
      ...validatedData,
      employee_id: employee.id,
      created_at: now,
      updated_at: now
    }

    // Upsert availability for the day
    const { data: availability, error } = await supabase
      .from('employee_availability')
      .upsert(newAvailability)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update availability', 500)
    }

    // Validate response data
    const validatedAvailability = availabilitySchema.parse(availability)

    return NextResponse.json({ availability: validatedAvailability })
  }
) 