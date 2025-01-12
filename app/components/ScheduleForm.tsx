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
  ShiftPatternType
} from '@/app/types/scheduling'

// Define AssignmentInsert type
interface AssignmentInsert {
  schedule_id: string
  employee_id: string
  shift_id: string
  date: string
  is_supervisor_shift: boolean
}

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

// Add type definitions at the top of the file
type BlockType = 'early' | 'day' | 'night' | 'overnight';

interface CoverageCount {
  total: number;
  supervisors: number;
  dispatchers: number;
}

interface DailyCoverage {
  early: CoverageCount;
  day: CoverageCount;
  night: CoverageCount;
  overnight: CoverageCount;
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

// Add validation helper
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

// Update the coverage tracking initialization
function initializeDailyCoverage(): DailyCoverage {
  return {
    early: { total: 0, supervisors: 0, dispatchers: 0 },
    day: { total: 0, supervisors: 0, dispatchers: 0 },
    night: { total: 0, supervisors: 0, dispatchers: 0 },
    overnight: { total: 0, supervisors: 0, dispatchers: 0 }
  };
}

// Add the isTimeInRange helper function
function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = convertTimeToMinutes(time);
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);
  
  if (endMinutes < startMinutes) { // Handles overnight shifts
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes;
  }
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Update type references
const coverageTracking = new Map<string, DailyCoverage>();

// Update function signatures
function findCoverageGaps(coverage: DailyCoverage): BlockType[] {
  const gaps: BlockType[] = [];
  const timeBlocks: BlockType[] = ['early', 'day', 'night', 'overnight'];
  
  for (const block of timeBlocks) {
    if (coverage[block].total < getRequiredTotal(block)) {
      gaps.push(block);
    }
  }
  return gaps;
}

function getRequiredTotal(blockType: BlockType): number {
  switch (blockType) {
    case 'day':
      return 8;
    case 'night':
      return 7;
    default:
      return 6;
  }
}

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
      .select('*')
      .eq('is_active', true);
    
    if (employeesError) throw employeesError;
    if (!employees?.length) throw new Error('No active employees found');

    // Cast employees without email for now
    const typedEmployees = employees.map(emp => ({
      ...emp,
      email: '' // Email not needed for schedule creation
    })) as Employee[];

    // Separate supervisors and dispatchers
    const supervisors = typedEmployees.filter(e => 
      e.position === 'supervisor' || 
      e.position === 'management' || 
      e.position === 'shift_supervisor'
    );
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
    const coverageTracking: Map<string, DailyCoverage> = new Map();

    // Get all dates in the schedule period
    const dates = getDatesInRange(startDate, endDate);

    // First, assign supervisors to cover all time blocks
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Initialize coverage tracking for this date
      if (!coverageTracking.has(dateStr)) {
        coverageTracking.set(dateStr, initializeDailyCoverage());
      }
      
      // First, assign supervisors to cover all time blocks
      const timeBlockPriority: BlockType[] = ['night', 'overnight', 'early', 'day']; // Prioritize harder-to-fill shifts
      for (const blockType of timeBlockPriority) {
        const coverage = coverageTracking.get(dateStr)!;
        
        if (coverage[blockType].supervisors < 1) { // Need a supervisor
          const availableSupervisors = supervisors.filter(sup => {
            // Check if supervisor is already assigned for this date
            return !assignments.some(a => 
              a.employee_id === sup.id && 
              a.date === dateStr
            );
          });
          
          if (availableSupervisors.length > 0) {
            const supervisor = availableSupervisors[0]; // Get the first available supervisor
            // Find a suitable shift for this block
            const suitableShift = shifts.find(s => {
              const shiftHours = calculateShiftHours(s.start_time, s.end_time);
              return (shiftHours === 10 || shiftHours === 12) && // Allow both 10 and 12 hour shifts
                     isShiftInTimeBlock(s, blockType);
            });
            
            if (suitableShift) {
              assignments.push({
                schedule_id: scheduleId,
                employee_id: supervisor.id,
                shift_id: suitableShift.id,
                date: dateStr,
                is_supervisor_shift: supervisor.position === 'supervisor' || 
                                    supervisor.position === 'management' || 
                                    supervisor.position === 'shift_supervisor'
              });
              
              // Update coverage
              updateCoverageForShift(coverage, suitableShift, true, false);
            }
          }
        }
      }
      
      // Then assign dispatchers to fill remaining gaps
      for (const blockType of timeBlockPriority) {
        const coverage = coverageTracking.get(dateStr)!;
        const requiredTotal = blockType === 'day' ? 8 : blockType === 'night' ? 7 : 6;
        
        while (coverage[blockType].total < requiredTotal) {
          const availableDispatchers = dispatchers.filter(disp => {
            // Check if dispatcher is already assigned for this date
            return !assignments.some(a => 
              a.employee_id === disp.id && 
              a.date === dateStr
            );
          });
          
          if (availableDispatchers.length === 0) break; // No more available dispatchers
          
          // Find a suitable shift for this block
          const suitableShift = shifts.find(s => {
            const shiftHours = calculateShiftHours(s.start_time, s.end_time);
            return (shiftHours === 10 || shiftHours === 12) && // Allow both 10 and 12 hour shifts
                   isShiftInTimeBlock(s, blockType) &&
                   // Check if this shift is already assigned to someone else for this block
                   !assignments.some(a => 
                     a.shift_id === s.id && 
                     a.date === dateStr
                   );
          });
          
          if (suitableShift) {
            assignments.push({
              schedule_id: scheduleId,
              employee_id: availableDispatchers[0].id,
              shift_id: suitableShift.id,
              date: dateStr,
              is_supervisor_shift: false
            });
            
            // Update coverage
            updateCoverageForShift(coverage, suitableShift, false, true);
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
              is_supervisor_shift: assignment.is_supervisor_shift,
              start_time: shift.start_time,
              end_time: shift.end_time
            };
          });
          
          // Log the exact payload being sent
          console.log('Batch validation complete. Sending payload:', {
            batchNumber: i/20 + 1,
            batchSize: validatedBatch.length,
            firstItem: validatedBatch[0],
            payloadString: JSON.stringify(validatedBatch)
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
};

// Helper function to try assigning a pattern
function tryAssignPattern(
  employee: any,
  startDate: Date,
  shifts: Shift[],
  patternType: ShiftPatternType,
  allDates: Date[],
  weeklyHours: Map<string, number>,
  coverageTracking: Map<string, DailyCoverage>
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
      const blockType = getBlockTypeForShift(shift);
      if (!blockType) {
        canAssignPattern = false;
        break;
      }
      
      const currentCoverage = coverage[blockType];
      const requiredTotal = getRequiredTotal(blockType);
      
      if (currentCoverage.total >= requiredTotal) {
        canAssignPattern = false;
        break;
      }
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
      is_supervisor_shift: employee.position === 'supervisor' || 
                          employee.position === 'management' || 
                          employee.position === 'shift_supervisor'
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
      is_supervisor_shift: employee.position === 'supervisor' || 
                          employee.position === 'management' || 
                          employee.position === 'shift_supervisor'
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
  coverageTracking: Map<string, DailyCoverage>,
  date: Date
): any {
  const dateStr = date.toISOString().split('T')[0];
  const coverage = coverageTracking.get(dateStr);
  if (!coverage) return null;
  
  // Try to find a 4-hour shift that helps meet coverage requirements
  return fourHourShifts.find(shift => {
    const blockType = getBlockTypeForShift(shift);
    if (!blockType) return false;
    
    const currentCoverage = coverage[blockType];
    const requiredTotal = getRequiredTotal(blockType);
    
    return currentCoverage.total < requiredTotal;
  });
}

// Helper function to update coverage for a shift
function updateCoverageForShift(
  coverage: DailyCoverage,
  shift: Shift,
  isSupervisor: boolean,
  isDispatcher: boolean
): void {
  const blockType = getBlockTypeForShift(shift);
  if (blockType) {
    coverage[blockType].total++;
    if (isSupervisor) coverage[blockType].supervisors++;
    if (isDispatcher) coverage[blockType].dispatchers++;
  }
}

// Add helper function to determine block type
function getBlockTypeForShift(shift: Shift): BlockType | null {
  const timeBlocks = {
    early: { start: '05:00', end: '09:00' },
    day: { start: '09:00', end: '21:00' },
    night: { start: '21:00', end: '01:00' },
    overnight: { start: '01:00', end: '05:00' }
  };
  
  for (const [blockType, block] of Object.entries(timeBlocks)) {
    if (isTimeInRange(shift.start_time, block.start, block.end)) {
      return blockType as BlockType;
    }
  }
  return null;
}

// Helper function to determine if a shift falls within a time block
function isShiftInTimeBlock(shift: Shift, blockType: BlockType): boolean {
  const timeBlocks = {
    early: { start: '05:00', end: '09:00' },
    day: { start: '09:00', end: '21:00' },
    night: { start: '21:00', end: '01:00' },
    overnight: { start: '01:00', end: '05:00' }
  };
  
  const block = timeBlocks[blockType];
  return isTimeInRange(shift.start_time, block.start, block.end);
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