/**
 * Schedule Form Component
 * Last Updated: 2024-01-16
 * 
 * A client component for creating and editing schedules.
 * Uses server actions for mutations and handles loading states.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createSchedule, updateSchedule } from '@/lib/actions/schedule'
import { Schedule, ScheduleInput, scheduleInputSchema, ScheduleStatus } from '@/lib/database/schemas/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface ScheduleFormProps {
  schedule?: Schedule
  onSuccess?: () => void
}

export function ScheduleForm({ schedule, onSuccess }: ScheduleFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleInputSchema),
    defaultValues: schedule ? {
      name: schedule.name,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      status: schedule.status,
      isActive: schedule.isActive
    } : {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ScheduleStatus.DRAFT,
      isActive: true
    }
  })

  const onSubmit = async (data: ScheduleInput) => {
    try {
      setError(null)
      setIsSubmitting(true)

      if (schedule) {
        await updateSchedule(schedule.id, {
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status.toLowerCase() as 'draft' | 'published' | 'archived',
          is_active: data.isActive
        })
      } else {
        await createSchedule({
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status.toLowerCase() as 'draft' | 'published' | 'archived',
          is_active: data.isActive
        })
      }

      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Date Range Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            Start Date
          </label>
          <DatePicker
            name="startDate"
            control={control}
            error={errors.startDate?.message}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="endDate" className="text-sm font-medium">
            End Date
          </label>
          <DatePicker
            name="endDate"
            control={control}
            error={errors.endDate?.message}
          />
        </div>
      </div>

      {/* Status Field */}
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          {...register('status')}
          className={`w-full rounded-md border ${
            errors.status ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2`}
        >
          <option value={ScheduleStatus.DRAFT}>Draft</option>
          <option value={ScheduleStatus.PUBLISHED}>Published</option>
          <option value={ScheduleStatus.ARCHIVED}>Archived</option>
        </select>
        {errors.status && (
          <p className="text-sm text-red-500">{errors.status.message}</p>
        )}
      </div>

      {/* Active Switch */}
      <div className="flex items-center justify-between">
        <label htmlFor="isActive" className="text-sm font-medium">
          Active
        </label>
        <Switch
          id="isActive"
          {...register('isActive')}
          defaultChecked={schedule?.isActive ?? true}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {schedule ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          schedule ? 'Update Schedule' : 'Create Schedule'
        )}
      </Button>
    </form>
  )
} 