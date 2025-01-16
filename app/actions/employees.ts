'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  position: z.string().min(2),
})

export async function addEmployee(data: z.infer<typeof employeeSchema>) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('employees')
    .insert({
      name: data.name,
      email: data.email,
      position: data.position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error adding employee:', error)
    throw new Error('Failed to add employee')
  }

  revalidatePath('/dashboard/employees')
} 