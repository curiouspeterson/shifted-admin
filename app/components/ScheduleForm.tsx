'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { PostgrestError } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Shift = Database['public']['Tables']['shifts']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type EmployeeAvailability = Database['public']['Tables']['employee_availability']['Row']
type TimeBasedRequirement = Database['public']['Tables']['time_based_requirements']['Row']
type EmployeeSchedulingRule = Database['public']['Tables']['employee_scheduling_rules']['Row']

interface ScheduleFormProps {
  scheduleId?: string
  initialData?: {
    start_date: string
    end_date: string
    status: string
    name?: string
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

// Helper function to check if a time falls within a requirement period
const isTimeInRequirement = (time: string, requirement: TimeBasedRequirement): boolean => {
  if (requirement.crosses_midnight) {
    return time >= requirement.start_time || time < requirement.end_time
  }
  return time >= requirement.start_time && time < requirement.end_time
}

// Helper function to get the requirement for a specific time
const getRequirementForTime = (time: string, requirements: TimeBasedRequirement[]): TimeBasedRequirement | null => {
  return requirements.find(req => isTimeInRequirement(time, req)) || null
}

// Helper function to calculate weekly hours for an employee
const calculateWeeklyHours = (
  employeeId: string,
  assignments: any[],
  startDate: Date,
  endDate: Date
): number => {
  return assignments
    .filter(a => 
      a.employee_id === employeeId && 
      new Date(a.date) >= startDate && 
      new Date(a.date) <= endDate
    )
    .reduce((total, assignment) => total + calculateShiftHours(assignment.start_time, assignment.end_time), 0)
}

// Helper function to calculate shift hours
const calculateShiftHours = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}`)
  let end = new Date(`1970-01-01T${endTime}`)
  if (end < start) {
    end = new Date(`1970-01-02T${endTime}`)
  }
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

export default function ScheduleForm({ scheduleId, initialData, onSave, onCancel }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(initialData?.start_date?.split('T')[0] || '')
  const [name, setName] = useState(initialData?.name || '')

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

      // Get time-based requirements
      const { data: requirements, error: requirementsError } = await supabase
        .from('time_based_requirements')
        .select('*')
        .eq('is_active', true)

      console.log('Fetched time-based requirements:', requirements)

      if (requirementsError) throw requirementsError
      if (!requirements?.length) throw new Error('No active time-based requirements found')

      // Get employee scheduling rules
      const { data: schedulingRules, error: rulesError } = await supabase
        .from('employee_scheduling_rules')
        .select('*')

      console.log('Fetched employee scheduling rules:', schedulingRules)

      if (rulesError) throw rulesError

      // Get all dates in the schedule period
      const dates = getDatesInRange(startDate, endDate)
      console.log('Schedule dates:', dates)

      // Track assignments and employee schedules
      const assignments = []
      const employeeWeeklyHours: { [key: string]: number } = {}
      const employeeConsecutiveDays: { [key: string]: number } = {}

      // For each day in the schedule
      for (const date of dates) {
        const dayOfWeek = date.getDay() // 0-6, where 0 is Sunday
        
        // Reset consecutive days counter at the start of each week
        if (dayOfWeek === 0) {
          Object.keys(employeeWeeklyHours).forEach(id => {
            employeeWeeklyHours[id] = 0
          })
        }

        // For each shift
        for (const shift of shifts) {
          // Get the requirement that applies at the start of this shift
          const requirement = getRequirementForTime(shift.start_time, requirements)
          
          if (!requirement) {
            console.warn(`No staffing requirement found for ${shift.name} at ${shift.start_time}`)
            continue
          }

          // Get available employees for this shift based on their availability
          const availableEmployees = employees.filter(employee => {
            // Check availability
            const employeeAvailability = availability?.find(
              a => a.employee_id === employee.id && a.day_of_week === dayOfWeek
            )
            if (!employeeAvailability?.is_available) return false

            // Get employee's scheduling rules
            const rules = schedulingRules?.find(r => r.employee_id === employee.id)
            if (!rules) return true // If no rules, assume default

            // Check weekly hours
            const currentWeeklyHours = employeeWeeklyHours[employee.id] || 0
            const shiftHours = calculateShiftHours(shift.start_time, shift.end_time)
            if (currentWeeklyHours + shiftHours > (rules.max_weekly_hours || 40)) return false

            return true
          })

          console.log(`Available employees for ${shift.name} on ${date.toISOString().split('T')[0]}:`, availableEmployees)

          // First, assign supervisors
          let assignedCount = 0
          if (requirement.min_supervisors > 0) {
            const supervisors = availableEmployees.filter(emp => emp.position === 'supervisor')
            
            for (let i = 0; i < requirement.min_supervisors && i < supervisors.length; i++) {
              const supervisor = supervisors[i]
              assignments.push({
                schedule_id: scheduleId,
                employee_id: supervisor.id,
                shift_id: shift.id,
                date: date.toISOString().split('T')[0],
                is_supervisor_shift: true,
                start_time: shift.start_time,
                end_time: shift.end_time,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              
              // Update weekly hours
              employeeWeeklyHours[supervisor.id] = (employeeWeeklyHours[supervisor.id] || 0) + 
                calculateShiftHours(shift.start_time, shift.end_time)
              
              assignedCount++
            }
          }

          // Then assign remaining staff
          const remainingStaff = requirement.min_total_staff - assignedCount
          const availableNonSupervisors = availableEmployees.filter(emp => {
            // Filter out supervisors and employees who would exceed weekly hours
            if (emp.position === 'supervisor') return false
            
            const rules = schedulingRules?.find(r => r.employee_id === emp.id)
            if (!rules) return true

            const currentWeeklyHours = employeeWeeklyHours[emp.id] || 0
            const shiftHours = calculateShiftHours(shift.start_time, shift.end_time)
            return currentWeeklyHours + shiftHours <= (rules.max_weekly_hours || 40)
          })

          for (let i = 0; i < remainingStaff && i < availableNonSupervisors.length; i++) {
            const employee = availableNonSupervisors[i]
            assignments.push({
              schedule_id: scheduleId,
              employee_id: employee.id,
              shift_id: shift.id,
              date: date.toISOString().split('T')[0],
              is_supervisor_shift: false,
              start_time: shift.start_time,
              end_time: shift.end_time,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

            // Update weekly hours
            employeeWeeklyHours[employee.id] = (employeeWeeklyHours[employee.id] || 0) + 
              calculateShiftHours(shift.start_time, shift.end_time)
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
      if (!name.trim()) {
        throw new Error('Schedule name is required')
      }

      const scheduleData = {
        name: name.trim(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'draft',
        version: 1,
        is_active: true
      }

      if (scheduleId) {
        const { error: updateError } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', scheduleId)
        
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('schedules')
          .insert([scheduleData])
          .select()
        
        if (insertError) throw insertError
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Schedule Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter schedule name"
        />
      </div>

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