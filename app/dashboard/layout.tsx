import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '../components/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    redirect('/sign-in')
  }

  // Get employee details
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (employeeError) {
    console.error('Error fetching employee:', employeeError)
    redirect('/sign-in')
  }

  if (!employee) {
    console.error('No employee record found')
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNav employee={employee} />
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
} 