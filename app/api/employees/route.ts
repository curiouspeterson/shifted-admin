import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Response validation schema
const employeeSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().nullable(),
  position: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  user_id: z.string().nullable()
})

const employeesResponseSchema = z.object({
  employees: z.array(employeeSchema)
})

export const GET = createRouteHandler(
  async (req, { supabase }) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) {
      throw new AppError('Failed to fetch employees', 500)
    }

    // Validate response data
    const validatedResponse = employeesResponseSchema.parse({ employees: data })

    return NextResponse.json(validatedResponse)
  },
  { requireSupervisor: true } // Only supervisors can list all employees
)