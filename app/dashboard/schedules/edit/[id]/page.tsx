'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ScheduleForm from '@/app/components/ScheduleForm'

export default function EditSchedulePage({ params }: { params: { id: string } }) {
  const scheduleId = use(Promise.resolve(params.id))
  const router = useRouter()
  const [initialData, setInitialData] = useState<{
    start_date: string
    end_date: string
    status: string
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data: schedule, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', scheduleId)
          .single()

        if (error) throw error
        if (!schedule) throw new Error('Schedule not found')

        setInitialData({
          start_date: schedule.start_date,
          end_date: schedule.end_date,
          status: schedule.status,
          name: (schedule as any).name
        })
      } catch (err) {
        console.error('Error fetching schedule:', err)
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [scheduleId])

  const handleSave = () => {
    router.push('/dashboard/schedules')
  }

  const handleCancel = () => {
    router.push('/dashboard/schedules')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">Loading schedule...</div>
        </div>
      </div>
    )
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