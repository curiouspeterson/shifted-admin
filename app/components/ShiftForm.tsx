'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Employee {
  id: string
  name: string
  role: string
}

interface ShiftFormProps {
  scheduleId: string
  shiftId?: string // Optional - if provided, we're editing an existing shift
  onSave: () => void
  onCancel: () => void
}

export default function ShiftForm({ scheduleId, shiftId, onSave, onCancel }: ShiftFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [employeeId, setEmployeeId] = useState('')
  const [role, setRole] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    fetchEmployees()
    if (shiftId) {
      fetchShiftDetails()
    }
  }, [shiftId])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (error) throw error

      setEmployees(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch employees')
    }
  }

  const fetchShiftDetails = async () => {
    if (!shiftId) return

    try {
      const { data, error } = await supabase
        .from('schedule_shifts')
        .select('*')
        .eq('id', shiftId)
        .single()

      if (error) throw error

      if (data) {
        setEmployeeId(data.employee_id)
        setRole(data.role)
        setStartTime(data.start_time.split('T')[1].split('.')[0]) // Extract time from ISO string
        setEndTime(data.end_time.split('T')[1].split('.')[0])
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch shift details')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const shiftData = {
        schedule_id: scheduleId,
        employee_id: employeeId,
        role,
        start_time: `${new Date().toISOString().split('T')[0]}T${startTime}:00Z`,
        end_time: `${new Date().toISOString().split('T')[0]}T${endTime}:00Z`,
      }

      const { error } = shiftId
        ? await supabase
            .from('schedule_shifts')
            .update(shiftData)
            .eq('id', shiftId)
        : await supabase
            .from('schedule_shifts')
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
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
          Employee
        </label>
        <select
          id="employee"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <input
          type="text"
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
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