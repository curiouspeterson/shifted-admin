/**
 * Shift Form Component
 * Last Updated: 2024-03-20
 * 
 * This component provides a form for creating shifts with
 * offline support and validation.
 */

'use client'

import { useState } from 'react'
import { useFormError } from '@/hooks/useFormError'

interface ShiftFormData {
  startDate: string
  endDate: string
  requirements: string[]
}

interface ShiftFormProps {
  onSubmit: (data: ShiftFormData) => void
  isSubmitting: boolean
  isOffline: boolean
}

const REQUIREMENTS = [
  'First Aid',
  'CPR Certified',
  'Driver License',
  'Security License',
  'Food Safety',
  'Supervisor'
]

export function ShiftForm({ onSubmit, isSubmitting, isOffline }: ShiftFormProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedReqs, setSelectedReqs] = useState<string[]>([])
  const { error, validateField, handleError, clearError } = useFormError()

  const validateDates = async (start: string, end: string) => {
    if (!start || !end) return 'Both dates are required'
    if (new Date(start) >= new Date(end)) return 'End date must be after start date'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      // Validate dates
      const dateError = await validateDates(startDate, endDate)
      if (dateError) {
        handleError(new Error(dateError))
        return
      }

      // Validate requirements
      if (selectedReqs.length === 0) {
        handleError(new Error('At least one requirement must be selected'))
        return
      }

      onSubmit({
        startDate,
        endDate,
        requirements: selectedReqs
      })

      // Reset form on success
      setStartDate('')
      setEndDate('')
      setSelectedReqs([])
    } catch (err) {
      handleError(err)
    }
  }

  const toggleRequirement = (req: string) => {
    setSelectedReqs(prev =>
      prev.includes(req)
        ? prev.filter(r => r !== req)
        : [...prev, req]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        {/* Date Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
                    checked={selectedReqs.includes(req)}
                    onChange={() => toggleRequirement(req)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error.message}</div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm
            ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
        >
          {isSubmitting ? 'Saving...' : isOffline ? 'Save Offline' : 'Save'}
        </button>
      </div>
    </form>
  )
} 