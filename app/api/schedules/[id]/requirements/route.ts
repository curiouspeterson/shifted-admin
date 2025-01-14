// app/api/requirements/route.ts
import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'

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

const updateRequirementSchema = z.object({
  min_total_staff: z.number(),
  min_supervisors: z.number()
})

export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const { data: requirements, error } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', params.id)
      .order('start_time')

    if (error) {
      throw new AppError('Failed to fetch requirements', 500)
    }

    // Validate response data
    const validatedResponse = timeRequirementsResponseSchema.parse({ 
      requirements: requirements || [] 
    })

    return NextResponse.json(validatedResponse)
  },
  { requireSupervisor: true }
)

export const PUT = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const body = await req.json()
    const { id: requirementId, ...updateData } = body

    if (!requirementId) {
      throw new AppError('Requirement ID is required', 400)
    }

    // Validate update data
    const validatedData = updateRequirementSchema.parse(updateData)

    const { data: requirement, error } = await supabase
      .from('time_based_requirements')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', requirementId)
      .eq('schedule_id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update requirement', 500)
    }

    if (!requirement) {
      throw new AppError('Requirement not found', 404)
    }

    // Validate response data
    const validatedRequirement = timeRequirementSchema.parse(requirement)

    return NextResponse.json(validatedRequirement)
  },
  { requireSupervisor: true }
)