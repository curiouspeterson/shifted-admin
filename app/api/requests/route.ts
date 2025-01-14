import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert']

// Validation schemas
const timeOffRequestSchema = z.object({
  id: z.string(),
  employee_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.string(),
  reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

const timeOffRequestInputSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().optional()
})

const timeOffRequestsResponseSchema = z.object({
  requests: z.array(timeOffRequestSchema)
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

    const { data: requests, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('Failed to fetch requests', 500)
    }

    // Validate response data
    const validatedResponse = timeOffRequestsResponseSchema.parse({ 
      requests: requests || [] 
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
    const validatedData = timeOffRequestInputSchema.parse(body)

    const now = new Date().toISOString()
    const newRequest: TimeOffRequestInsert = {
      ...validatedData,
      employee_id: employee.id,
      status: 'pending',
      created_at: now,
      updated_at: now
    }

    const { data: request, error } = await supabase
      .from('time_off_requests')
      .insert(newRequest)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create request', 500)
    }

    // Validate response data
    const validatedRequest = timeOffRequestSchema.parse(request)

    return NextResponse.json({ request: validatedRequest })
  }
) 