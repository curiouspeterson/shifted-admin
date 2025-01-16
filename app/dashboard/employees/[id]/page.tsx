import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { EditEmployeeForm } from './edit-employee-form'
import { notFound } from 'next/navigation'

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, phone, position, is_active')
    .eq('id', params.id)
    .single()

  if (error || !employee) {
    console.error('Error fetching employee:', error)
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-black mb-8">Edit Employee</h1>
        <EditEmployeeForm employee={employee} />
      </div>
    </div>
  )
} 