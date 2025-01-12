'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  EmployeeAvailability,
  Shift,
  Employee,
  TimeBasedRequirement,
  EmployeeSchedulingRule,
  Assignment,
  ShiftPatternType,
  AssignmentInsert
} from '@/app/types/scheduling'

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

// Helper types and interfaces
interface TimeBlock {
  start: string;
  end: string;
  required: number;
  supervisorRequired: number;
}

interface ShiftPattern {
  type: ShiftPatternType;
  shifts: string[];
  startDate: Date;
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

// Helper functions for time calculations
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateShiftOverlap(shift: { start_time: string; end_time: string; crosses_midnight: boolean }, block: TimeBlock): number {
  const shiftStart = parseTimeToMinutes(shift.start_time);
  const shiftEnd = parseTimeToMinutes(shift.end_time);
  const blockStart = parseTimeToMinutes(block.start);
  const blockEnd = parseTimeToMinutes(block.end);

  if (shift.crosses_midnight) {
    // Handle overnight shifts
    if (shiftStart >= blockStart) {
      return Math.min(24 * 60 - shiftStart, blockEnd);
    } else {
      return Math.min(shiftEnd, blockEnd);
    }
  } else {
    // Handle regular shifts
    const start = Math.max(shiftStart, blockStart);
    const end = Math.min(shiftEnd, blockEnd);
    return Math.max(0, end - start);
  }
}

// Time blocks with requirements
const timeBlocks: TimeBlock[] = [
  { start: '05:00', end: '09:00', required: 6, supervisorRequired: 1 },
  { start: '09:00', end: '21:00', required: 8, supervisorRequired: 1 },
  { start: '21:00', end: '01:00', required: 7, supervisorRequired: 1 },
  { start: '01:00', end: '05:00', required: 6, supervisorRequired: 1 }
];

// Modified createScheduleAssignments function
const createScheduleAssignments = async (scheduleId: string, startDate: Date, endDate: Date) => {
  try {
    console.log('Creating schedule assignments...');
    
    // Get all shifts and group by duration
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time');
    
    if (shiftsError) throw shiftsError;
    if (!shifts?.length) throw new Error('No shifts found');

    const tenHourShifts = shifts.filter(s => calculateShiftHours(s.start_time, s.end_time) === 10);
    const twelveHourShifts = shifts.filter(s => calculateShiftHours(s.start_time, s.end_time) === 12);
    const fourHourShifts = shifts.filter(s => calculateShiftHours(s.start_time, s.end_time) === 4);

    // Get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*, auth_user:user_id(email)')
      .eq('is_active', true);
    
    if (employeesError) throw employeesError;
    if (!employees?.length) throw new Error('No active employees found');

    // Cast employees to include email from auth_user
    const typedEmployees = employees.map(emp => ({
      ...emp,
      email: emp.auth_user?.email || ''
    })) as Employee[];

    // Separate supervisors and dispatchers
    const supervisors = typedEmployees.filter(e => e.position === 'supervisor' || e.position === 'management');
    const dispatchers = typedEmployees.filter(e => e.position === 'dispatcher');

    // Get employee availability and rules
    const { data: availability } = await supabase
      .from('employee_availability')
      .select('*');

    const { data: schedulingRules } = await supabase
      .from('employee_scheduling_rules')
      .select('*');

    // Initialize tracking structures
    const assignments: AssignmentInsert[] = [];
    const employeePatterns: Map<string, ShiftPattern> = new Map();
    const weeklyHours: Map<string, number> = new Map();
    const coverageTracking: Map<string, Map<string, { total: number; supervisors: number }>> = new Map();

    // Get all dates in the schedule period
    const dates = getDatesInRange(startDate, endDate);

    // First, assign supervisors to ensure coverage
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Reset weekly hours on Sunday
      if (dayOfWeek === 0) {
        weeklyHours.clear();
      }

      // Initialize coverage tracking for this date
      if (!coverageTracking.has(dateStr)) {
        coverageTracking.set(dateStr, new Map());
        timeBlocks.forEach(block => {
          coverageTracking.get(dateStr)!.set(`${block.start}-${block.end}`, { total: 0, supervisors: 0 });
        });
      }

      // Assign supervisors first
      for (const supervisor of supervisors) {
        // Skip if already assigned a pattern
        if (employeePatterns.has(supervisor.id)) continue;

        // Check availability
        const canWork = availability?.find(
          a => a.employee_id === supervisor.id && a.day_of_week === dayOfWeek
        )?.is_available;

        if (!canWork) continue;

        // Try to assign a 4x10 pattern
        const pattern = tryAssignPattern(
          supervisor,
          date,
          tenHourShifts,
          ShiftPatternType.FourTen,
          dates,
          weeklyHours,
          coverageTracking
        );

        if (pattern) {
          employeePatterns.set(supervisor.id, pattern);
          // Create assignments for the pattern
          createPatternAssignments(
            pattern,
            supervisor,
            scheduleId,
            assignments,
            weeklyHours,
            shifts
          );
          
          // Update coverage tracking for supervisor
          updateCoverageTracking(
            pattern,
            supervisor,
            coverageTracking,
            shifts.find(s => s.id === pattern.shifts[0])!
          );
        }
      }
    }

    // Then assign dispatchers
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Skip if it's a new week (already handled in supervisor loop)
      if (dayOfWeek === 0) continue;

      for (const dispatcher of dispatchers) {
        // Skip if already assigned a pattern
        if (employeePatterns.has(dispatcher.id)) continue;

        // Check availability
        const canWork = availability?.find(
          a => a.employee_id === dispatcher.id && a.day_of_week === dayOfWeek
        )?.is_available;

        if (!canWork) continue;

        // Try 4x10 pattern first
        let pattern = tryAssignPattern(
          dispatcher,
          date,
          tenHourShifts,
          ShiftPatternType.FourTen,
          dates,
          weeklyHours,
          coverageTracking
        );

        // If 4x10 doesn't work, try 3x12plus4
        if (!pattern) {
          pattern = tryAssignPattern(
            dispatcher,
            date,
            twelveHourShifts,
            ShiftPatternType.ThreeTwelvePlusFour,
            dates,
            weeklyHours,
            coverageTracking
          );

          if (pattern) {
            // Find a suitable 4-hour shift for the fourth day
            const fourthDay = new Date(date);
            fourthDay.setDate(fourthDay.getDate() + 3);
            
            const suitableFourHourShift = findSuitableFourHourShift(
              fourHourShifts,
              pattern,
              coverageTracking,
              fourthDay
            );

            if (suitableFourHourShift) {
              pattern.shifts.push(suitableFourHourShift.id);
            } else {
              pattern = null;
            }
          }
        }

        if (pattern) {
          employeePatterns.set(dispatcher.id, pattern);
          // Create assignments for the pattern
          createPatternAssignments(
            pattern,
            dispatcher,
            scheduleId,
            assignments,
            weeklyHours,
            shifts
          );
          
          // Update coverage tracking for dispatcher
          updateCoverageTracking(
            pattern,
            dispatcher,
            coverageTracking,
            shifts.find(s => s.id === pattern.shifts[0])!
          );
        }
      }
    }

    // Insert all assignments
    if (assignments.length > 0) {
      console.log('Inserting assignments:', assignments);
      
      const { error: assignmentError } = await supabase
        .from('schedule_assignments')
        .insert(assignments)
        .select();
      
      if (assignmentError) {
        console.error('Assignment insert error:', assignmentError);
        throw assignmentError;
      }
      
      console.log('Successfully inserted assignments');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating schedule assignments:', error);
    throw error;
  }
};

// Helper function to try assigning a pattern
function tryAssignPattern(
  employee: any, // Keep as any since we can't guarantee all fields are non-null from DB
  startDate: Date,
  shifts: Shift[],
  patternType: ShiftPatternType,
  allDates: Date[],
  weeklyHours: Map<string, number>,
  coverageTracking: Map<string, Map<string, { total: number; supervisors: number }>>
): ShiftPattern | null {
  // For each shift, try to create a pattern starting on this date
  for (const shift of shifts) {
    // Check if we can assign this shift for the required consecutive days
    const consecutiveDays = patternType === ShiftPatternType.FourTen ? 4 : 3;
    let canAssignPattern = true;
    const patternDates: Date[] = [];
    
    // Get consecutive dates starting from startDate
    for (let i = 0; i < consecutiveDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Check if date is within schedule period
      if (!allDates.some(d => d.getTime() === date.getTime())) {
        canAssignPattern = false;
        break;
      }
      
      // Check coverage for this date and shift
      const dateStr = date.toISOString().split('T')[0];
      const coverage = coverageTracking.get(dateStr);
      if (!coverage) {
        canAssignPattern = false;
        break;
      }
      
      // Check if adding this shift would exceed requirements
      for (const block of timeBlocks) {
        const blockKey = `${block.start}-${block.end}`;
        const currentCoverage = coverage.get(blockKey);
        if (!currentCoverage) continue;
        
        const overlap = calculateShiftOverlap(shift, block);
        if (overlap > 0) {
          // If this is a supervisor, check supervisor limits
          if (employee.position === 'supervisor' || employee.position === 'management') {
            if (currentCoverage.supervisors >= block.supervisorRequired) {
              canAssignPattern = false;
              break;
            }
          }
          
          // Check total staff limits
          if (currentCoverage.total >= block.required) {
            canAssignPattern = false;
            break;
          }
        }
      }
      
      if (!canAssignPattern) break;
      patternDates.push(date);
    }
    
    // If we can assign the pattern, create it
    if (canAssignPattern) {
      return {
        type: patternType,
        shifts: new Array(consecutiveDays).fill(shift.id),
        startDate: startDate
      };
    }
  }
  
  return null;
}

// Helper function to create assignments for a pattern
function createPatternAssignments(
  pattern: ShiftPattern,
  employee: Employee,
  scheduleId: string,
  assignments: AssignmentInsert[],
  weeklyHours: Map<string, number>,
  shifts: Shift[]
) {
  const date = new Date(pattern.startDate);
  const shift = shifts.find(s => s.id === pattern.shifts[0]);
  if (!shift) return;

  for (let i = 0; i < pattern.shifts.length; i++) {
    const dateStr = new Date(date.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const shift = shifts.find(s => s.id === pattern.shifts[i]);
    if (!shift) continue;

    const assignment: AssignmentInsert = {
      schedule_id: scheduleId,
      employee_id: employee.id,
      shift_id: pattern.shifts[i],
      date: dateStr,
      is_supervisor_shift: employee.position === 'supervisor' || employee.position === 'management',
      overtime_hours: null,
      overtime_status: null
    };

    assignments.push(assignment);

    // Update weekly hours
    const currentHours = weeklyHours.get(employee.id) || 0;
    weeklyHours.set(employee.id, currentHours + calculateShiftHours(shift.start_time, shift.end_time));
  }

  // If it's a 3x12 pattern, add the 4-hour shift
  if (pattern.type === ShiftPatternType.ThreeTwelvePlusFour && pattern.shifts.length > 3) {
    const date = new Date(pattern.startDate);
    date.setDate(date.getDate() + 3);
    const dateStr = date.toISOString().split('T')[0];
    
    // Get the 4-hour shift data
    const shift = shifts.find(s => s.id === pattern.shifts[3]);
    if (!shift) return;
    
    // Create the 4-hour assignment
    const assignment: AssignmentInsert = {
      schedule_id: scheduleId,
      employee_id: employee.id,
      shift_id: pattern.shifts[3],
      date: dateStr,
      is_supervisor_shift: employee.position === 'supervisor' || employee.position === 'management',
      overtime_hours: null,
      overtime_status: null
    };
    
    assignments.push(assignment);
    
    // Update weekly hours
    const currentHours = weeklyHours.get(employee.id) || 0;
    weeklyHours.set(employee.id, currentHours + 4);
  }
}

// Helper function to find a suitable 4-hour shift
function findSuitableFourHourShift(
  fourHourShifts: any[],
  pattern: ShiftPattern,
  coverageTracking: Map<string, Map<string, { total: number; supervisors: number }>>,
  date: Date
): any {
  const dateStr = date.toISOString().split('T')[0];
  const coverage = coverageTracking.get(dateStr);
  if (!coverage) return null;

  // Try to find a 4-hour shift that helps meet coverage requirements
  return fourHourShifts.find(shift => {
    for (const block of timeBlocks) {
      const blockKey = `${block.start}-${block.end}`;
      const currentCoverage = coverage.get(blockKey);
      if (!currentCoverage) continue;

      const overlap = calculateShiftOverlap(shift, block);
      if (overlap > 0 && currentCoverage.total < block.required) {
        return true;
      }
    }
    return false;
  });
}

// Helper function to update coverage tracking
function updateCoverageTracking(
  pattern: ShiftPattern,
  employee: Employee,
  coverageTracking: Map<string, Map<string, { total: number; supervisors: number }>>,
  shift: any
) {
  const consecutiveDays = pattern.type === ShiftPatternType.FourTen ? 4 : 3;
  
  for (let i = 0; i < consecutiveDays; i++) {
    const date = new Date(pattern.startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const coverage = coverageTracking.get(dateStr);
    if (!coverage) continue;

    // Update coverage for each time block
    for (const block of timeBlocks) {
      const blockKey = `${block.start}-${block.end}`;
      const currentCoverage = coverage.get(blockKey);
      if (!currentCoverage) continue;

      const overlap = calculateShiftOverlap(shift, block);
      if (overlap > 0) {
        currentCoverage.total++;
        if (employee.position === 'supervisor' || employee.position === 'management') {
          currentCoverage.supervisors++;
        }
      }
    }
  }

  // Update coverage for 4-hour shift if applicable
  if (pattern.type === ShiftPatternType.ThreeTwelvePlusFour && pattern.shifts.length === 4) {
    const date = new Date(pattern.startDate);
    date.setDate(date.getDate() + 3);
    const dateStr = date.toISOString().split('T')[0];
    
    const coverage = coverageTracking.get(dateStr);
    if (!coverage) return;

    const fourHourShift = shift; // We should actually get this from the database
    for (const block of timeBlocks) {
      const blockKey = `${block.start}-${block.end}`;
      const currentCoverage = coverage.get(blockKey);
      if (!currentCoverage) continue;

      const overlap = calculateShiftOverlap(fourHourShift, block);
      if (overlap > 0) {
        currentCoverage.total++;
        if (employee.position === 'supervisor' || employee.position === 'management') {
          currentCoverage.supervisors++;
        }
      }
    }
  }
}

export default function ScheduleForm({ scheduleId, initialData, onSave, onCancel }: ScheduleFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [startDate, setStartDate] = useState(initialData?.start_date || '')
  const [endDate, setEndDate] = useState(initialData?.end_date || '')
  const [status] = useState(initialData?.status || 'draft')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasEditedName, setHasEditedName] = useState(false)

  const formatDateRange = (start: string, end: string) => {
    // Ensure dates are interpreted in local timezone by appending T00:00:00
    const startDateObj = new Date(`${start}T00:00:00`)
    const endDateObj = new Date(`${end}T00:00:00`)
    return `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const calculateEndDate = (start: string) => {
    if (!start) return ''
    // Ensure date is interpreted in local timezone
    const endDate = new Date(`${start}T00:00:00`)
    endDate.setDate(endDate.getDate() + 13) // 14 days total (start date + 13)
    return endDate.toISOString().split('T')[0]
  }

  // Update end date and name when start date changes
  useEffect(() => {
    if (startDate) {
      const newEndDate = calculateEndDate(startDate)
      setEndDate(newEndDate)
      
      // Only auto-update name if it hasn't been manually edited
      if (!hasEditedName) {
        setName(formatDateRange(startDate, newEndDate))
      }
    }
  }, [startDate, hasEditedName])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setHasEditedName(true)
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
          name="name"
          id="name"
          value={name}
          onChange={handleNameChange}
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
          name="startDate"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          End Date (14 days from start)
        </label>
        <input
          type="date"
          name="endDate"
          id="endDate"
          value={endDate}
          disabled
          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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