/**
 * Employee Form Component
 * Last Updated: 2024
 * 
 * A form component for creating new employee records. Handles all aspects
 * of employee data collection and submission, including validation and
 * error handling. Provides a responsive layout with proper form controls
 * for each field.
 * 
 * Features:
 * - Complete employee data collection
 * - Form validation
 * - Error handling and display
 * - Loading states
 * - Responsive grid layout
 * - Cancel/Submit actions
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Employee Form Props Interface
 * @property onSave - Callback function called after successful employee creation
 * @property onCancel - Callback function called when form is cancelled
 */
interface EmployeeFormProps {
  onSave: () => void
  onCancel: () => void
}

/**
 * Employee Form Component
 * Form for creating new employee records with validation and error handling
 * 
 * @param props - Component properties
 * @param props.onSave - Success callback
 * @param props.onCancel - Cancel callback
 * @returns A form for employee data entry
 */
export default function EmployeeForm({ onSave, onCancel }: EmployeeFormProps) {
  const router = useRouter()
  
  // Form state management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Form Data State
   * Tracks all employee information fields:
   * - Personal info (name, email, phone)
   * - Employment details (position, rate, start date)
   */
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: 'employee',
    hourly_rate: '',
    start_date: '',
    phone: ''
  })

  /**
   * Form Submission Handler
   * Processes the form submission:
   * 1. Prevents default form submission
   * 2. Sets loading state
   * 3. Attempts to create employee via API
   * 4. Handles success/error cases
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create the employee via API route
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create employee')
      }

      onSave()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create employee')
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

      {/* Name Fields - Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* First Name Field */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>

        {/* Last Name Field */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Position Selection */}
      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          Position
        </label>
        <select
          id="position"
          name="position"
          value={formData.position}
          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        >
          <option value="employee">Employee</option>
          <option value="shift_supervisor">Shift Supervisor</option>
          <option value="management">Management</option>
        </select>
      </div>

      {/* Hourly Rate Field */}
      <div>
        <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
          Hourly Rate
        </label>
        <input
          type="number"
          id="hourly_rate"
          name="hourly_rate"
          value={formData.hourly_rate}
          onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

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

      {/* Phone Number Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
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
          {loading ? 'Creating...' : 'Create Employee'}
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