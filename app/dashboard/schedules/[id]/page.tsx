'use server';

import { notFound } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import type { Assignment, TimeBasedRequirement } from '@/app/types/scheduling';
import ScheduleDetailsClient from './ScheduleDetailsClient';

// Initialize Supabase client
const supabase = createClientComponentClient<Database>();

// Define types based on database schema
type DbSchedule = Database['public']['Tables']['schedules']['Row'];
type DbEmployee = Database['public']['Tables']['employees']['Row'];
type DbShift = Database['public']['Tables']['shifts']['Row'];
type DbAssignment = Database['public']['Tables']['schedule_assignments']['Row'];
type DbRequirement = Database['public']['Tables']['time_based_requirements']['Row'];

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
function mapDatabaseScheduleToClient(dbSchedule: DbSchedule): ClientSchedule {
  return {
    id: dbSchedule.id,
    name: 'Untitled Schedule', // Default name since it's not in the database type
    start_date: dbSchedule.start_date,
    end_date: dbSchedule.end_date,
    status: dbSchedule.status,
    version: dbSchedule.version,
    is_active: dbSchedule.is_active,
    created_by: dbSchedule.created_by,
    created_at: dbSchedule.created_at,
    updated_at: dbSchedule.created_at, // Use created_at since updated_at is not in the schema
    published_at: dbSchedule.published_at,
    published_by: dbSchedule.published_by
  };
}

// Helper function to convert database assignment to client assignment
function mapDatabaseAssignmentToClient(dbAssignment: any): Assignment {
  return {
    id: dbAssignment.id,
    date: dbAssignment.date,
    employee: {
      id: dbAssignment.employee.id,
      first_name: dbAssignment.employee.first_name,
      last_name: dbAssignment.employee.last_name,
      email: '',
      position: 'dispatcher',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      phone: null,
      default_shift: null,
      user_id: null
    },
    shift: {
      id: dbAssignment.shift.id,
      name: dbAssignment.shift.name,
      start_time: dbAssignment.shift.start_time,
      end_time: dbAssignment.shift.end_time,
      duration_hours: 0, // This should be calculated
      crosses_midnight: false, // This should be calculated
      min_staff_count: 1,
      requires_supervisor: false,
      created_at: new Date().toISOString()
    },
    is_supervisor_shift: dbAssignment.is_supervisor_shift,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee_id: dbAssignment.employee.id,
    shift_id: dbAssignment.shift.id,
    schedule_id: dbAssignment.schedule_id,
    overtime_hours: null,
    overtime_status: null
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
async function getPreviousScheduleAssignments(schedule: DbSchedule): Promise<PreviousScheduleAssignments | undefined> {
  const startDate = new Date(schedule.start_date);
  const previousDay = new Date(startDate);
  previousDay.setDate(previousDay.getDate() - 1);
  
  // Format date to YYYY-MM-DD
  const formattedDate = previousDay.toISOString().split('T')[0];
  
  // Query assignments for the previous day
  const { data: previousAssignments, error } = await supabase
    .from('schedule_assignments')
    .select(`
      id,
      employee:employees (
        id,
        first_name,
        last_name
      ),
      shift:shifts (
        id,
        name,
        start_time,
        end_time
      ),
      is_supervisor_shift,
      date
    `)
    .eq('date', formattedDate);

  if (error || !previousAssignments?.length) {
    return undefined;
  }

  return {
    date: formattedDate,
    assignments: previousAssignments.map(mapDatabaseAssignmentToClient)
  };
}

// Add type-safe approve and delete functions
async function approveSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .update({ status: 'published' })
    .eq('id', scheduleId);
  
  if (error) throw new Error(error.message);
}

async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);
  
  if (error) throw new Error(error.message);
}

export default async function ScheduleDetailsPage({ params }: { params: { id: string } }) {
  const { data: dbSchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!dbSchedule) {
    notFound();
  }

  const schedule = mapDatabaseScheduleToClient(dbSchedule);

  // Fetch assignments for this schedule
  const { data: dbAssignments, error: assignmentsError } = await supabase
    .from('schedule_assignments')
    .select(`
      id,
      employee:employees (
        id,
        first_name,
        last_name
      ),
      shift:shifts (
        id,
        name,
        start_time,
        end_time
      ),
      is_supervisor_shift,
      date
    `)
    .eq('schedule_id', params.id);

  // Fetch previous schedule's last day assignments
  const previousScheduleAssignments = await getPreviousScheduleAssignments(schedule);

  // Convert and group assignments
  const assignments = (dbAssignments || []).map(mapDatabaseAssignmentToClient);
  
  const groupedAssignments = assignments.reduce<GroupedAssignments>((acc, assignment) => {
    const date = assignment.date;
    if (!acc[date]) {
      acc[date] = {};
    }
    if (!acc[date][assignment.shift.name]) {
      acc[date][assignment.shift.name] = [];
    }
    acc[date][assignment.shift.name].push(assignment);
    return acc;
  }, {});

  // Fetch time-based requirements
  const { data: dbRequirements } = await supabase
    .from('time_based_requirements')
    .select('*');

  const timeRequirements = (dbRequirements || []).map(mapDatabaseRequirementToClient);

  return (
    <ScheduleDetailsClient
      schedule={schedule}
      assignments={groupedAssignments}
      error={assignmentsError?.message}
      timeRequirements={timeRequirements}
      requirementStatuses={[]}
      approveSchedule={approveSchedule}
      deleteSchedule={deleteSchedule}
      previousScheduleAssignments={previousScheduleAssignments}
    />
  );
} 