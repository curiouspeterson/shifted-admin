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
      console.log('Creating schedule assignments...');
      
      // Get all shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time');
      
      console.log('Fetched shifts:', shifts);
      
      if (shiftsError) throw shiftsError;
      if (!shifts?.length) throw new Error('No shifts found');

      // Get all active employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true);
      
      console.log('Fetched employees:', employees);
      
      if (employeesError) throw employeesError;
      if (!employees?.length) throw new Error('No active employees found');

      // Get employee availability
      const { data: availability, error: availabilityError } = await supabase
        .from('employee_availability')
        .select('*');
      
      console.log('Fetched availability:', availability);
      
      if (availabilityError) throw availabilityError;

      // Get employee scheduling rules
      const { data: schedulingRules, error: rulesError } = await supabase
        .from('employee_scheduling_rules')
        .select('*');

      console.log('Fetched employee scheduling rules:', schedulingRules);

      if (rulesError) throw rulesError;

      // Get all dates in the schedule period
      const dates = getDatesInRange(startDate, endDate);
      console.log('Schedule dates:', dates);

      // Track assignments and employee schedules
      const assignments = [];
      const employeeWeeklyHours: { [key: string]: number } = {};
      const employeeConsecutiveDays: { [key: string]: { startDate: Date | null; count: number } } = {};
      const dailyAssignments: { [key: string]: Set<string> } = {};

      // Define shift patterns
      const shiftPatterns = {
        pattern_A: { // 4 x 10-hour shifts
          daysRequired: 4,
          hoursPerShift: 10
        },
        pattern_B: { // 3 x 12-hour shifts + 1 x 4-hour shift
          daysRequired: 4,
          mainShiftHours: 12,
          shortShiftHours: 4
        }
      };

      // Helper function to check if employee can start a new pattern
      const canStartNewPattern = (employeeId: string, currentDate: Date) => {
        const consecutiveInfo = employeeConsecutiveDays[employeeId];
        if (!consecutiveInfo || !consecutiveInfo.startDate) return true;
        
        const daysSinceLastPattern = Math.floor(
          (currentDate.getTime() - consecutiveInfo.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceLastPattern >= 7; // Ensure at least 2 days off between patterns
      };

      // Process each date
      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        // Initialize tracking for this date
        if (!dailyAssignments[dateStr]) {
          dailyAssignments[dateStr] = new Set();
        }

        // Reset weekly hours on Sunday
        if (dayOfWeek === 0) {
          Object.keys(employeeWeeklyHours).forEach(id => {
            employeeWeeklyHours[id] = 0;
          });
        }

        // Group shifts by time period for staffing requirements
        const timePeriods = [
          { start: '05:00', end: '09:00', required: 6 },
          { start: '09:00', end: '21:00', required: 8 },
          { start: '21:00', end: '01:00', required: 7 },
          { start: '01:00', end: '05:00', required: 6 }
        ];

        // For each time period, ensure minimum staffing
        for (const period of timePeriods) {
          const periodShifts = shifts.filter(shift => {
            // Check if shift overlaps with this period
            if (shift.crosses_midnight) {
              return shift.start_time <= period.end || shift.end_time >= period.start;
            }
            return shift.start_time >= period.start && shift.start_time < period.end;
          });

          for (const shift of periodShifts) {
            // Calculate how many more staff we need for this period
            const currentAssignments = assignments.filter(a => 
              a.date === dateStr && 
              a.shift_id === shift.id
            );

            const neededStaff = period.required - currentAssignments.length;
            if (neededStaff <= 0) continue;

            // Find available employees who can work this shift
            const availableEmployees = employees.filter(emp => {
              // Check if already assigned this day
              if (dailyAssignments[dateStr].has(emp.id)) return false;

              // Check availability
              const empAvailability = availability?.find(
                a => a.employee_id === emp.id && a.day_of_week === dayOfWeek
              );
              if (!empAvailability?.is_available) return false;

              // Check weekly hours
              const currentHours = employeeWeeklyHours[emp.id] || 0;
              const shiftHours = calculateShiftHours(shift.start_time, shift.end_time);
              if (currentHours + shiftHours > 40) return false;

              // Check consecutive days pattern
              const consecutiveInfo = employeeConsecutiveDays[emp.id];
              if (consecutiveInfo && consecutiveInfo.count >= 4) return false;
              if (consecutiveInfo && consecutiveInfo.startDate && !canStartNewPattern(emp.id, date)) return false;

              return true;
            });

            // Sort employees by weekly hours (prioritize those with fewer hours)
            availableEmployees.sort((a, b) => 
              (employeeWeeklyHours[a.id] || 0) - (employeeWeeklyHours[b.id] || 0)
            );

            // Assign employees
            for (let i = 0; i < Math.min(neededStaff, availableEmployees.length); i++) {
              const employee = availableEmployees[i];
              const shiftHours = calculateShiftHours(shift.start_time, shift.end_time);

              // Create assignment
              assignments.push({
                schedule_id: scheduleId,
                employee_id: employee.id,
                shift_id: shift.id,
                date: dateStr,
                is_supervisor_shift: employee.position === 'supervisor',
                start_time: shift.start_time,
                end_time: shift.end_time,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

              // Update tracking
              dailyAssignments[dateStr].add(employee.id);
              employeeWeeklyHours[employee.id] = (employeeWeeklyHours[employee.id] || 0) + shiftHours;

              // Update consecutive days tracking
              if (!employeeConsecutiveDays[employee.id]) {
                employeeConsecutiveDays[employee.id] = { startDate: date, count: 1 };
              } else if (employeeConsecutiveDays[employee.id].count < 4) {
                employeeConsecutiveDays[employee.id].count++;
              }
            }
          }
        }
      }

      console.log('Generated assignments:', assignments);

      // Insert all assignments
      if (assignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('schedule_assignments')
          .insert(assignments);
        
        if (assignmentError) throw assignmentError;
        console.log('Successfully inserted assignments');
      }

    } catch (error) {
      console.error('Error creating schedule assignments:', error);
      throw error;
    }
  };

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