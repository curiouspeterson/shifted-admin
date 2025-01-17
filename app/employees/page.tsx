/**
 * Employees Page
 * Last Updated: 2025-01-16
 * 
 * Main page component for displaying and managing employees.
 */

import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { errorLogger } from '@/lib/logging/error-logger'
import { EmployeeList } from './employee-list'
import { Employee } from './types'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function EmployeesPage() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Employee[]>()

    if (error) {
      errorLogger.error('Failed to fetch employees', {
        error,
        context: {
          component: 'EmployeesPage',
          action: 'fetchEmployees',
          timestamp: new Date().toISOString()
        }
      })
      throw error
    }
    
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Employees</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <EmployeeList employees={employees || []} />
        </Suspense>
      </div>
    )
  } catch (error) {
    errorLogger.error('Error in employees page', {
      error,
      context: {
        component: 'EmployeesPage',
        action: 'render',
        timestamp: new Date().toISOString()
      }
    })
    throw error // Let error boundary handle the UI
  }
} 