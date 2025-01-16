import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AddEmployeeButton } from './add-employee-button'
import { EmployeeList } from './employee-list'
import { Employee } from './types'

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
      console.error('Error fetching employees:', error)
      throw error
    }

    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <AddEmployeeButton />
        </div>
        <EmployeeList employees={employees || []} />
      </div>
    )
  } catch (error) {
    console.error('Error in EmployeesPage:', error)
    throw error
  }
} 