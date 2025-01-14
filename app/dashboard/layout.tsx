/**
 * Dashboard Layout Component
 * Last Updated: 2024
 * 
 * A server-side layout component that provides the common structure
 * for all dashboard pages. Handles authentication, employee data
 * fetching, and navigation rendering.
 * 
 * Features:
 * - Authentication check
 * - Employee data fetching
 * - Navigation bar
 * - Responsive layout
 * - Automatic redirection
 */

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '../components/DashboardNav'

/**
 * Dashboard Layout Component
 * Wraps all dashboard pages with common layout and authentication
 * 
 * @param props - Component properties
 * @param props.children - Child components to render
 * @returns A layout wrapper with navigation and authentication
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Validate user session
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    redirect('/sign-in')
  }

  // Fetch employee data for navigation
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position')
    .eq('user_id', session.user.id)
    .maybeSingle()

  // Handle employee data errors
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
      {/* Navigation Bar */}
      <DashboardNav employee={employee} />
      
      {/* Main Content Area */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
} 