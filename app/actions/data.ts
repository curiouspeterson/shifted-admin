/**
 * Data Actions
 * Last Updated: 2025-03-19
 * 
 * Server actions for handling data operations.
 */

'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/app/lib/types/supabase'

type Tables = Database['public']['Tables']
type Employee = Tables['employees']['Row']

export async function updateEmployee(formData: FormData) {
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

  const id = formData.get('id')?.toString()
  if (!id) throw new Error('Employee ID is required')

  const updates: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>> = {}

  const first_name = formData.get('first_name')?.toString()
  if (first_name) updates.first_name = first_name

  const last_name = formData.get('last_name')?.toString()
  if (last_name) updates.last_name = last_name

  const email = formData.get('email')?.toString()
  if (email) updates.email = email

  const role = formData.get('role')?.toString()
  if (role) updates.role = role

  try {
    const { error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/employees')
    return { message: 'Employee updated successfully' }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
} 