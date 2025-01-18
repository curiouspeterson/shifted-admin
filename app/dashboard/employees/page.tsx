/**
 * Employees Page
 * Last Updated: 2025-03-19
 * 
 * Server Component that displays a list of employees.
 */

import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AddEmployeeButton from '@/app/employees/add-employee-button'
import EmployeeList from '@/app/employees/employee-list'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'
import type { Database } from '@/app/lib/types/supabase'

export default async function EmployeesPage() {
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

  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Employees</h1>
        <AddEmployeeButton />
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <EmployeeList employees={employees} />
      </Suspense>
    </div>
  )
} 