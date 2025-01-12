'use server';

import { notFound } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Assignment, TimeBasedRequirement, Shift, Employee } from '@/app/types/scheduling';
import ScheduleDetailsClient from './ScheduleDetailsClient';

/**
 * TODO: Fix type generation and database type alignment
 * 
 * Current Issues:
 * 1. Type Generation: The Supabase type generator creates nullable types for fields that are NOT NULL
 *    in the database schema. This causes type mismatches between our TypeScript types and the actual
 *    database structure.
 * 
 * 2. Type Mismatches:
 *    - Employee fields (email, is_active, created_at, updated_at) are marked as nullable in generated
 *      types but are NOT NULL in the database
 *    - overtime_hours comes back as a number but is stored as text in the database
 * 
 * Current Workarounds:
 * 1. Using runtime checks and type assertions to handle nullable fields
 * 2. Implementing type guards to validate data shape
 * 3. Converting overtime_hours between string and number as needed
 * 
 * Long-term Solutions:
 * 1. Update type generation to correctly reflect NOT NULL constraints
 * 2. Align TypeScript types with database schema
 * 3. Remove type assertions once types are properly aligned
 * 4. Consider using a schema validation library (e.g., Zod) for runtime type safety
 */

// Initialize Supabase client
const supabase = createClientComponentClient<Database>();

// Define types based on database schema
type BaseSchedule = Database['public']['Tables']['schedules']['Row'];
type DbSchedule = BaseSchedule & {
  name: string;
  updated_at: string | null;
};

// Define missing types
interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
}

interface PreviousScheduleAssignments {
  date: string;
  assignments: Assignment[];
}

// Add RequirementStatus interface
interface RequirementStatus {
  requirement: TimeBasedRequirement;
  totalAssigned: number;
  supervisorsAssigned: number;
  dispatchersAssigned: number;
  isMet: boolean;
}

// Use the database types directly
type DbShift = Database['public']['Tables']['shifts']['Row'];
type BaseDbRequirement = Database['public']['Tables']['time_based_requirements']['Row'];
type DbRequirement = Omit<BaseDbRequirement, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
};

interface DbAssignment {
  id: string;
  schedule_id: string | null;
  employee_id: string | null;
  shift_id: string | null;
  date: string;
  is_supervisor_shift: boolean;
  overtime_hours: string | number | null; // Allow both string and number
  overtime_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  employees: Employee | null;
  shifts: DbShift | null;
}

// Define client-side schedule type
interface ClientSchedule {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  published_by: string | null;
}

// Helper function to convert database schedule to client schedule
function mapDatabaseScheduleToClient(dbSchedule: BaseSchedule): ClientSchedule {
  return {
    id: dbSchedule.id,
    name: 'Untitled Schedule', // Default name since it's not in BaseSchedule
    start_date: dbSchedule.start_date,
    end_date: dbSchedule.end_date,
    status: dbSchedule.status,
    version: dbSchedule.version,
    is_active: dbSchedule.is_active,
    created_by: dbSchedule.created_by,
    created_at: dbSchedule.created_at,
    updated_at: dbSchedule.created_at, // Use created_at as fallback
    published_at: dbSchedule.published_at,
    published_by: dbSchedule.published_by
  };
}

// Helper function to convert database requirement to client requirement
function mapDatabaseRequirementToClient(dbRequirement: DbRequirement): TimeBasedRequirement {
  // We can safely assert non-null since these have NOT NULL DEFAULT now() in the database
  const created_at = dbRequirement.created_at!;
  const updated_at = dbRequirement.updated_at!;

  return {
    id: dbRequirement.id,
    start_time: dbRequirement.start_time,
    end_time: dbRequirement.end_time,
    min_total_staff: dbRequirement.min_total_staff,
    min_supervisors: dbRequirement.min_supervisors,
    crosses_midnight: dbRequirement.crosses_midnight || false,
    is_active: dbRequirement.is_active || false,
    created_at,
    updated_at
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

// Type guard for database assignments
function isValidAssignment(assignment: any): assignment is DbAssignment {
  return (
    assignment &&
    typeof assignment.id === 'string' &&
    typeof assignment.date === 'string' &&
    typeof assignment.is_supervisor_shift === 'boolean' &&
    (!assignment.overtime_hours || typeof assignment.overtime_hours === 'string' || typeof assignment.overtime_hours === 'number') &&
    assignment.employees &&
    assignment.shifts &&
    typeof assignment.employees.id === 'string' &&
    typeof assignment.employees.first_name === 'string' &&
    typeof assignment.employees.last_name === 'string' &&
    typeof assignment.employees.email === 'string' &&
    typeof assignment.employees.position === 'string' &&
    typeof assignment.employees.is_active === 'boolean' &&
    typeof assignment.employees.created_at === 'string' &&
    typeof assignment.employees.updated_at === 'string'
  );
}

// Update the mapping function to handle database types
function mapDatabaseAssignmentToClient(dbAssignment: DbAssignment): Assignment {
  if (!dbAssignment.employees || !dbAssignment.shifts) {
    throw new Error('Invalid assignment data: missing employee or shift');
  }

  // Ensure email is not null as required by the Employee type
  if (!dbAssignment.employees.email) {
    throw new Error('Invalid employee data: missing email');
  }

  // Handle overtime_hours that might come back as a number despite the text cast
  const overtimeHours = typeof dbAssignment.overtime_hours === 'number' 
    ? dbAssignment.overtime_hours.toString()
    : dbAssignment.overtime_hours;

  return {
    id: dbAssignment.id,
    schedule_id: dbAssignment.schedule_id || '',
    employee_id: dbAssignment.employee_id || '',
    shift_id: dbAssignment.shift_id || '',
    date: dbAssignment.date,
    is_supervisor_shift: dbAssignment.is_supervisor_shift,
    overtime_hours: overtimeHours ? parseFloat(overtimeHours) : null,
    overtime_status: dbAssignment.overtime_status || null,
    created_at: dbAssignment.created_at || new Date().toISOString(),
    updated_at: dbAssignment.updated_at || new Date().toISOString(),
    employee: {
      ...dbAssignment.employees,
      email: dbAssignment.employees.email // This is now guaranteed to be non-null
    },
    shift: dbAssignment.shifts
  };
}

// Get previous schedule's last day assignments
async function getPreviousScheduleAssignments(schedule: BaseSchedule): Promise<PreviousScheduleAssignments | undefined> {
  const startDate = new Date(schedule.start_date);
  const previousDay = new Date(startDate);
  previousDay.setDate(previousDay.getDate() - 1);
  
  const formattedDate = previousDay.toISOString().split('T')[0];

  // Define the exact shape we get from the database
  type RawAssignment = {
    id: string;
    schedule_id: string | null;
    employee_id: string | null;
    shift_id: string | null;
    date: string;
    is_supervisor_shift: boolean;
    overtime_hours: number | null;
    overtime_status: string | null;
    created_at: string | null;
    updated_at: string | null;
    employees: {
      id: string;
      user_id: string | null;
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      position: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    shifts: DbShift | null;
  };
  
  // TODO: Fix type generation for the employees table
  // Currently, the generated types show nullable fields for columns that are NOT NULL in the database
  // This causes type mismatches between our Employee type and the database types
  // For now, we're using type assertions to handle this, but we should:
  // 1. Update the type generation to correctly reflect NOT NULL constraints
  // 2. Remove the type assertions once the types are fixed
  const { data: rawAssignments, error } = await supabase
    .from('schedule_assignments')
    .select(`
      id,
      schedule_id,
      employee_id,
      shift_id,
      date,
      is_supervisor_shift,
      overtime_hours,
      overtime_status,
      created_at,
      updated_at,
      employees!inner (
        id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        position,
        is_active,
        created_at,
        updated_at
      ),
      shifts (*)
    `)
    .eq('date', formattedDate);

  if (error || !rawAssignments?.length) {
    return undefined;
  }

  // Type guard to ensure employee data is present and valid
  function isValidRawAssignment(raw: any): raw is RawAssignment {
    return (
      raw &&
      typeof raw.id === 'string' &&
      typeof raw.date === 'string' &&
      typeof raw.is_supervisor_shift === 'boolean' &&
      raw.employees &&
      typeof raw.employees.id === 'string' &&
      typeof raw.employees.first_name === 'string' &&
      typeof raw.employees.last_name === 'string' &&
      typeof raw.employees.email === 'string' &&
      typeof raw.employees.position === 'string' &&
      typeof raw.employees.is_active === 'boolean' &&
      typeof raw.employees.created_at === 'string' &&
      typeof raw.employees.updated_at === 'string'
    );
  }

  // Filter and map the assignments using our type guard
  const validRawAssignments = rawAssignments.filter(isValidRawAssignment);

  // Map raw assignments to DbAssignment type
  const previousAssignments = validRawAssignments.map(raw => {
    // Our type guard ensures raw.employees exists, but TypeScript doesn't recognize this
    // Add a runtime check to satisfy the type checker
    if (!raw.employees) {
      throw new Error('Employee data missing after validation');
    }

    // First create the employee object with the correct shape
    const employee: Employee = {
      id: raw.employees.id,
      user_id: raw.employees.user_id,
      first_name: raw.employees.first_name,
      last_name: raw.employees.last_name,
      email: raw.employees.email,
      phone: raw.employees.phone,
      position: raw.employees.position,
      is_active: raw.employees.is_active,
      created_at: raw.employees.created_at,
      updated_at: raw.employees.updated_at
    };

    // Then create the full assignment
    return {
      id: raw.id,
      schedule_id: raw.schedule_id,
      employee_id: raw.employee_id,
      shift_id: raw.shift_id,
      date: raw.date,
      is_supervisor_shift: raw.is_supervisor_shift,
      overtime_hours: raw.overtime_hours ? raw.overtime_hours.toString() : null,
      overtime_status: raw.overtime_status,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      employees: employee,
      shifts: raw.shifts
    } satisfies DbAssignment;
  });

  const validAssignments = previousAssignments.filter(isValidAssignment);

  return {
    date: formattedDate,
    assignments: validAssignments.map(mapDatabaseAssignmentToClient)
  };
}

// Add helper function to calculate requirement statuses
function calculateRequirementStatuses(assignments: DbAssignment[] | null, timeRequirements: TimeBasedRequirement[]): RequirementStatus[] {
  if (!assignments) {
    // Return default statuses if no assignments
    return timeRequirements.map(requirement => ({
      requirement,
      totalAssigned: 0,
      supervisorsAssigned: 0,
      dispatchersAssigned: 0,
      isMet: false
    }));
  }

  return timeRequirements.map(requirement => {
    const overlappingAssignments = assignments.filter(assignment => 
      assignment.shifts && doesShiftOverlap(assignment.shifts, requirement)
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

// Update the group assignments logic to use type guard
function groupAssignments(rawAssignments: any[]): GroupedAssignments {
  const validAssignments = rawAssignments.filter(isValidAssignment);
  
  return validAssignments.reduce((acc: GroupedAssignments, assignment) => {
    const date = assignment.date;
    const shiftId = assignment.shift_id;

    if (!acc[date]) {
      acc[date] = {};
    }
    
    if (shiftId) {
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = [];
      }
      acc[date][shiftId].push(mapDatabaseAssignmentToClient(assignment));
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
  const { data: schedule, error: scheduleError } = await supabase
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
    return (
      <div className="text-red-500">
        Schedule not found
      </div>
    );
  }

  // Get assignments for this schedule
  const { data: assignments, error: assignmentsError } = await supabase
    .from('schedule_assignments')
    .select(`
      id,
      schedule_id,
      employee_id,
      shift_id,
      date,
      is_supervisor_shift,
      overtime_hours,
      overtime_status,
      created_at,
      updated_at,
      employees!inner (
        id,
        first_name,
        last_name,
        email,
        position,
        created_at,
        updated_at,
        is_active,
        phone,
        user_id
      ),
      shifts (
        id,
        name,
        start_time,
        end_time,
        duration_hours,
        crosses_midnight,
        requires_supervisor,
        created_at
      )
    `)
    .eq('schedule_id', scheduleId);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    return (
      <div className="text-red-500">
        Error loading assignments: {assignmentsError.message}
      </div>
    );
  }

  // Get time-based requirements
  const { data: rawTimeRequirements, error: requirementsError } = await supabase
    .from('time_based_requirements')
    .select('*');

  if (requirementsError) {
    console.error('Error fetching requirements:', requirementsError);
    return (
      <div className="text-red-500">
        Error loading requirements: {requirementsError.message}
      </div>
    );
  }

  // Assert timestamps are non-null since they have NOT NULL DEFAULT now() in the database
  const timeRequirements = (rawTimeRequirements || []).map(req => ({
    ...req,
    created_at: req.created_at!,
    updated_at: req.updated_at!
  })) as DbRequirement[];

  // Get previous schedule assignments if needed
  const previousScheduleAssignments = await getPreviousScheduleAssignments(schedule);

  // Calculate requirement statuses
  const requirementStatuses = calculateRequirementStatuses(assignments, timeRequirements);

  // Group assignments by date and shift
  const groupedAssignments = groupAssignments(assignments);

  return (
    <ScheduleDetailsClient
      schedule={mapDatabaseScheduleToClient(schedule)}
      assignments={groupedAssignments}
      error={null}
      timeRequirements={timeRequirements.map(mapDatabaseRequirementToClient)}
      requirementStatuses={requirementStatuses}
      previousScheduleAssignments={previousScheduleAssignments}
    />
  );
} 