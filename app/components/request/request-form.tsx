/**
 * Request Form Component
 * Last Updated: 2024-01-15
 * 
 * Form component for creating and updating time-off requests.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

// Request form schema
const requestSchema = z.object({
  startTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  endTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be 500 characters or less'),
  type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'OTHER']),
  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .nullable()
})

type RequestFormData = z.infer<typeof requestSchema>

interface RequestFormProps {
  request?: RequestFormData
  onSubmit: (data: RequestFormData) => Promise<void>
  onCancel?: () => void
}

export default function RequestForm({ request, onSubmit, onCancel }: RequestFormProps) {
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: request || {
      startTime: '',
      endTime: '',
      reason: '',
      type: 'VACATION',
      notes: null
    }
  })

  const onFormSubmit = async (data: RequestFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save request')
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startTime" className="text-sm font-medium">
            Start Time
          </label>
          <DateTimePicker
            name="startTime"
            control={control}
            error={errors.startTime?.message}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="endTime" className="text-sm font-medium">
            End Time
          </label>
          <DateTimePicker
            name="endTime"
            control={control}
            error={errors.endTime?.message}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <Textarea
          id="reason"
          {...register('reason')}
          className={errors.reason ? 'border-red-500' : ''}
        />
        {errors.reason && (
          <p className="text-sm text-red-500">{errors.reason.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Additional Notes
        </label>
        <Textarea
          id="notes"
          {...register('notes')}
          className={errors.notes ? 'border-red-500' : ''}
        />
        {errors.notes && (
          <p className="text-sm text-red-500">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  )
} 