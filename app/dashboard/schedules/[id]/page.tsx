'use server';

import { notFound } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Employee, Assignment, Shift, TimeBasedRequirement, Schedule } from '@/app/types/scheduling';
import type { Database } from '@/lib/database.types';
import type { PostgrestError } from '@supabase/supabase-js';
import ScheduleDetailsClient from './ScheduleDetailsClient';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Initialize Supabase client
const supabase = createClientComponentClient<Database>();

// Define database types
type DbEmployee = Database['public']['Tables']['employees']['Row'];
type DbShift = Database['public']['Tables']['shifts']['Row'];
type DbAssignment = Database['public']['Tables']['schedule_assignments']['Row'];
type DbSchedule = Database['public']['Tables']['schedules']['Row'] & {
  name: string; // This field exists in the database but is missing from the generated types
};
type DbRequirement = Database['public']['Tables']['time_based_requirements']['Row'];

// Define raw assignment type with joined data
type RawAssignmentWithJoins = Database['public']['Tables']['schedule_assignments']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row'] | null;
  shift: Database['public']['Tables']['shifts']['Row'] | null;
};

// Define base assignment data without employee and shift
type BaseAssignmentData = Omit<Assignment, 'employee' | 'shift'>;

// Function to create base assignment data
function createBaseAssignmentData(raw: RawAssignmentWithJoins): BaseAssignmentData {
  return {
    id: raw.id,
    schedule_id: raw.schedule_id || '',
    employee_id: raw.employee_id || '',
    shift_id: raw.shift_id || '',
    date: raw.date,
    is_supervisor_shift: Boolean(raw.is_supervisor_shift),
    overtime_hours: typeof raw.overtime_hours === 'string' 
      ? parseFloat(raw.overtime_hours)
      : raw.overtime_hours,
    overtime_status: raw.overtime_status || null,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString()
  };
}

// Function to combine base data with employee and shift
function createAssignment(
  baseData: BaseAssignmentData,
  employee: Employee,
  shift: Shift
): Assignment {
  return {
    ...baseData,
    employee,
    shift
  };
}

// Define helper types
interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
}

interface RequirementStatus {
  requirement: TimeBasedRequirement;
  totalAssigned: number;
  supervisorsAssigned: number;
  dispatchersAssigned: number;
  isMet: boolean;
}

// Convert database schedule to client schedule
function mapDatabaseScheduleToClient(dbSchedule: DbSchedule): Schedule {
  return {
    id: dbSchedule.id,
    name: dbSchedule.name || 'Untitled Schedule',
    start_date: dbSchedule.start_date,
    end_date: dbSchedule.end_date,
    status: dbSchedule.status,
    version: dbSchedule.version,
    is_active: dbSchedule.is_active,
    created_by: dbSchedule.created_by || null,
    created_at: dbSchedule.created_at || new Date().toISOString(),
    published_at: dbSchedule.published_at || null,
    published_by: dbSchedule.published_by || null
  };
}

// Convert database requirement to client requirement
function mapDatabaseRequirementToClient(dbRequirement: DbRequirement): TimeBasedRequirement {
  return {
    id: dbRequirement.id,
    start_time: dbRequirement.start_time,
    end_time: dbRequirement.end_time,
    min_total_staff: dbRequirement.min_total_staff,
    min_supervisors: dbRequirement.min_supervisors,
    crosses_midnight: dbRequirement.crosses_midnight,
    is_active: dbRequirement.is_active,
    created_at: dbRequirement.created_at || new Date().toISOString(),
    updated_at: dbRequirement.updated_at || new Date().toISOString()
  };
}

// Add helper function to check if a shift overlaps with a requirement period
function doesShiftOverlap(shift: { start_time: string; end_time: string }, requirement: TimeBasedRequirement): boolean {
  const shiftStart = shift.start_time;
  const shiftEnd = shift.end_time;
  const reqStart = requirement.start_time;
  const reqEnd = requirement.end_time;

  // If either the shift or requirement period crosses midnight
  if (shiftEnd < shiftStart || reqEnd < reqStart) {
    // For overnight shifts/requirements, check if any part overlaps
    return true; // Simplified for now - assume overlap for overnight shifts
  }

  // Neither crosses midnight, simple overlap check
  return !(shiftEnd <= reqStart || shiftStart >= reqEnd);
}

// Add helper function to calculate requirement statuses
function calculateRequirementStatuses(assignments: Assignment[], timeRequirements: TimeBasedRequirement[]): RequirementStatus[] {
  return timeRequirements.map(requirement => {
    const overlappingAssignments = assignments.filter(assignment => 
      assignment.shift && doesShiftOverlap(assignment.shift, requirement)
    );

    const supervisors = overlappingAssignments.filter(a => a.is_supervisor_shift).length;
    const dispatchers = overlappingAssignments.filter(a => !a.is_supervisor_shift).length;
    const total = supervisors + dispatchers;

    return {
      requirement,
      totalAssigned: total,
      supervisorsAssigned: supervisors,
      dispatchersAssigned: dispatchers,
      isMet: total >= requirement.min_total_staff && supervisors >= requirement.min_supervisors
    };
  });
}

// Add type guard for database employee
function isValidDatabaseEmployee(employee: any): employee is DbEmployee {
  return (
    employee &&
    typeof employee.id === 'string' &&
    typeof employee.first_name === 'string' &&
    typeof employee.last_name === 'string' &&
    (employee.email === null || typeof employee.email === 'string') &&
    typeof employee.position === 'string' &&
    (employee.is_active === null || typeof employee.is_active === 'boolean') &&
    (employee.created_at === null || typeof employee.created_at === 'string') &&
    (employee.updated_at === null || typeof employee.updated_at === 'string')
  );
}

// Add type guard for database shift
function isValidDatabaseShift(shift: any): shift is DbShift {
  return (
    shift &&
    typeof shift.id === 'string' &&
    typeof shift.name === 'string' &&
    typeof shift.start_time === 'string' &&
    typeof shift.end_time === 'string' &&
    typeof shift.duration_hours === 'number' &&
    typeof shift.crosses_midnight === 'boolean' &&
    typeof shift.requires_supervisor === 'boolean' &&
    (shift.created_at === null || typeof shift.created_at === 'string')
  );
}

// Convert database employee to application employee
function mapDatabaseEmployeeToEmployee(dbEmployee: DbEmployee): Employee {
  return {
    id: dbEmployee.id,
    user_id: dbEmployee.user_id,
    first_name: dbEmployee.first_name,
    last_name: dbEmployee.last_name,
    email: dbEmployee.email || '', // Convert null to empty string
    phone: dbEmployee.phone?.toString() || null,
    position: dbEmployee.position,
    is_active: dbEmployee.is_active ?? false, // Convert null to false
    created_at: dbEmployee.created_at || new Date().toISOString(),
    updated_at: dbEmployee.updated_at || new Date().toISOString()
  };
}

// Convert database shift to application shift
function mapDatabaseShiftToShift(dbShift: DbShift): Shift {
  return {
    ...dbShift,
    crosses_midnight: dbShift.crosses_midnight,
    requires_supervisor: dbShift.requires_supervisor
  };
}

// Update mapping function with proper typing
function mapRawAssignmentToAssignment(rawAssignment: RawAssignmentWithJoins): Assignment | null {
  if (!rawAssignment || typeof rawAssignment.id !== 'string' || typeof rawAssignment.date !== 'string') {
    console.warn('Invalid assignment data:', rawAssignment);
    return null;
  }

  // Validate employee data
  if (!rawAssignment.employee || !isValidDatabaseEmployee(rawAssignment.employee)) {
    console.warn('Invalid employee data in assignment:', rawAssignment.id, {
      hasEmployee: !!rawAssignment.employee,
      employeeValid: rawAssignment.employee ? isValidDatabaseEmployee(rawAssignment.employee) : false
    });
    return null;
  }

  // Validate shift data
  if (!rawAssignment.shift || !isValidDatabaseShift(rawAssignment.shift)) {
    console.warn('Invalid shift data in assignment:', rawAssignment.id, {
      hasShift: !!rawAssignment.shift,
      shiftValid: rawAssignment.shift ? isValidDatabaseShift(rawAssignment.shift) : false
    });
    return null;
  }

  // Map the employee and shift data
  const mappedEmployee = mapDatabaseEmployeeToEmployee(rawAssignment.employee);
  const mappedShift = mapDatabaseShiftToShift(rawAssignment.shift);

  if (!mappedEmployee || !mappedShift) {
    console.warn('Failed to map employee or shift data:', {
      employeeMapped: !!mappedEmployee,
      shiftMapped: !!mappedShift
    });
    return null;
  }

  // Create the base assignment data
  const baseData = createBaseAssignmentData(rawAssignment);

  // Create the final assignment
  return createAssignment(baseData, mappedEmployee, mappedShift);
}

// Add function to group assignments by date and shift
function groupAssignments(assignments: Assignment[]): GroupedAssignments {
  return assignments.reduce((acc: GroupedAssignments, assignment) => {
    const date = assignment.date;
    const shiftId = assignment.shift_id;

    if (!acc[date]) {
      acc[date] = {};
    }
    
    if (shiftId) {
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = [];
      }
      acc[date][shiftId].push(assignment);
    }
    
    return acc;
  }, {});
}

export default async function ScheduleDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string }
}) {
  const resolvedParams = await Promise.resolve(params);
  const scheduleId = resolvedParams.id;

  // Get schedule details
  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from('schedules')
    .select('*')
    .eq('id', scheduleId)
    .single();

  if (scheduleError) {
    console.error('Error fetching schedule:', scheduleError);
    return (
      <div className="text-red-500">
        Error loading schedule: {scheduleError.message}
      </div>
    );
  }

  if (!schedule) {
    console.error('Schedule not found for ID:', scheduleId);
    return (
      <div className="text-red-500">
        Schedule not found
      </div>
    );
  }
  
  const { data: rawAssignments, error: assignmentsError } = await supabaseAdmin
    .from('schedule_assignments')
    .select(`
      *,
      employee:employees!schedule_assignments_employee_id_fkey (*),
      shift:shifts!schedule_assignments_shift_id_fkey (*)
    `)
    .eq('schedule_id', scheduleId);
  
  if (assignmentsError) {
    console.error('Error loading assignments:', assignmentsError);
    return (
      <div className="text-red-500">
        Error loading assignments: {assignmentsError.message}
      </div>
    );
  }

  // Map and validate assignments
  const validAssignments = (rawAssignments || [])
    .map(assignment => mapRawAssignmentToAssignment(assignment as RawAssignmentWithJoins))
    .filter((assignment): assignment is Assignment => assignment !== null);
  
  // Group assignments
  const groupedAssignments = groupAssignments(validAssignments);

  // Get time-based requirements
  const { data: rawTimeRequirements, error: requirementsError } = await supabaseAdmin
    .from('time_based_requirements')
    .select('*')
    .eq('is_active', true);

  if (requirementsError) {
    console.error('Error fetching requirements:', requirementsError);
    return (
      <div className="text-red-500">
        Error loading requirements: {requirementsError.message}
      </div>
    );
  }

  // Map requirements and calculate statuses
  const timeRequirements = (rawTimeRequirements || []).map(mapDatabaseRequirementToClient);
  const requirementStatuses = calculateRequirementStatuses(validAssignments, timeRequirements);

  return (
    <ScheduleDetailsClient
      schedule={mapDatabaseScheduleToClient(schedule as DbSchedule)}
      assignments={groupedAssignments}
      error={null}
      timeRequirements={timeRequirements}
      requirementStatuses={requirementStatuses}
    />
  );
} 