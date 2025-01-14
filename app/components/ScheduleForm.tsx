/**
 * Schedule Form Component
 * Last Updated: 2024
 * 
 * A complex form component for creating and editing work schedules. Handles
 * schedule creation, assignment generation, and validation. Provides an
 * interface for setting schedule parameters and automatically generates
 * optimal shift assignments based on staffing requirements.
 * 
 * Features:
 * - Schedule creation/editing
 * - Automatic 14-day period calculation
 * - Smart name generation
 * - Shift assignment generation
 * - Validation and error handling
 * - Loading states
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ShiftPatternType } from '../lib/types/scheduling'
import type { 
  BlockCoverage, 
  DailyCoverage, 
  TimeBlock, 
  ShiftPattern,
  AssignmentInsert,
  Employee,
  Shift,
  EmployeeSchedulingRule,
  Schedule
} from '../lib/types/scheduling';

/**
 * Time Calculation Helpers
 */

/**
 * Converts time string to minutes since midnight
 * @param time - Time string in HH:MM format
 * @returns Number of minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculates shift duration in hours
 * Handles shifts that cross midnight
 * @param start - Start time in HH:MM format
 * @param end - End time in HH:MM format
 * @returns Shift duration in hours
 */
function calculateShiftHours(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  
  if (endMinutes <= startMinutes) {
    // Shift crosses midnight
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
}

/**
 * Coverage Tracking Helpers
 */

/**
 * Initializes daily coverage tracking object
 * Sets up tracking for each time block with zero coverage
 */
function initializeDailyCoverage(): DailyCoverage {
  return {
    '05:00': { total: 0, supervisors: 0 },
    '09:00': { total: 0, supervisors: 0 },
    '21:00': { total: 0, supervisors: 0 },
    '01:00': { total: 0, supervisors: 0 },
  };
}

/**
 * Checks if a shift covers a specific time block
 * Handles shifts that cross midnight
 * @param shift - Shift to check
 * @param block - Time block to check against
 * @returns Whether the shift covers the time block
 */
function isShiftInTimeBlock(shift: Shift, block: { start: string; end: string }): boolean {
  const shiftStart = timeToMinutes(shift.start_time);
  const shiftEnd = timeToMinutes(shift.end_time);
  const blockStart = timeToMinutes(block.start);
  const blockEnd = timeToMinutes(block.end);
  
  // Handle shifts that cross midnight
  if (shiftEnd <= shiftStart) {
    // Shift crosses midnight
    return (shiftStart <= blockStart || shiftStart <= blockEnd) &&
           (shiftEnd >= blockStart || shiftEnd >= blockEnd);
  } else {
    // Normal shift
    return shiftStart <= blockStart && shiftEnd >= blockEnd;
  }
}

/**
 * Assignment Validation Helpers
 */

/**
 * Checks if an employee can be assigned consecutive days
 * @param employeeId - Employee to check
 * @param startDate - Start date of the assignment
 * @param requiredDays - Number of consecutive days needed
 * @param existingAssignments - Current assignments to check against
 * @returns Whether the employee can be assigned the consecutive days
 */
function canAssignConsecutiveDays(
  employeeId: string,
  startDate: Date,
  requiredDays: number,
  existingAssignments: AssignmentInsert[]
): boolean {
  for (let i = 0; i < requiredDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if employee is already assigned on this date
    if (existingAssignments.some(a => a.employee_id === employeeId && a.date === dateStr)) {
      return false;
    }
  }
  return true;
}

/**
 * Updates coverage tracking for a shift assignment
 * @param coverage - Current coverage tracking object
 * @param shift - Shift being assigned
 * @param isSupervisor - Whether the assignment is for a supervisor
 */
function updateCoverageForShift(
  coverage: DailyCoverage,
  shift: Shift,
  isSupervisor: boolean
) {
  const timeBlocks = [
    { start: '05:00', end: '09:00' },
    { start: '09:00', end: '21:00' },
    { start: '21:00', end: '01:00' },
    { start: '01:00', end: '05:00' },
  ];
  
  for (const block of timeBlocks) {
    if (isShiftInTimeBlock(shift, block)) {
      const blockCoverage = coverage[block.start];
      if (blockCoverage) {
        blockCoverage.total++;
        if (isSupervisor) {
          blockCoverage.supervisors++;
        }
      }
    }
  }
}

/**
 * Date Range Helper
 * @param startDate - Range start date
 * @param endDate - Range end date
 * @returns Array of dates in the range
 */
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

/**
 * Validates a shift assignment
 * @param assignment - Assignment to validate
 * @returns Validation result with any errors
 */
function validateAssignment(assignment: AssignmentInsert): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!assignment.schedule_id || typeof assignment.schedule_id !== 'string') {
    errors.push(`Invalid schedule_id: ${assignment.schedule_id}`);
  }
  if (!assignment.employee_id || typeof assignment.employee_id !== 'string') {
    errors.push(`Invalid employee_id: ${assignment.employee_id}`);
  }
  if (!assignment.shift_id || typeof assignment.shift_id !== 'string') {
    errors.push(`Invalid shift_id: ${assignment.shift_id}`);
  }
  if (!assignment.date || !/^\d{4}-\d{2}-\d{2}$/.test(assignment.date)) {
    errors.push(`Invalid date format: ${assignment.date}`);
  }
  if (typeof assignment.is_supervisor_shift !== 'boolean') {
    errors.push(`Invalid is_supervisor_shift: ${assignment.is_supervisor_shift}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Creates optimal shift assignments for a schedule
 * Handles supervisor coverage, employee preferences, and staffing requirements
 * @param scheduleId - Schedule to create assignments for
 * @param startDate - Schedule start date
 * @param endDate - Schedule end date
 */
async function createScheduleAssignments(scheduleId: string, startDate: Date, endDate: Date) {
  try {
    console.log('Creating schedule assignments...');
    
    // Get all shifts and group by duration
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time');
    
    if (shiftsError) throw shiftsError;
    if (!shifts?.length) throw new Error('No shifts found');

    // Get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true);
    
    if (employeesError) throw employeesError;
    if (!employees?.length) throw new Error('No active employees found');

    // Separate supervisors and dispatchers
    const supervisors = employees.filter(e => 
      e.position === 'supervisor' || 
      e.position === 'management' || 
      e.position === 'shift_supervisor'
    );
    const dispatchers = employees.filter(e => e.position === 'dispatcher');

    // Get employee scheduling rules
    const { data: schedulingRules } = await supabase
      .from('employee_scheduling_rules')
      .select('*');

    // Initialize tracking structures
    const assignments: AssignmentInsert[] = [];
    const weeklyHours: Map<string, number> = new Map();
    const coverageTracking: Map<string, DailyCoverage> = new Map();

    // Get all dates in the schedule period
    const dates = getDatesInRange(startDate, endDate);

    // Define time blocks and their requirements
    const timeBlocks = [
      { start: '05:00', end: '09:00', minEmployees: 6, minSupervisors: 1 },
      { start: '09:00', end: '21:00', minEmployees: 8, minSupervisors: 1 },
      { start: '21:00', end: '01:00', minEmployees: 7, minSupervisors: 1 },
      { start: '01:00', end: '05:00', minEmployees: 6, minSupervisors: 1 },
    ];

    // For each date in the schedule period
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Initialize coverage tracking for this date
      if (!coverageTracking.has(dateStr)) {
        coverageTracking.set(dateStr, initializeDailyCoverage());
      }
      
      // First, assign supervisors to cover all time blocks
      for (const block of timeBlocks) {
        const coverage = coverageTracking.get(dateStr)!;
        
        // Check if we need a supervisor for this block
        const blockCoverage = coverage[block.start];
        if (!blockCoverage || blockCoverage.supervisors < block.minSupervisors) {
          // Find available supervisors who:
          // 1. Haven't exceeded weekly hours
          // 2. Aren't already assigned on this date
          // 3. Match their preferred pattern
          const availableSupervisors = supervisors.filter(sup => {
            // Check weekly hours
            const currentHours = weeklyHours.get(sup.id) || 0;
            if (currentHours >= 40) return false;

            // Check if already assigned today
            if (assignments.some(a => a.employee_id === sup.id && a.date === dateStr)) {
              return false;
            }

            // Get supervisor's scheduling rules
            const rules = schedulingRules?.find(r => r.employee_id === sup.id);
            if (!rules) return true; // If no rules, assume available

            // Check pattern compatibility
            const pattern = rules.preferred_shift_pattern;
            if (pattern === ShiftPatternType.FourTen) {
              // For 4x10 pattern, ensure we have 4 consecutive days available
              return canAssignConsecutiveDays(sup.id, date, 4, assignments);
            } else {
              // For 3x12+4 pattern, ensure we have 3 consecutive days + 1 day available
              return canAssignConsecutiveDays(sup.id, date, 3, assignments);
            }
          });
          
          if (availableSupervisors.length > 0) {
            const supervisor = availableSupervisors[0];
            
            // Find a suitable shift that covers this block
            const suitableShift = shifts.find(s => {
              const shiftHours = calculateShiftHours(s.start_time, s.end_time);
              return (shiftHours === 10 || shiftHours === 12) && 
                     isShiftInTimeBlock(s, block);
            });
            
            if (suitableShift) {
              // Create the assignment
              const assignment: AssignmentInsert = {
                schedule_id: scheduleId,
                employee_id: supervisor.id,
                shift_id: suitableShift.id,
                date: dateStr,
                is_supervisor_shift: true
              };
              
              assignments.push(assignment);
              
              // Update weekly hours
              const currentHours = weeklyHours.get(supervisor.id) || 0;
              weeklyHours.set(supervisor.id, currentHours + calculateShiftHours(suitableShift.start_time, suitableShift.end_time));
              
              // Update coverage
              updateCoverageForShift(coverage, suitableShift, true);
            }
          }
        }
      }
      
      // Then assign dispatchers to meet minimum staffing requirements
      for (const block of timeBlocks) {
        const coverage = coverageTracking.get(dateStr)!;
        const blockCoverage = coverage[block.start];
        
        // Keep assigning until we meet minimum requirements
        while (blockCoverage && blockCoverage.total < block.minEmployees) {
          // Find available dispatchers
          const availableDispatchers = dispatchers.filter(disp => {
            // Check weekly hours
            const currentHours = weeklyHours.get(disp.id) || 0;
            if (currentHours >= 40) return false;

            // Check if already assigned today
            if (assignments.some(a => a.employee_id === disp.id && a.date === dateStr)) {
              return false;
            }

            // Get dispatcher's scheduling rules
            const rules = schedulingRules?.find(r => r.employee_id === disp.id);
            if (!rules) return true; // If no rules, assume available

            // Check pattern compatibility
            const pattern = rules.preferred_shift_pattern;
            if (pattern === ShiftPatternType.FourTen) {
              return canAssignConsecutiveDays(disp.id, date, 4, assignments);
            } else {
              return canAssignConsecutiveDays(disp.id, date, 3, assignments);
            }
          });
          
          if (availableDispatchers.length === 0) break; // No more available dispatchers
          
          // Find a suitable shift
          const suitableShift = shifts.find(s => {
            const shiftHours = calculateShiftHours(s.start_time, s.end_time);
            return (shiftHours === 10 || shiftHours === 12) && 
                   isShiftInTimeBlock(s, block) &&
                   !assignments.some(a => a.shift_id === s.id && a.date === dateStr);
          });
          
          if (suitableShift) {
            const dispatcher = availableDispatchers[0];
            
            // Create the assignment
            const assignment: AssignmentInsert = {
              schedule_id: scheduleId,
              employee_id: dispatcher.id,
              shift_id: suitableShift.id,
              date: dateStr,
              is_supervisor_shift: false
            };
            
            assignments.push(assignment);
            
            // Update weekly hours
            const currentHours = weeklyHours.get(dispatcher.id) || 0;
            weeklyHours.set(dispatcher.id, currentHours + calculateShiftHours(suitableShift.start_time, suitableShift.end_time));
            
            // Update coverage
            updateCoverageForShift(coverage, suitableShift, false);
          } else {
            break; // No suitable shifts available
          }
        }
      }
    }

    // Insert all assignments
    if (assignments.length > 0) {
      console.log('Inserting assignments:', assignments);
      
      try {
        // Insert in smaller batches of 20
        for (let i = 0; i < assignments.length; i += 20) {
          const batch = assignments.slice(i, i + 20);
          
          // Validate each assignment in the batch
          const validatedBatch = batch.map(assignment => {
            const shift = shifts.find(s => s.id === assignment.shift_id);
            if (!shift) {
              console.error('Could not find shift:', assignment.shift_id);
              throw new Error('Invalid shift_id');
            }
            
            const { isValid, errors } = validateAssignment(assignment);
            if (!isValid) {
              console.error('Invalid assignment:', { assignment, errors });
            }
            
            return {
              schedule_id: assignment.schedule_id,
              employee_id: assignment.employee_id,
              shift_id: assignment.shift_id,
              date: assignment.date,
              is_supervisor_shift: assignment.is_supervisor_shift
            };
          });
          
          const { error: assignmentError } = await supabase
            .from('schedule_assignments')
            .insert(validatedBatch)
            .select('schedule_id, employee_id, shift_id, date, is_supervisor_shift');
          
          if (assignmentError) {
            console.error('Assignment insert error details:', {
              code: assignmentError.code,
              message: assignmentError.message,
              details: assignmentError.details,
              hint: assignmentError.hint,
              failedBatch: validatedBatch
            });
            throw assignmentError;
          }
        }
        
        console.log('Successfully inserted all assignments');
      } catch (error: any) {
        console.error('Detailed assignment error:', {
          error,
          firstAssignment: assignments[0],
          lastAssignment: assignments[assignments.length - 1]
        });
        throw error;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating schedule assignments:', error);
    throw error;
  }
}

/**
 * Schedule Form Props Interface
 * @property scheduleId - ID of schedule being edited (undefined for new schedules)
 * @property initialData - Initial form data for editing
 * @property onSave - Callback after successful save
 * @property onCancel - Callback when form is cancelled
 */
interface ScheduleFormProps {
  scheduleId?: string;
  initialData?: {
    start_date: string;
    end_date: string;
    status: string;
    name?: string;
  };
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Schedule Form Component
 * Form for creating and editing schedules
 * 
 * @param props - Component properties
 * @param props.scheduleId - ID if editing existing schedule
 * @param props.initialData - Initial form data
 * @param props.onSave - Success callback
 * @param props.onCancel - Cancel callback
 * @returns A form for schedule creation/editing
 */
export default function ScheduleForm({ scheduleId, initialData, onSave, onCancel }: ScheduleFormProps) {
  // Form state management
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [status] = useState(initialData?.status || 'draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEditedName, setHasEditedName] = useState(false);

  /**
   * Formats a date range into a readable string
   * Used for auto-generating schedule names
   */
  const formatDateRange = (start: string, end: string) => {
    // Ensure dates are interpreted in local timezone by appending T00:00:00
    const startDateObj = new Date(`${start}T00:00:00`);
    const endDateObj = new Date(`${end}T00:00:00`);
    return `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  /**
   * Calculates end date based on start date
   * Always sets a 14-day period
   */
  const calculateEndDate = (start: string) => {
    if (!start) return '';
    // Ensure date is interpreted in local timezone
    const endDate = new Date(`${start}T00:00:00`);
    endDate.setDate(endDate.getDate() + 13); // 14 days total (start date + 13)
    return endDate.toISOString().split('T')[0];
  };

  // Update end date and name when start date changes
  useEffect(() => {
    if (startDate) {
      const newEndDate = calculateEndDate(startDate);
      setEndDate(newEndDate);
      
      // Only auto-update name if it hasn't been manually edited
      if (!hasEditedName) {
        setName(formatDateRange(startDate, newEndDate));
      }
    }
  }, [startDate, hasEditedName]);

  /**
   * Handles changes to schedule name
   * Marks the name as manually edited
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasEditedName(true);
  };

  /**
   * Form Submission Handler
   * Creates or updates schedule and generates assignments
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error('Schedule name is required');
      }

      // Get current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      const scheduleData = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        status: 'draft',
        version: 1,
        is_active: true
      };

      let schedule;
      if (scheduleId) {
        // Update existing schedule
        const response = await fetch(`/api/schedules/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update schedule');
        }

        const result = await response.json();
        schedule = result.schedule;
      } else {
        // Create new schedule
        const response = await fetch('/api/schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create schedule');
        }

        const result = await response.json();
        schedule = result.schedule;

        console.log('Created schedule:', schedule);

        // Generate initial assignments for new schedule
        await createScheduleAssignments(
          schedule.id,
          new Date(startDate),
          new Date(endDate)
        );
      }

      onSave();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError(error instanceof Error ? error.message : 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Schedule Name Field */}
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

      {/* Start Date Field */}
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

      {/* End Date Field (Read-only) */}
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
  );
} 