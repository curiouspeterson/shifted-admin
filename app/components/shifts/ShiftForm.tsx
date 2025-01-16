/**
 * Shift Form Component
 * Last Updated: 2024-01-15
 * 
 * Form for creating and editing shifts with validation and error handling.
 * Features:
 * - Type-safe form handling
 * - Zod schema validation
 * - Loading state management
 * - Error feedback
 * - Success/failure callbacks
 * - Offline support
 */

'use client'

import { z } from 'zod'
import { useForm } from '@/hooks/form/useForm'
import { AppError } from '@/lib/errors'

const REQUIREMENTS = [
  'First Aid',
  'CPR',
  'Driver License',
  'Supervisor'
] as const

// Shift form schema with validation
const shiftSchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  requirements: z.array(z.enum(REQUIREMENTS)).min(1, 'At least one requirement must be selected')
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: 'End date must be after or equal to start date' }
)

type ShiftFormData = z.infer<typeof shiftSchema>

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => Promise<void>
  isSubmitting: boolean
  isOffline: boolean
}

export function ShiftForm({ onSubmit, isSubmitting, isOffline }: ShiftFormProps) {
  const {
    values,
    handleChange,
    handleSubmit,
    setFieldValue,
    error,
    isLoading
  } = useForm<typeof shiftSchema>({
    schema: shiftSchema,
    defaultValues: {
      start_date: '',
      end_date: '',
      requirements: []
    },
    onSubmit: async (data) => {
      try {
        await onSubmit(data)
      } catch (err) {
        throw new AppError({
          code: 'API_ERROR',
          message: err instanceof Error ? err.message : 'Failed to submit shift',
          statusCode: 500
        })
      }
    }
  })

  const toggleRequirement = (req: typeof REQUIREMENTS[number]) => {
    const newReqs = values.requirements.includes(req)
      ? values.requirements.filter(r => r !== req)
      : [...values.requirements, req]
    setFieldValue('requirements', newReqs)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Range Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={values.start_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={values.end_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requirements
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {REQUIREMENTS.map((req) => (
            <label
              key={req}
              className="relative flex items-start py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="select-none font-medium text-gray-700">
                  {req}
                </div>
              </div>
              <div className="ml-3 flex h-5 items-center">
                <input
                  type="checkbox"
                  checked={values.requirements.includes(req)}
                  onChange={() => toggleRequirement(req)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error.message}</div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4">
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOffline
              ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isLoading || isSubmitting ? 'Submitting...' : isOffline ? 'Save Offline' : 'Create Shift'}
        </button>
      </div>
    </form>
  )
} 