/**
 * Edit Schedule Page Component
 * Last Updated: 2024-03
 * 
 * A server component that handles fetching schedule data and rendering the edit form.
 * Features:
 * - Server-side data fetching
 * - Error handling and notFound routing
 * - Loading states with Suspense
 * - Type-safe props
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

interface EditSchedulePageProps {
  params: {
    id: string
  }
}

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const scheduleId = params.id

  try {
    // Fetch schedule details from Supabase
    const { data: schedule, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    // Handle fetch errors
    if (fetchError) throw fetchError
    if (!schedule) notFound()

    // Transform database data into form data
    const initialData = {
      name: schedule.name,
      description: schedule.description || '',
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      is_active: schedule.is_active ?? true,
    }

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-8">Edit Schedule</h1>
        <Suspense fallback={<ScheduleFormLoader />}>
          <ScheduleForm initialData={initialData} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading schedule:', error)
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load schedule'}
          </div>
        </div>
      </div>
    )
  }
} 