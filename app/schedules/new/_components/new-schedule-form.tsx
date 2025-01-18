/**
 * New Schedule Form Component
 * Last Updated: 2025-03-19
 * 
 * Client component for creating new schedules.
 */

'use client'

import { useRouter } from 'next/navigation'
import { ScheduleForm } from '@/app/components/schedule/schedule-form'
import type { ScheduleFormData } from '@/app/lib/schemas/forms'
import { createClientSide } from '@/app/lib/supabase/client-side'

export function NewScheduleForm() {
  const router = useRouter()
  const supabase = createClientSide()

  const handleSubmit = async (data: ScheduleFormData) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert({
          title: data.title,
          description: data.description || null,
          status: data.status,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
        })

      if (error) throw error

      router.push('/schedules')
      router.refresh()
    } catch (error) {
      console.error('Failed to create schedule:', error)
      // TODO: Add proper error handling with toast notifications
    }
  }

  return <ScheduleForm onSubmit={handleSubmit} />
} 