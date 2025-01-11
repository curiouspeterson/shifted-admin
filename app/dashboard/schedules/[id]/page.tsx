'use server';

import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation';
import ScheduleDetailsClient from './ScheduleDetailsClient';
import { Database } from '@/lib/database.types';

type Schedule = Database['public']['Tables']['schedules']['Row'];
type Assignment = Database['public']['Tables']['schedule_assignments']['Row'] & {
  employee: Database['public']['Tables']['employees']['Row'];
  shift: Database['public']['Tables']['shifts']['Row'];
};

type GroupedAssignments = {
  [date: string]: {
    [shiftId: string]: Assignment[];
  };
};

// This is a Server Component
export default async function ScheduleDetailsPage({ params }: { params: { id: string } }) {
  const scheduleId = await Promise.resolve(params.id);
  if (!scheduleId) {
    notFound();
  }

  let schedule: Schedule | null = null;
  let assignments: GroupedAssignments = {};
  let error: string | null = null;

  try {
    // First, fetch the schedule
    const { data: scheduleData, error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .select()
      .eq('id', scheduleId)
      .single();

    if (scheduleError) throw scheduleError;
    if (!scheduleData) {
      notFound();
    }

    schedule = scheduleData;

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

    // Group assignments by date and shift
    assignments = (assignmentsData || []).reduce<GroupedAssignments>((acc, assignment) => {
      const date = assignment.date;
      const shiftId = assignment.shift_id;

      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = [];
      }
      acc[date][shiftId].push(assignment as Assignment);
      return acc;
    }, {});
  } catch (err) {
    console.error('Error fetching schedule details:', err);
    error = err instanceof Error ? err.message : 'Failed to load schedule details';
    notFound();
  }

  return (
    <ScheduleDetailsClient schedule={schedule} assignments={assignments} error={error} />
  );
} 