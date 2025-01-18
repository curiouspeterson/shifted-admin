/**
 * New Assignment Page
 * Last Updated: 2025-03-19
 * 
 * Server Component for creating new schedule assignments.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/app/lib/types/supabase'

type Params = {
  params: {
    id: string
  }
}

export default async function NewAssignmentPage({ params }: Params) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', params.id)
    .single()

  if (scheduleError) {
    throw scheduleError
  }

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)

  if (employeesError) {
    throw employeesError
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">New Assignment</h1>
      {/* Add assignment form component here */}
    </div>
  )
} 