/**
 * Employees Page
 * Last Updated: 2025-03-19
 * 
 * Main page component for displaying and managing employees.
 */

import { Suspense } from 'react'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import EmployeeList from './employee-list'
import type { Employee } from '@/app/lib/types/employees'
import { LoadingSpinner } from '@/app/components/ui/loading-spinner'

export default async function EmployeesPage() {
  try {
    const supabase = createClient()
    
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