/**
 * Dashboard Layout Component
 * Last Updated: 2024-03-20
 * 
 * This layout wraps all dashboard pages and provides:
 * - Authentication check
 * - Navigation
 * - Common layout elements
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/DashboardNav'
import { AppProvider } from '@/lib/context/app-context'

/**
 * Dashboard Layout Component
 * Provides common layout elements for dashboard pages
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="py-10">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </AppProvider>
  )
} 