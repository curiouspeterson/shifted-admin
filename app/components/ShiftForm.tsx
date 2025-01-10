'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

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

export default function ShiftForm({ shiftId, initialData, onSave, onCancel }: ShiftFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialData?.name || '')
  const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) || '')
  const [endTime, setEndTime] = useState(initialData?.end_time?.slice(0, 5) || '')
  const [minStaffCount, setMinStaffCount] = useState(initialData?.min_staff_count || 1)
  const [requiresSupervisor, setRequiresSupervisor] = useState(initialData?.requires_supervisor ?? true)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { durationHours, crossesMidnight } = calculateDurationAndCrossesMidnight(startTime, endTime)

      const shiftData = {
        name,
        start_time: startTime,
        end_time: endTime,
        duration_hours: durationHours,
        crosses_midnight: crossesMidnight,
        min_staff_count: minStaffCount,
        requires_supervisor: requiresSupervisor,
      }

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
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

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

      <div className="grid grid-cols-2 gap-4">
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

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
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