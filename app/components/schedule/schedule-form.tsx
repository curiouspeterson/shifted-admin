/**
 * Schedule Form Component
 * Last Updated: 2024-01-15
 * 
 * Example component demonstrating the use of background sync functionality
 * for creating and updating schedules with offline support.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBackgroundSync } from '@/lib/sync/use-background-sync'
import { Schedule, ScheduleInput, scheduleInputSchema } from '@/lib/database/schemas/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  const { status, queueCreate, queueUpdate } = useBackgroundSync()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleInputSchema),
    defaultValues: schedule ? {
      name: schedule.name,
      description: schedule.description,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      status: schedule.status,
      isActive: schedule.isActive
    } : {
      name: '',
      description: '',
      status: 'DRAFT',
      isActive: true
    }
  })

  const onSubmit = async (data: ScheduleInput) => {
    try {
      setError(null)

      if (schedule) {
        await queueUpdate('schedules', {
          id: schedule.id,
          ...data
        })
      } else {
        await queueCreate('schedules', data)
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Connection Status */}
      {!status.isOnline && (
        <Alert>
          <AlertDescription>
            You are currently offline. Changes will be synchronized when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Status */}
      {status.isSyncing && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Synchronizing changes...
          </AlertDescription>
        </Alert>
      )}

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

      {/* Description Field */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          {...register('description')}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
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
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
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
        disabled={isSubmitting || status.isSyncing}
        className="w-full"
      >
        {isSubmitting || status.isSyncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {schedule ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          schedule ? 'Update Schedule' : 'Create Schedule'
        )}
      </Button>

      {/* Sync Stats */}
      <div className="text-sm text-gray-500">
        <p>Pending: {status.stats.pending}</p>
        <p>Processing: {status.stats.processing}</p>
        <p>Completed: {status.stats.completed}</p>
        <p>Failed: {status.stats.failed}</p>
        {status.stats.lastSync && (
          <p>Last Sync: {new Date(status.stats.lastSync).toLocaleString()}</p>
        )}
      </div>
    </form>
  )
} 