/**
 * Request Form Component
 * Last Updated: 2024
 * 
 * A form component for submitting time-off requests. Handles collection
 * and submission of request data, including dates, type, and reason.
 * Provides validation and error handling with a responsive layout.
 * 
 * Features:
 * - Date range selection
 * - Request type categorization
 * - Optional reason field
 * - Form validation
 * - Error handling
 * - Loading states
 * - Responsive layout
 */

'use client'

import { useState } from 'react'

/**
 * Request Form Props Interface
 * @property onSave - Callback function called after successful request submission
 * @property onCancel - Callback function called when form is cancelled
 */
interface RequestFormProps {
  onSave: () => void
  onCancel: () => void
}

/**
 * Request Form Component
 * Form for submitting time-off requests with validation and error handling
 * 
 * @param props - Component properties
 * @param props.onSave - Success callback
 * @param props.onCancel - Cancel callback
 * @returns A form for time-off request submission
 */
export default function RequestForm({ onSave, onCancel }: RequestFormProps) {
  // Form state management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Form Data State
   * Tracks all request information:
   * - Date range (start and end dates)
   * - Request type (vacation, sick, etc.)
   * - Optional reason for request
   */
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    request_type: 'vacation',
    reason: ''
  })

  /**
   * Form Submission Handler
   * Processes the form submission:
   * 1. Prevents default form submission
   * 2. Sets loading state
   * 3. Attempts to create request via API
   * 4. Handles success/error cases
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create the request via API route
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }

      onSave()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Date Range Selection - Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date Field */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>

        {/* End Date Field */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {/* Request Type Selection */}
      <div>
        <label htmlFor="request_type" className="block text-sm font-medium text-gray-700">
          Request Type
        </label>
        <select
          id="request_type"
          name="request_type"
          value={formData.request_type}
          onChange={(e) => setFormData(prev => ({ ...prev, request_type: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        >
          <option value="vacation">Vacation</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Optional Reason Field */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 