'use server';

import { notFound } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Assignment, TimeBasedRequirement, Shift } from '@/app/types/scheduling';
import ScheduleDetailsClient from './ScheduleDetailsClient';

// Initialize Supabase client
const supabase = createClientComponentClient<Database>();

// Define types based on database schema
type BaseSchedule = Database['public']['Tables']['schedules']['Row'];
type DbSchedule = BaseSchedule & {
  name: string;
  updated_at: string | null;
};

type DbEmployee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: string;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  phone: string | number | null;
  default_shift: string | null;
  user_id: string | null;
};

// Update DbAssignment to match actual database structure
type DbAssignment = {
  id: string;
  schedule_id: string | null;
  employee_id: string | null;
  shift_id: string | null;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_supervisor_shift: boolean;
  overtime_hours: string | number | null;
  overtime_status: string | null;
  employees: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    position: string;
    created_at: string | null;
    updated_at: string | null;
    is_active: boolean;
    phone: string | number | null;
    default_shift: string | null;
    user_id: string | null;
  } | null;
  shifts: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    crosses_midnight: boolean;
    requires_supervisor: boolean;
    min_staff_count: number;
    created_at: string | null;
  } | null;
};

type DbRequirement = Database['public']['Tables']['time_based_requirements']['Row'];

// Add RequirementStatus interface
interface RequirementStatus {
  requirement: TimeBasedRequirement;
  totalAssigned: number;
  supervisorsAssigned: number;
  dispatchersAssigned: number;
  isMet: boolean;
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

// Define GroupedAssignments type locally to avoid conflicts
type GroupedAssignments = {
  [date: string]: {
    [shiftName: string]: Assignment[];
  };
};

// Add interface for previous schedule assignments
interface PreviousScheduleAssignments {
  date: string;
  assignments: Assignment[];
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

// Update the Employee type to match the database schema
interface Employee {
  id: string;
  first_name: string;  // Required
  last_name: string;   // Required
  email: string;       // Required
  position: string;    // Required
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;  // Required
  phone: string | null;
  default_shift: string | null;
  user_id: string | null;
}

// Update type guard to match actual structure
function isValidAssignment(assignment: any): assignment is DbAssignment {
  return (
    typeof assignment === 'object' &&
    assignment !== null &&
    typeof assignment.id === 'string' &&
    typeof assignment.date === 'string' &&
    typeof assignment.is_supervisor_shift === 'boolean' &&
    (!assignment.overtime_hours || 
      typeof assignment.overtime_hours === 'string' || 
      typeof assignment.overtime_hours === 'number')
  );
}

// Update the mapping function to handle overtime hours conversion
function mapDatabaseAssignmentToClient(dbAssignment: DbAssignment): Assignment {
  if (!dbAssignment?.employees || !dbAssignment?.shifts) {
    throw new Error('Invalid assignment data: missing employee or shift');
  }

  // Convert phone number to string if it's a number
  const phoneString = dbAssignment.employees.phone?.toString() || null;

  // Convert overtime hours to number if it's a string
  const overtimeHours = typeof dbAssignment.overtime_hours === 'string' 
    ? parseFloat(dbAssignment.overtime_hours) 
    : dbAssignment.overtime_hours;

  return {
    id: dbAssignment.id,
    date: dbAssignment.date,
    employee: {
      id: dbAssignment.employees.id,
      first_name: dbAssignment.employees.first_name || '',
      last_name: dbAssignment.employees.last_name || '',
      email: dbAssignment.employees.email,
      position: dbAssignment.employees.position || 'dispatcher',
      created_at: dbAssignment.employees.created_at || new Date().toISOString(),
      updated_at: dbAssignment.employees.updated_at || new Date().toISOString(),
      is_active: dbAssignment.employees.is_active || false,
      phone: phoneString,
      default_shift: dbAssignment.employees.default_shift,
      user_id: dbAssignment.employees.user_id
    },
    shift: {
      id: dbAssignment.shifts.id,
      name: dbAssignment.shifts.name || '',
      start_time: dbAssignment.start_time || dbAssignment.shifts.start_time,
      end_time: dbAssignment.end_time || dbAssignment.shifts.end_time,
      duration_hours: dbAssignment.shifts.duration_hours || 0,
      crosses_midnight: dbAssignment.shifts.crosses_midnight || false,
      min_staff_count: dbAssignment.shifts.min_staff_count || 1,
      requires_supervisor: dbAssignment.shifts.requires_supervisor || false,
      created_at: dbAssignment.shifts.created_at || new Date().toISOString()
    },
    is_supervisor_shift: dbAssignment.is_supervisor_shift,
    created_at: dbAssignment.created_at || new Date().toISOString(),
    updated_at: dbAssignment.updated_at || new Date().toISOString(),
    employee_id: dbAssignment.employee_id,
    shift_id: dbAssignment.shift_id,
    schedule_id: dbAssignment.schedule_id,
    overtime_hours: overtimeHours,
    overtime_status: dbAssignment.overtime_status
  };
}

// Helper function to convert database requirement to client requirement
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

// Add function to get previous schedule's last day assignments
async function getPreviousScheduleAssignments(schedule: BaseSchedule): Promise<PreviousScheduleAssignments | undefined> {
  const startDate = new Date(schedule.start_date);
  const previousDay = new Date(startDate);
  previousDay.setDate(previousDay.getDate() - 1);
  
  const formattedDate = previousDay.toISOString().split('T')[0];
  
  const { data: previousAssignments, error } = await supabase
    .from('schedule_assignments')
    .select(`
      *,
      employees (
        id,
        first_name,
        last_name,
        email,
        position,
        created_at,
        updated_at,
        is_active,
        phone,
        default_shift,
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
        min_staff_count,
        created_at
      )
    `)
    .eq('date', formattedDate);

  if (error || !previousAssignments?.length) {
    return undefined;
  }

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

interface TimeRequirement {
  id: string;
  start_time: string;
  end_time: string;
  min_total_staff: number;
  min_supervisors: number;
  crosses_midnight: boolean;
  is_active: boolean;
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
      *,
      employees (
        id,
        first_name,
        last_name,
        email,
        position,
        created_at,
        updated_at,
        is_active,
        phone,
        default_shift,
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
        min_staff_count,
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
  const { data: timeRequirements, error: requirementsError } = await supabase
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