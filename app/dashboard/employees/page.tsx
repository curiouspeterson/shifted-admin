/**
 * Employees Page
 * Last Updated: 2024-01-15
 * 
 * Displays a list of employees and allows for employee management.
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AddEmployeeButton } from '../../employees/add-employee-button'
import { EmployeeList } from '../../employees/employee-list'
import { Employee, EmployeeStatus } from '../../employees/types'

export default async function EmployeesPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: employeesRaw, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, phone, position, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
    throw error
  }

  // Transform the data to match the expected format
  const employees = employeesRaw?.map(emp => ({
    id: emp.id,
    name: [emp.first_name, emp.last_name].filter(Boolean).join(' '),
    email: emp.email,
    phone: emp.phone,
    position: emp.position,
    status: emp.is_active ? ('active' as EmployeeStatus) : ('inactive' as EmployeeStatus),
    created_at: emp.created_at,
    updated_at: emp.updated_at
  })) || []

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black">Employees</h1>
        <AddEmployeeButton />
      </div>
      <EmployeeList employees={employees} />
    </div>
  )
} 