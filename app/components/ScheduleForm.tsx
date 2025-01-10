'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'

type Shift = Database['public']['Tables']['shifts']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type EmployeeAvailability = Database['public']['Tables']['employee_availability']['Row']

interface ScheduleFormProps {
  scheduleId?: string
  initialData?: {
    start_date: string
    end_date: string
    status: string
  }
  onSave: () => void
  onCancel: () => void
}

// Helper function to get all dates in a date range
const getDatesInRange = (startDate: Date, endDate: Date) => {
  const dates = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dates
}

export default function ScheduleForm({ scheduleId, initialData, onSave, onCancel }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(initialData?.start_date?.split('T')[0] || '')

  // Calculate end date as 14 days after start date
  const calculateEndDate = (start: string) => {
    const date = new Date(start)
    date.setDate(date.getDate() + 13) // 14 days total (bi-weekly)
    return date.toISOString().split('T')[0]
  }

  const endDate = startDate ? calculateEndDate(startDate) : ''

  const createScheduleAssignments = async (scheduleId: string, startDate: Date, endDate: Date) => {
    try {
      console.log('Creating schedule assignments...')
      
      // Get all shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
      
      console.log('Fetched shifts:', shifts)
      
      if (shiftsError) throw shiftsError
      if (!shifts?.length) throw new Error('No shifts found')

      // Get all active employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
      
      console.log('Fetched employees:', employees)
      
      if (employeesError) throw employeesError
      if (!employees?.length) throw new Error('No active employees found')

      // Get employee availability
      const { data: availability, error: availabilityError } = await supabase
        .from('employee_availability')
        .select('*')
      
      console.log('Fetched availability:', availability)
      
      if (availabilityError) throw availabilityError

      // Get all dates in the schedule period
      const dates = getDatesInRange(startDate, endDate)
      console.log('Schedule dates:', dates)

      // Create assignments for each day
      const assignments = []
      for (const date of dates) {
        const dayOfWeek = date.getDay() // 0-6, where 0 is Sunday
        
        // For each shift on this day
        for (const shift of shifts) {
          // Get available employees for this shift based on their availability
          const availableEmployees = employees.filter(employee => {
            const employeeAvailability = availability?.find(
              a => a.employee_id === employee.id && a.day_of_week === dayOfWeek
            )
            return employeeAvailability?.is_available
          })

          console.log(`Available employees for ${shift.name} on ${date.toISOString().split('T')[0]}:`, availableEmployees)

          // Ensure we have enough employees for minimum staffing
          if (availableEmployees.length < shift.min_staff_count) {
            console.warn(`Not enough available employees for ${shift.name} on ${date.toISOString().split('T')[0]}`)
            continue
          }

          // Create assignments for minimum staff count
          for (let i = 0; i < shift.min_staff_count; i++) {
            if (availableEmployees[i]) {
              assignments.push({
                schedule_id: scheduleId,
                employee_id: availableEmployees[i].id,
                shift_id: shift.id,
                date: date.toISOString().split('T')[0],
                is_supervisor_shift: shift.requires_supervisor && i === 0, // First assignment is supervisor if required
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          }
        }
      }

      console.log('Generated assignments:', assignments)

      // Insert all assignments
      if (assignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('schedule_assignments')
          .insert(assignments)
        
        if (assignmentError) throw assignmentError
        console.log('Successfully inserted assignments')
      }

    } catch (error) {
      console.error('Error creating schedule assignments:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Creating schedule...')
      const scheduleData = {
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'draft',
        version: 1,
        is_active: true
      }

      console.log('Schedule data:', scheduleData)

      if (scheduleId) {
        // Update existing schedule
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', scheduleId)
        
        if (error) throw error
      } else {
        // Create new schedule and assignments
        const { data, error } = await supabase
          .from('schedules')
          .insert([scheduleData])
          .select()
        
        if (error) throw error
        if (!data?.[0]?.id) throw new Error('Failed to create schedule')

        console.log('Created schedule:', data[0])

        // Create schedule assignments
        await createScheduleAssignments(
          data[0].id,
          new Date(startDate),
          new Date(endDate)
        )
      }

      onSave()
    } catch (error) {
      console.error('Error saving schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to save schedule')
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
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          End Date (14 days from start)
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          disabled
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-900 sm:text-sm"
        />
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