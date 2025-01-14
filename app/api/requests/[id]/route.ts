import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
type TimeOffRequestUpdate = Database['public']['Tables']['time_off_requests']['Update']

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

const timeOffRequestUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'denied'])
})

export const PUT = createRouteHandler(
  async (req, { supabase, session, params }) => {
    if (!params?.id) {
      throw new AppError('Request ID is required', 400)
    }

    const body = await req.json()
    const validatedData = timeOffRequestUpdateSchema.parse(body)

    const now = new Date().toISOString()
    const updateData: TimeOffRequestUpdate = {
      ...validatedData,
      updated_at: now
    }

    const { data: request, error } = await supabase
      .from('time_off_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update request', 500)
    }

    if (!request) {
      throw new AppError('Request not found', 404)
    }

    // Validate response data
    const validatedRequest = timeOffRequestSchema.parse(request)

    return NextResponse.json({ request: validatedRequest })
  },
  { requireSupervisor: true }
) 