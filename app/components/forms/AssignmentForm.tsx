/**
 * Assignment Form Component
 * Last Updated: 2024-01-15
 * 
 * Form component for creating and updating schedule assignments.
 */

'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

// Assignment form schema
const assignmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  shiftId: z.string().min(1, 'Shift is required'),
  startTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  endTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Invalid time format')
    .refine(time => !isNaN(Date.parse(time)), 'Invalid time'),
  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .nullable()
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

interface Employee {
  id: string
  firstName: string
  lastName: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface AssignmentFormProps {
  scheduleId: string
  employees: Employee[]
  shifts: Shift[]
  assignment?: AssignmentFormData
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel?: () => void
}

export default function AssignmentForm({ 
  scheduleId,
  employees,
  shifts,
  assignment,
  onSubmit,
  onCancel
}: AssignmentFormProps) {
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: assignment || {
      employeeId: '',
      shiftId: '',
      startTime: '',
      endTime: '',
      notes: null
    }
  })

  const onFormSubmit = async (data: AssignmentFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment')
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="employeeId" className="text-sm font-medium">
          Employee
        </label>
        <Controller
          name="employeeId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.employeeId && (
          <p className="text-sm text-red-500">{errors.employeeId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="shiftId" className="text-sm font-medium">
          Shift
        </label>
        <Controller
          name="shiftId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select a shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.name} ({new Date(shift.startTime).toLocaleTimeString()} - {new Date(shift.endTime).toLocaleTimeString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.shiftId && (
          <p className="text-sm text-red-500">{errors.shiftId.message}</p>
        )}
      </div>

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
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
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
            'Save Assignment'
          )}
        </Button>
      </div>
    </form>
  )
} 