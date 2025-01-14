/**
 * Shift Form Component
 * Last Updated: 2024
 * 
 * A form component for creating and editing shift definitions. Handles all
 * aspects of shift configuration including time ranges, staffing requirements,
 * and supervisor requirements. Automatically calculates shift duration and
 * midnight crossing.
 * 
 * Features:
 * - Shift creation/editing
 * - Time range selection
 * - Automatic duration calculation
 * - Midnight crossing detection
 * - Staff requirements configuration
 * - Supervisor requirement toggle
 * - Validation and error handling
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Shift Form Props Interface
 * @property shiftId - ID of shift being edited (undefined for new shifts)
 * @property initialData - Initial form data for editing
 * @property onSave - Callback after successful save
 * @property onCancel - Callback when form is cancelled
 */
interface ShiftFormProps {
  shiftId?: string
  initialData?: {
    name: string
    start_time: string
    end_time: string
    duration_hours: number
    crosses_midnight: boolean
    min_staff_count: number
    requires_supervisor: boolean
  }
  onSave: () => void
  onCancel: () => void
}

/**
 * Shift Form Component
 * Form for creating and editing shift definitions
 * 
 * @param props - Component properties
 * @param props.shiftId - ID if editing existing shift
 * @param props.initialData - Initial form data
 * @param props.onSave - Success callback
 * @param props.onCancel - Cancel callback
 * @returns A form for shift creation/editing
 */
export default function ShiftForm({ shiftId, initialData, onSave, onCancel }: ShiftFormProps) {
  // Form state management
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shift data state
  const [name, setName] = useState(initialData?.name || '')
  const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) || '')
  const [endTime, setEndTime] = useState(initialData?.end_time?.slice(0, 5) || '')
  const [minStaffCount, setMinStaffCount] = useState(initialData?.min_staff_count || 1)
  const [requiresSupervisor, setRequiresSupervisor] = useState(initialData?.requires_supervisor ?? true)

  /**
   * Calculates shift duration and determines if it crosses midnight
   * Uses a base date to handle time calculations properly
   * 
   * @param start - Start time in HH:MM format
   * @param end - End time in HH:MM format
   * @returns Object containing duration in hours and midnight crossing flag
   */
  const calculateDurationAndCrossesMidnight = (start: string, end: string) => {
    const startDate = new Date(`2000-01-01T${start}:00`)
    let endDate = new Date(`2000-01-01T${end}:00`)
    
    // If end time is before start time, it means the shift crosses midnight
    if (endDate < startDate) {
      endDate = new Date(`2000-01-02T${end}:00`)
    }
    
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    const crossesMidnight = endDate.getDate() > startDate.getDate()
    
    return { durationHours, crossesMidnight }
  }

  /**
   * Form Submission Handler
   * Creates or updates shift definition with calculated duration
   * and midnight crossing status
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Calculate shift properties
      const { durationHours, crossesMidnight } = calculateDurationAndCrossesMidnight(startTime, endTime)

      // Prepare shift data
      const shiftData = {
        name,
        start_time: startTime,
        end_time: endTime,
        duration_hours: durationHours,
        crosses_midnight: crossesMidnight,
        min_staff_count: minStaffCount,
        requires_supervisor: requiresSupervisor,
      }

      // Update or create shift
      const { error } = shiftId
        ? await supabase
            .from('shifts')
            .update(shiftData)
            .eq('id', shiftId)
        : await supabase
            .from('shifts')
            .insert([shiftData])

      if (error) throw error

      onSave()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save shift')
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

      {/* Shift Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Time Range Fields */}
      <div className="grid grid-cols-2 gap-4">
        {/* Start Time Field */}
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>

        {/* End Time Field */}
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time
          </label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
          />
        </div>
      </div>

      {/* Minimum Staff Count Field */}
      <div>
        <label htmlFor="minStaffCount" className="block text-sm font-medium text-gray-700">
          Minimum Staff Count
        </label>
        <input
          type="number"
          id="minStaffCount"
          value={minStaffCount}
          onChange={(e) => setMinStaffCount(parseInt(e.target.value))}
          min="1"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      {/* Supervisor Requirement Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="requiresSupervisor"
          checked={requiresSupervisor}
          onChange={(e) => setRequiresSupervisor(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="requiresSupervisor" className="ml-2 block text-sm text-gray-900">
          Requires Supervisor
        </label>
      </div>

      {/* Form Actions */}
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
        >
          {loading ? 'Saving...' : 'Save'}
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