'use server';

import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation';
import ScheduleDetailsClient from './ScheduleDetailsClient';
import { Database } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Import types from client component to ensure consistency
type Schedule = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
};

type Shift = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  crosses_midnight: boolean;
};

type Assignment = {
  id: string;
  date: string;
  employee: Employee;
  shift: Shift;
  is_supervisor_shift: boolean;
};

type TimeRequirement = {
  startTime: string;
  endTime: string;
  totalRequired: number;
  supervisorsRequired: number;
  dispatchersRequired: number;
};

type RequirementStatus = {
  requirement: TimeRequirement;
  totalAssigned: number;
  supervisorsAssigned: number;
  dispatchersAssigned: number;
  isMet: boolean;
};

type GroupedAssignments = {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
};

// Helper function to check if a time is between two times, handling overnight periods
const isTimeBetween = (time: string, start: string, end: string): boolean => {
  if (end < start) { // Overnight period
    return time >= start || time < end;
  }
  return time >= start && time < end;
};

// Helper function to check if a shift overlaps with a requirement period
const doesShiftOverlap = (shift: Shift, requirement: TimeRequirement): boolean => {
  const shiftStart = shift.start_time;
  const shiftEnd = shift.end_time;
  const reqStart = requirement.startTime;
  const reqEnd = requirement.endTime;

  // If either the shift or requirement period crosses midnight
  if (shiftEnd < shiftStart || reqEnd < reqStart) {
    // For overnight shifts/requirements, check if any part overlaps
    if (shiftEnd < shiftStart && reqEnd < reqStart) {
      // Both shift and requirement are overnight
      return !(shiftEnd <= reqStart && shiftStart >= reqEnd);
    } else if (shiftEnd < shiftStart) {
      // Only shift is overnight
      return isTimeBetween(reqStart, shiftStart, shiftEnd) || 
             isTimeBetween(reqEnd, shiftStart, shiftEnd) ||
             (shiftStart <= reqStart && shiftEnd >= reqEnd);
    } else {
      // Only requirement is overnight
      return isTimeBetween(shiftStart, reqStart, reqEnd) ||
             isTimeBetween(shiftEnd, reqStart, reqEnd) ||
             (reqStart <= shiftStart && reqEnd >= shiftEnd);
    }
  }

  // Neither crosses midnight, simple overlap check
  return !(shiftEnd <= reqStart || shiftStart >= reqEnd);
};

// Helper function to get requirement status for a shift
const getRequirementStatus = (
  shift: Shift,
  assignments: Assignment[],
  requirements: TimeRequirement[]
): RequirementStatus | null => {
  // Find all requirements that overlap with this shift
  const overlappingReqs = requirements.filter(req => doesShiftOverlap(shift, req));
  
  if (overlappingReqs.length === 0) return null;

  // Use the most stringent requirement if multiple overlap
  const requirement = overlappingReqs.reduce((prev, curr) => {
    return (curr.totalRequired > prev.totalRequired) ? curr : prev;
  }, overlappingReqs[0]);

  const supervisors = assignments.filter(a => a.is_supervisor_shift).length;
  const dispatchers = assignments.filter(a => !a.is_supervisor_shift).length;
  const total = assignments.length;

  return {
    requirement,
    totalAssigned: total,
    supervisorsAssigned: supervisors,
    dispatchersAssigned: dispatchers,
    isMet: total >= requirement.totalRequired &&
           supervisors >= requirement.supervisorsRequired &&
           dispatchers >= requirement.dispatchersRequired
  };
};

// Server actions for schedule management
async function approveSchedule(scheduleId: string) {
  'use server'
  
  try {
    const { error } = await supabaseAdmin
      .from('schedules')
      .update({ status: 'published' })
      .eq('id', scheduleId);

    if (error) throw error;
    
    revalidatePath(`/dashboard/schedules/${scheduleId}`);
    return { success: true };
  } catch (error) {
    console.error('Error approving schedule:', error);
    return { success: false, error: 'Failed to approve schedule' };
  }
}

async function deleteSchedule(scheduleId: string) {
  'use server'
  
  try {
    // First delete all assignments
    const { error: assignmentsError } = await supabaseAdmin
      .from('schedule_assignments')
      .delete()
      .eq('schedule_id', scheduleId);

    if (assignmentsError) {
      console.error('Error deleting assignments:', assignmentsError);
      throw new Error('Failed to delete schedule assignments');
    }

    // Then delete the schedule
    const { error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (scheduleError) {
      console.error('Error deleting schedule:', scheduleError);
      throw new Error('Failed to delete schedule');
    }

    // Immediately redirect after successful deletion
    redirect('/dashboard/schedules');
  } catch (error) {
    console.error('Error in delete operation:', error);
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is expected, let it propagate
      throw error;
    }
    throw new Error('Failed to delete schedule');
  }
}

// This is a Server Component
export default async function ScheduleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  if (!scheduleId) {
    notFound();
  }

  let schedule: Schedule | null = null;
  let assignments: GroupedAssignments = {};
  let error: string | null = null;

  // Define the time-based requirements
  const timeRequirements: TimeRequirement[] = [
    {
      startTime: '05:00',
      endTime: '09:00',
      totalRequired: 6,
      supervisorsRequired: 1,
      dispatchersRequired: 5
    },
    {
      startTime: '09:00',
      endTime: '21:00',
      totalRequired: 8,
      supervisorsRequired: 1,
      dispatchersRequired: 7
    },
    {
      startTime: '21:00',
      endTime: '01:00',
      totalRequired: 7,
      supervisorsRequired: 1,
      dispatchersRequired: 6
    },
    {
      startTime: '01:00',
      endTime: '05:00',
      totalRequired: 6,
      supervisorsRequired: 1,
      dispatchersRequired: 5
    }
  ];

  try {
    // First, fetch the schedule
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .select()
      .eq('id', scheduleId)
      .maybeSingle(); // Use maybeSingle instead of single to handle not found case

    if (scheduleError) throw scheduleError;
    if (!scheduleData) {
      return notFound();
    }

    // Transform schedule data to match client expectations
    schedule = {
      id: scheduleData.id,
      name: scheduleData.name || '',
      start_date: scheduleData.start_date,
      end_date: scheduleData.end_date,
      status: scheduleData.status,
      version: scheduleData.version,
      is_active: scheduleData.is_active,
      created_by: scheduleData.created_by,
      created_at: scheduleData.created_at || '',
      updated_at: scheduleData.updated_at || ''
    };

    // Then fetch assignments with all related data
    const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
      .from('schedule_assignments')
      .select(`
        *,
        employee:employees(*),
        shift:shifts(*)
      `)
      .eq('schedule_id', scheduleId);

    if (assignmentsError) throw assignmentsError;

    // Transform and group assignments
    assignments = (assignmentsData || []).reduce<GroupedAssignments>((acc, assignment) => {
      const date = assignment.date;
      const shiftId = assignment.shift_id;

      // Ensure employee email is not null (required by client type)
      const employee = {
        ...assignment.employee,
        email: assignment.employee.email || ''
      };

      // Create transformed assignment
      const transformedAssignment: Assignment = {
        id: assignment.id,
        date: assignment.date,
        employee,
        shift: assignment.shift,
        is_supervisor_shift: assignment.is_supervisor_shift
      };

      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = [];
      }
      acc[date][shiftId].push(transformedAssignment);
      return acc;
    }, {});

    // Calculate requirement status for each shift
    const requirementStatuses = Object.values(assignments).flatMap(dateAssignments =>
      Object.entries(dateAssignments).map(([shiftId, shiftAssignments]) => {
        const shift = shiftAssignments[0]?.shift;
        if (!shift) return null;
        return getRequirementStatus(shift, shiftAssignments, timeRequirements);
      }).filter((status): status is RequirementStatus => status !== null)
    );

    return (
      <ScheduleDetailsClient 
        schedule={schedule} 
        assignments={assignments} 
        error={error}
        timeRequirements={timeRequirements}
        requirementStatuses={requirementStatuses}
        approveSchedule={approveSchedule}
        deleteSchedule={deleteSchedule}
      />
    );
  } catch (err) {
    console.error('Error fetching schedule details:', err);
    error = err instanceof Error ? err.message : 'Failed to load schedule details';
    notFound();
  }
} 