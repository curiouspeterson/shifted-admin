/**
 * Edit Schedule Client Component Module
 * Last Updated: 2024
 * 
 * Client-side component for editing schedule details. Handles the presentation
 * and interaction logic for the schedule editing interface.
 * 
 * Features:
 * - Form-based schedule editing
 * - Error state handling
 * - Navigation after save/cancel
 * - Responsive layout
 * - Type-safe props
 * 
 * Note: This component is marked with 'use client' since it requires
 * client-side interactivity for form handling and navigation.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ScheduleForm from '@/app/components/ScheduleForm'

/**
 * Props interface for the EditScheduleClient component
 * 
 * @property scheduleId - Unique identifier for the schedule being edited
 * @property initialData - Initial schedule data to populate the form
 * @property error - Error message if schedule fetch failed
 */
interface EditScheduleClientProps {
  scheduleId: string;
  initialData: {
    start_date: string;
    end_date: string;
    status: string;
    name: string;
  } | null;
  error: string | null;
}

/**
 * Edit Schedule Client Component
 * Provides the UI and interaction handlers for editing an existing schedule
 * 
 * @component
 * @param props - Component props of type EditScheduleClientProps
 * @returns React component for editing schedule details
 * 
 * @example
 * ```tsx
 * <EditScheduleClient
 *   scheduleId="123"
 *   initialData={{ name: "Week 1", status: "draft", ... }}
 *   error={null}
 * />
 * ```
 */
export default function EditScheduleClient({ scheduleId, initialData, error }: EditScheduleClientProps) {
  const router = useRouter()

  /**
   * Handles successful form submission
   * Navigates user back to schedules list
   */
  const handleSave = () => {
    router.push('/dashboard/schedules')
  }

  /**
   * Handles form cancellation
   * Navigates user back to schedules list without saving
   */
  const handleCancel = () => {
    router.push('/dashboard/schedules')
  }

  // Show error state if data fetch failed or no data found
  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error || 'Schedule not found'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <ScheduleForm
              scheduleId={scheduleId}
              initialData={initialData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 