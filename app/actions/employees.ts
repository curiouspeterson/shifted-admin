/**
 * Employee Actions
 * Last Updated: 2025-03-19
 * 
 * Server actions for handling employee operations.
 */

'use server'

import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/types/supabase'

// Employee schema for validation and type inference
const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'supervisor', 'employee']),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().nullable(),
  is_active: z.boolean().default(true),
})

type EmployeeInput = z.infer<typeof employeeSchema>

export async function createEmployee(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string) {
          cookieStore.delete(name)
        },
      },
    }
  )

  try {
    const input: EmployeeInput = {
      first_name: formData.get('first_name')?.toString() ?? '',
      last_name: formData.get('last_name')?.toString() ?? '',
      email: formData.get('email')?.toString() ?? '',
      role: formData.get('role')?.toString() as 'admin' | 'supervisor' | 'employee',
      department: formData.get('department')?.toString() ?? '',
      phone: formData.get('phone')?.toString() ?? null,
      is_active: formData.get('is_active') === 'true',
    }

    const validatedData = employeeSchema.parse(input)

    const { error } = await supabase
      .from('employees')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      errorLogger.error('Failed to create employee', { error })
      throw error
    }

    revalidatePath('/dashboard/employees')
    return { message: 'Employee created successfully' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(err => err.message).join(', ')
      throw new Error(message)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
} 