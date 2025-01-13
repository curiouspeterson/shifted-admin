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

// Helper functions for time and shift calculations
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateShiftHours(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  
  if (endMinutes <= startMinutes) {
    // Shift crosses midnight
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
}

// Initialize daily coverage
function initializeDailyCoverage(): DailyCoverage {
  return {
    '05:00': { total: 0, supervisors: 0 },
    '09:00': { total: 0, supervisors: 0 },
    '21:00': { total: 0, supervisors: 0 },
    '01:00': { total: 0, supervisors: 0 },
  };
}

// Helper function to check if a shift covers a time block
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

// Helper function to check if we can assign consecutive days
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

// Helper function to update coverage for a shift
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

// Helper function to get all dates in a range
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

// Helper function to validate assignment
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

// Create schedule assignments
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

export default function ScheduleForm({ scheduleId, initialData, onSave, onCancel }: ScheduleFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [status] = useState(initialData?.status || 'draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEditedName, setHasEditedName] = useState(false);

  const formatDateRange = (start: string, end: string) => {
    // Ensure dates are interpreted in local timezone by appending T00:00:00
    const startDateObj = new Date(`${start}T00:00:00`);
    const endDateObj = new Date(`${end}T00:00:00`);
    return `${startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasEditedName(true);
  };

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
        // Update existing schedule via API route
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
        // Create new schedule via API route
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

        // Create schedule assignments
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
  );
} 