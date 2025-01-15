/**
 * New Schedule Page Component
 * Last Updated: 2024-03
 * 
 * A server component that handles data fetching and renders the schedule form.
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ScheduleForm } from '@/components/schedule/schedule-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

/**
 * Loading component for the schedule form
 */
function ScheduleFormLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

/**
 * New Schedule Page Component
 * Handles data fetching and renders the schedule form
 */
export default async function NewSchedulePage() {
  // Get current date as default start date
  const today = new Date()
  const defaultStartDate = today.toISOString().split('T')[0]

  // Calculate default end date (14 days from start)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 13)
  const defaultEndDate = endDate.toISOString().split('T')[0]

  // Default form data
  const defaultData = {
    name: '',
    description: '',
    start_date: defaultStartDate,
    end_date: defaultEndDate,
    is_active: true,
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Schedule</h1>
      <Suspense fallback={<ScheduleFormLoader />}>
        <ScheduleForm initialData={defaultData} />
      </Suspense>
    </div>
  )
} 