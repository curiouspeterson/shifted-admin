'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ScheduleForm from '@/app/components/ScheduleForm'

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

export default function EditScheduleClient({ scheduleId, initialData, error }: EditScheduleClientProps) {
  const router = useRouter()

  const handleSave = () => {
    router.push('/dashboard/schedules')
  }

  const handleCancel = () => {
    router.push('/dashboard/schedules')
  }

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