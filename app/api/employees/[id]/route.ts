import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Input validation schema
const employeeUpdateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional()
})

export const PUT = createRouteHandler(
  async (req, { supabase, params }) => {
    if (!params?.id) {
      throw new AppError('Employee ID is required', 400)
    }

    const body = await req.json()
    const validatedData = employeeUpdateSchema.parse(body)

    const { data: employee, error } = await supabase
      .from('employees')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw new AppError('Failed to update employee', 500)
    }

    if (!employee) {
      throw new AppError('Employee not found', 404)
    }

    return NextResponse.json({ employee })
  },
  { requireSupervisor: true }
) 