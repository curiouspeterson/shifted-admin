import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/app/lib/supabase/database.types'

type Assignment = Database['public']['Tables']['schedule_assignments']['Row']
type AssignmentInsert = Database['public']['Tables']['schedule_assignments']['Insert']

// Validation schemas
const assignmentSchema = z.object({
  id: z.string(),
  schedule_id: z.string(),
  employee_id: z.string(),
  shift_id: z.string(),
  date: z.string(),
  is_supervisor_shift: z.boolean(),
  overtime_hours: z.number().nullable(),
  overtime_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
})

const assignmentInputSchema = z.object({
  employee_id: z.string(),
  shift_id: z.string(),
  date: z.string(),
  is_supervisor_shift: z.boolean().optional()
})

const assignmentsResponseSchema = z.object({
  assignments: z.array(assignmentSchema)
})

export const GET = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const { data: assignments, error } = await supabase
      .from('schedule_assignments')
      .select(`
        *,
        employee:employees(*),
        shift:shifts(*)
      `)
      .eq('schedule_id', params.id)

    if (error) {
      throw new AppError('Failed to fetch assignments', 500)
    }

    // Validate response data
    const validatedResponse = assignmentsResponseSchema.parse({ 
      assignments: assignments || [] 
    })

    return NextResponse.json(validatedResponse)
  }
)

export const POST = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Schedule ID is required', 400)
    }

    const body = await req.json()
    const validatedData = assignmentInputSchema.parse(body)

    const now = new Date().toISOString()
    const newAssignment: AssignmentInsert = {
      ...validatedData,
      schedule_id: params.id,
      created_at: now,
      updated_at: now
    }

    const { data: assignment, error } = await supabase
      .from('schedule_assignments')
      .insert(newAssignment)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to create assignment', 500)
    }

    // Validate response data
    const validatedAssignment = assignmentSchema.parse(assignment)

    return NextResponse.json({ assignment: validatedAssignment })
  },
  { requireSupervisor: true }
) 